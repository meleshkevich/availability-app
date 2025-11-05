<template>
  <div class="container">
    <div class="header">
      <h2>Admin - Services</h2>
      <div class="filters">
        <el-input v-model="q" placeholder="Search service/sailing…" clearable @input="debouncedLoad" />
        <el-input v-model="guide" placeholder="Guide name/email…" clearable @input="debouncedLoad" />
        <el-input v-model="sailing" placeholder="Sailing" clearable @input="debouncedLoad" />
        <el-date-picker v-model="dateRange" type="daterange" range-separator="to" start-placeholder="From" end-placeholder="To" @change="load" />
        <el-select v-model="status" placeholder="Status" clearable @change="load" style="min-width:160px">
          <el-option label="Tentative" value="tentative" />
          <el-option label="Confirmed" value="confirmed" />
          <el-option label="CXL Requested" value="cxl_requested" />
          <el-option label="CXL" value="cxl" />
        </el-select>
        <el-button @click="load" :loading="loading">Refresh</el-button>
      </div>
    </div>

    <el-table :data="items" v-loading="loading" style="width:100%">
      <el-table-column prop="sailing" label="Sailing" width="140"/>
      <el-table-column prop="date" label="Date" width="120"/>
      <el-table-column prop="service" label="Service" min-width="260"/>

      <el-table-column label="Guide" min-width="280">
        <template #default="{ row }">
          <el-select v-model="row._selected" placeholder="Select guide" filterable clearable style="width:100%">
            <el-option
              v-for="c in row.candidates"
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
      </el-table-column>

      <el-table-column label="Operations" width="260">
        <template #default="{ row }">
          <el-button
            type="primary" size="small"
            :loading="row._busy"
            :disabled="!row._selected"
            @click="confirm(row)"
          >Confirm</el-button>

          <el-button
            v-if="isCxlRequestedSelected(row)"
            type="warning" size="small"
            :loading="row._busy"
            @click="approveCxl(row)"
          >Approve CXL</el-button>
        </template>
      </el-table-column>
    </el-table>

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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import useSupabase from '~/composables/useSupabase'

const { supabase } = useSupabase()

const items = ref([])
const page = ref(1)
const perPage = ref(20)
const count = ref(0)

const q = ref('')
const guide = ref('')
const sailing = ref('')
const status = ref('')
const dateRange = ref([])

const loading = ref(false)
let channel = null

const statusLabel = (s) => ({
  tentative: 'Tentative',
  confirmed: 'Confirmed',
  cxl_requested: 'CXL Requested',
  cxl: 'Cancelled'
}[s] || s)

const statusType = (s) => ({
  tentative: 'info',
  confirmed: 'success',
  cxl_requested: 'warning',
  cxl: 'danger'
}[s] || '')

const formatGuide = (c) => `${c.display_name || c.email || c.user_id}`

function isCxlRequestedSelected(row) {
    if (!row._selected) return false
    const sel = row.candidates.find(c => c.user_id === row._selected)
    return sel?.status === 'cxl_requested'
}

async function load() {
  loading.value = true
  try {
    const [from, to] = dateRange.value || []
    const res = await $fetch('/api/admin/services/list', {
      method: 'GET',
      query: {
        page: page.value,
        perPage: perPage.value,
        q: q.value || undefined,
        guide: guide.value || undefined,
        sailing: sailing.value || undefined,
        status: status.value || undefined,
        dateFrom: from ? new Date(from).toISOString().slice(0,10) : undefined,
        dateTo: to ? new Date(to).toISOString().slice(0,10) : undefined
      }
    })
    count.value = res.count ?? 0
    items.value = (res.items || []).map(r => ({
      ...r,
      _selected: r.confirmed?.user_id || null,
      _busy: false
    }))
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Failed to load')
  } finally {
    loading.value = false
  }
}

function onPage(p) { page.value = p; load() }

let t
function debouncedLoad() { clearTimeout(t); t = setTimeout(load, 300) }

async function confirm(row) {
  if (!row._selected) return
  row._busy = true
  try {
    await $fetch('/api/admin/services/confirm', {
      method: 'POST',
      body: { service_id: row.id, user_id: row._selected }
    })
    ElMessage.success('Confirmed')
    // локально отметить
    row.candidates = row.candidates.map(c => ({
      ...c,
      status: c.user_id === row._selected ? 'confirmed' : (c.status === 'confirmed' ? 'tentative' : c.status)
    }))
    row.confirmed = { user_id: row._selected }
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Confirm failed')
    await load()
  } finally {
    row._busy = false
  }
}

async function approveCxl(row) {
    if (!row._selected) return
    const sel = row.candidates.find(c => c.user_id === row._selected)
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
     // если отменили у текущего исполнителя — очищаем confirmed
     if (row.confirmed?.user_id === row._selected) {
       row.confirmed = null
    }
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Approve CXL failed')
    await load()
  } finally {
    row._busy = false
  }
}

onMounted(async () => {
  await load()
  // Realtime: любые изменения в service_guides — обновим текущую страницу
  channel = supabase
    .channel('admin-sg')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'service_guides' }, () => {
      // можно оптимизировать по service_id из payload, но пока перезагрузим страницу
      load()
    })
    .subscribe()
})

onBeforeUnmount(async () => {
  if (channel) await supabase.removeChannel(channel)
})
</script>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 24px 0; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 12px; }
.filters { display: grid; grid-template-columns: 1fr 1fr 140px 280px 160px 120px; gap: 8px; align-items: center; }
.pagination { display: flex; justify-content: center; margin-top: 12px; }
.opt { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
</style>
