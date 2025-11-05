<template>
  <el-card class="card">
    <!-- Фильтры и кнопка Refresh — во всех режимах -->
    <div class="filters">
      <el-input v-model="q" placeholder="Search service/sailing…" clearable @input="debouncedLoad" />
      <el-input v-model="guide" placeholder="Guide name/email…" clearable @input="debouncedLoad" />
      <el-input v-model="sailing" placeholder="Sailing" clearable @input="debouncedLoad" />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="to"
        start-placeholder="From"
        end-placeholder="To"
        @change="onFilterChange"
      />
      <el-select v-model="status" placeholder="Status" clearable @change="onFilterChange" style="min-width:160px">
        <el-option label="Tentative" value="tentative" />
        <el-option label="Confirmed" value="confirmed" />
        <el-option label="CXL Requested" value="cxl_requested" />
        <el-option label="CXL" value="cxl" />
      </el-select>
      <el-button @click="load" :loading="loading">Refresh</el-button>
    </div>
    </el-card>
     <el-card class="card">
    <el-table :data="visibleRows" v-loading="loading" style="width:100%">
      <!-- базовые поля -->
      <el-table-column prop="sailing" label="Sailing" width="150" />
      <el-table-column prop="date" label="Date" width="120" />
      <el-table-column prop="service" label="Service" min-width="260" />

      <!-- колонка статуса для user режимов -->
      <el-table-column v-if="!isAdminMode" label="My status" width="160">
        <template #default="{ row }">
          <el-tag :type="statusType(row._myStatus)">{{ statusLabel(row._myStatus) }}</el-tag>
        </template>
      </el-table-column>

      <!-- ADMIN: колонка Guide (confirmed -> tag+Cancel, иначе combobox) -->
      <el-table-column v-if="isAdminMode" label="Guide" min-width="320">
        <template #default="{ row }">
          <template v-if="row.confirmed?.user_id">
            <span class="guide-name">{{ displayForUser(row.confirmed.user_id, row) }}</span>
            <el-tag type="success" effect="light" class="ml-2">Confirmed</el-tag>
            <el-button class="ml-2" size="small" type="danger" :loading="row._busy" @click="cancelConfirmed(row)">Cancel</el-button>
          </template>
          <template v-else>
            <el-select v-model="row._selected" placeholder="Select guide" filterable clearable style="width:100%">
              <el-option
                v-for="c in (row.candidates || [])"
                :key="c.user_id"
                :label="formatGuide(c)"
                :value="c.user_id"
              >
                <div class="opt">
                  <span>{{ c.display_name || c.email || c.user_id }}</span>
                  <el-tag size="small" :type="statusType(c.status)">{{ statusLabel(c.status) }}</el-tag>
                </div>
              </el-option>
            </el-select>
          </template>
        </template>
      </el-table-column>

      <!-- Операции -->
      <el-table-column label="Operations" :width="isAdminMode ? 280 : 240">
        <template #default="{ row }">
          <!-- USER MODES -->
          <template v-if="!isAdminMode">
            <el-button v-if="row._myStatus==='none' || row._myStatus==='cxl'" size="small" :loading="row._busy" @click="selectService(row)">
              Select
            </el-button>
            <el-button v-if="row._myStatus==='tentative'" size="small" :loading="row._busy" @click="unselectService(row)">
              Unselect
            </el-button>
            <el-button v-if="row._myStatus==='confirmed'" size="small" type="warning" :loading="row._busy" @click="requestCxl(row)">
              Request CXL
            </el-button>
          </template>

          <!-- ADMIN MODE -->
          <template v-else>
            <el-button
              v-if="!row.confirmed?.user_id"
              type="primary"
              size="small"
              :disabled="!row._selected"
              :loading="row._busy"
              @click="confirm(row)"
            >Confirm</el-button>

            <el-button
              v-if="showApproveCxl(row)"
              type="warning" size="small"
              :loading="row._busy"
              @click="approveCxl(row)"
            >Approve CXL</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- Пагинация — во всех режимах -->
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="perPage"
        :current-page="page"
        :total="count"
        @current-change="onPage"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import useSupabase from '~/composables/useSupabase'
import { useDataStore } from '~/stores/data'

const props = defineProps({
  mode: { type: String, default: 'all' } // all | mine | admin
})

const { supabase } = useSupabase()
const dataStore = useDataStore()

const isAdminMode = computed(() => props.mode === 'admin')

/** фильтры/пагинация общие */
const q = ref('')
const guide = ref('')
const sailing = ref('')
const status = ref('')
const dateRange = ref([])
const page = ref(1)
const perPage = ref(20)
const count = ref(0)

const user = ref(null)
const rows = ref([])        // в admin — серверные items; в user — локально собранный список
const loading = ref(false)
let channel = null

const statusLabel = (s) => ({
  none: 'Not Selected',
  tentative: 'Tentative',
  confirmed: 'Confirmed',
  cxl_requested: 'CXL Requested',
  cxl: 'Cancelled'
}[s || 'none'])

const statusType = (s) => ({
  none: '',
  tentative: 'info',
  confirmed: 'success',
  cxl_requested: 'warning',
  cxl: 'danger'
}[s || 'none'])

/** Виденые строки:
 *  - admin: rows как есть (сервер уже вернул страницу)
 *  - user (all/mine): применяем локально фильтры + пагинацию
 */
const visibleRows = computed(() => {
  if (isAdminMode.value) return rows.value

  // локальная фильтрация/пагинация
  const [from, to] = dateRange.value || []
  const df = from ? new Date(from).toISOString().slice(0,10) : null
  const dt = to ? new Date(to).toISOString().slice(0,10) : null
  const ql = (q.value || '').toLowerCase()
  const sail = (sailing.value || '').toLowerCase()

  let merged = (rows.value || []).slice()

  // mode="mine" — только выбранные мною
  if (props.mode === 'mine') {
    merged = merged.filter(r => r._myStatus && r._myStatus !== 'none')
  }

  merged = merged.filter(r => {
    const matchesSearch =
      !ql ||
      String(r.service || '').toLowerCase().includes(ql) ||
      String(r.sailing || '').toLowerCase().includes(ql)
    const matchesSailing = !sail || String(r.sailing || '').toLowerCase().includes(sail)
    const dateStr = String(r.date || '').slice(0,10)
    const matchesDate = (!df || dateStr >= df) && (!dt || dateStr <= dt)
    const matchesStatus = !status.value || r._myStatus === status.value
    return matchesSearch && matchesSailing && matchesDate && matchesStatus
  })

  count.value = merged.length
  const start = (page.value - 1) * perPage.value
  return merged.slice(start, start + perPage.value)
})

function displayForUser(userId, row) {
  const c = (row.candidates || []).find(x => x.user_id === userId)
  return c?.display_name || c?.email || userId
}

const showApproveCxl = (row) => {
  if (!isAdminMode.value) return false
  if (!row._selected) return false
  const sel = (row.candidates || []).find(c => c.user_id === row._selected)
  return sel?.status === 'cxl_requested'
}

onMounted(async () => {
  await load()
  channel = supabase
    .channel('service-table')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'service_guides' }, () => {
      load()
    })
    .subscribe()
})

onBeforeUnmount(async () => {
  if (channel) await supabase.removeChannel(channel)
})

/** LOAD **/
async function load () {
  loading.value = true
  try {
    if (isAdminMode.value) {
      const [from, to] = dateRange.value || []
      const res = await $fetch('/api/admin/services/list', {
        method: 'GET',
        query: {
          page: page.value,
          perPage: perPage.value,
          q: q.value || undefined,
          guide: guide.value || undefined,
          sailing: sailing.value || undefined,
          statusFilter: status.value || undefined,     // ВАЖНО: статус переименован
          dateFrom: from ? new Date(from).toISOString().slice(0,10) : undefined,
          dateTo: to ? new Date(to).toISOString().slice(0,10) : undefined
        }
      })
      count.value = res.count ?? 0
      rows.value = (res.items || []).map(r => ({
        ...r,
        _selected: r.confirmed?.user_id || null,
        _busy: false
      }))
      return
    }

     // USER режимы — локально: стор -> fallback к прямому запросу
    const { data: auth } = await supabase.auth.getUser()
    user.value = auth?.user || null
    
    let base = []
    try {
      const fromStore = await dataStore.fetchData?.()
      base = Array.isArray(fromStore) ? fromStore : []
    } catch (e) {
      // стор недоступен/упал — пойдём напрямую в БД
      base = []
    }

    // если стор ничего не вернул или нет ключевых полей — fallback к Supabase
    if (!base.length || !hasServiceShape(base[0])) {
      const { data: direct, error: sErr } = await supabase
        .from('services')
        .select('id, sailing, date, service')
        .order('date', { ascending: true })
      if (sErr) {
        console.error('[services fallback] ', sErr)
        base = []
      } else {
        base = direct || []
      }
    }
    const baseRows = base

    // мои статусы
    let myStatuses = []
    if (user.value) {
      const { data: mine } = await supabase
        .from('service_guides')
        .select('service_id, status')
        .eq('user_id', user.value.id)
      myStatuses = mine || []
    }
    const stMap = Object.fromEntries(myStatuses.map(m => [m.service_id, m.status]))

    rows.value = baseRows.map(s => ({
      ...s,
      _myStatus: stMap[s.id] || 'none',
      _busy: false
    }))
    // visibleRows посчитается автоматически (computed)
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Failed to load')
  } finally {
    loading.value = false
  }
}

/** пагинация и фильтры */
function onPage(p) { page.value = p; loadIfAdmin() }
function onFilterChange() { page.value = 1; loadIfAdmin() }
let t; function debouncedLoad(){ clearTimeout(t); page.value = 1; t = setTimeout(loadIfAdmin, 300) }
function loadIfAdmin() { if (isAdminMode.value) load() }

/** USER actions **/
async function selectService (row) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return ElMessage.info('Please log in')
  row._busy = true
  try {
    const { error } = await supabase.from('service_guides').insert({
      service_id: row.id, user_id: auth.user.id, status: 'tentative'
    })
    if (error && !String(error.message).includes('duplicate')) throw error
    row._myStatus = 'tentative'
    ElMessage.success('Selected')
  } catch (e) { console.error(e); ElMessage.error(e.message || 'Unable to select') }
  finally { row._busy = false }
}
async function unselectService (row) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return ElMessage.info('Please log in')
  row._busy = true
  try {
    const { error } = await supabase
      .from('service_guides')
      .delete()
      .eq('service_id', row.id)
      .eq('user_id', auth.user.id)
      .eq('status', 'tentative')
    if (error) throw error
    row._myStatus = 'none'
    ElMessage.success('Removed')
  } catch (e) { console.error(e); ElMessage.error(e.message || 'Unable to unselect') }
  finally { row._busy = false }
}
async function requestCxl (row) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return ElMessage.info('Please log in')
  row._busy = true
  try {
    const { error } = await supabase
      .from('service_guides')
      .update({ status: 'cxl_requested' })
      .eq('service_id', row.id)
      .eq('user_id', auth.user.id)
      .eq('status', 'confirmed')
    if (error) throw error
    row._myStatus = 'cxl_requested'
    ElMessage.success('Cancellation requested')
  } catch (e) { console.error(e); ElMessage.error(e.message || 'Unable to request cancellation') }
  finally { row._busy = false }
}

/** ADMIN actions **/
async function confirm (row) {
  if (!row._selected) return
  row._busy = true
  try {
    await $fetch('/api/admin/services/confirm', {
      method: 'POST',
      body: { service_id: row.id, user_id: row._selected }
    })
    ElMessage.success('Confirmed')
    row.candidates = row.candidates.map(c => ({
      ...c,
      status: c.user_id === row._selected ? 'confirmed' : (c.status === 'confirmed' ? 'tentative' : c.status)
    }))
    row.confirmed = { user_id: row._selected }
  } catch (e) { console.error(e); ElMessage.error(e.message || 'Confirm failed'); await load() }
  finally { row._busy = false }
}

async function approveCxl (row) {
  if (!row._selected) return
  const sel = (row.candidates || []).find(c => c.user_id === row._selected)
  if (!sel || sel.status !== 'cxl_requested') return
  row._busy = true
  try {
    await $fetch('/api/admin/services/approve-cxl', {
      method: 'POST',
      body: { service_id: row.id, user_id: row._selected }
    })
    ElMessage.success('Cancellation approved')
    row.candidates = row.candidates.map(c =>
      c.user_id === row._selected ? { ...c, status: 'cxl' } : c
    )
    if (row.confirmed?.user_id === row._selected) {
      row.confirmed = null
      row._selected = null
    }
  } catch (e) { console.error(e); ElMessage.error(e.message || 'Approve CXL failed'); await load() }
  finally { row._busy = false }
}

async function cancelConfirmed (row) {
  const uid = row.confirmed?.user_id
  if (!uid) return
  row._busy = true
  try {
    await $fetch('/api/admin/services/cancel-confirmed', {
      method: 'POST',
      body: { service_id: row.id, user_id: uid }
    })
    ElMessage.success('Cancelled')
    row.candidates = row.candidates.map(c =>
      c.user_id === uid ? { ...c, status: 'cxl' } : c
    )
    row.confirmed = null
    row._selected = null
  } catch (e) { console.error(e); ElMessage.error(e.message || 'Cancel failed'); await load() }
  finally { row._busy = false }
}

// проверяем, что объект сервиса имеет нужные поля
function hasServiceShape(obj) {
  if (!obj || typeof obj !== 'object') return false
  // id обязателен для статусов; тексты — любые
  return 'id' in obj && ('service' in obj || 'sailing' in obj || 'date' in obj)

}

function formatGuide(c) {
  return c?.display_name || c?.email || c?.user_id || ''
}
</script>

<style scoped>
.card { margin-top: 1rem; padding: 1rem; }
.filters { display: grid; grid-template-columns: 1fr 1fr 140px 280px 160px 120px; gap: 8px; align-items: center; margin-bottom: 12px; }
.pagination { display: flex; justify-content: center; margin-top: 12px; }
.opt { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.ml-2 { margin-left: 8px; }
.guide-name { font-weight: 500; }
</style>
