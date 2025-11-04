<template>
  <el-card class="card">
    <el-table :data="visibleRows" style="width:100%">
      <!-- твои поля -->
      <el-table-column prop="sailing" label="Sailing" width="150" />
      <el-table-column prop="date" label="Date" width="120" />
      <el-table-column prop="service" label="Service" min-width="260" />

      <!-- моя колонка статуса -->
      <el-table-column label="My status" width="160">
        <template #default="{ row }">
          <el-tag :type="statusType(row._myStatus)">
            {{ statusLabel(row._myStatus) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- операции -->
      <el-table-column label="Operations" width="280">
        <template #default="{ row }">
          <!-- Select -->
          <el-button
            v-if="row._myStatus==='none' || row._myStatus==='cxl'"
            size="small"
            :loading="row._busy"
            @click="selectService(row)"
          >
            Select
          </el-button>

          <!-- Unselect -->
          <el-button
            v-if="row._myStatus==='tentative'"
            size="small"
            :loading="row._busy"
            @click="unselectService(row)"
          >
            Unselect
          </el-button>

          <!-- Request CXL -->
          <el-button
            v-if="row._myStatus==='confirmed'"
            size="small"
            type="warning"
            :loading="row._busy"
            @click="requestCxl(row)"
          >
            Request CXL
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import useSupabase from '~/composables/useSupabase'
import { useDataStore } from '~/stores/data' // твой стор, который даёт sailing/date/service

// РЕЖИМ: "all" | "mine"
const props = defineProps({
  mode: { type: String, default: 'all' }  // all = Services, mine = My Services
})

const { supabase } = useSupabase()
const dataStore = useDataStore()

const user = ref(null)
const rows = ref([])         // исходные строки из dataStore (sailing,date,service,id)
let channel = null           // realtime
const statusByServiceId = ref({}) // { [service_id]: 'tentative'|'confirmed'|'cxl_requested'|'cxl' }
const loading = ref(false)

const statusLabel = (s) => ({
  none: 'Not Selected',
  tentative: 'Selected',
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

const visibleRows = computed(() => {
  const merged = rows.value.map(r => ({
    ...r,
    _myStatus: statusByServiceId.value[r.id] || 'none',
    _busy: false
  }))
  return props.mode === 'mine'
    ? merged.filter(r => r._myStatus !== 'none')
    : merged
})

onMounted(async () => {
  await reloadAll()
  setupRealtime()
})

onBeforeUnmount(async () => {
  if (channel) {
    await supabase.removeChannel(channel)
    channel = null
  }
})

async function reloadAll () {
  loading.value = true
  try {
    // 1) текущий пользователь
    const { data: auth } = await supabase.auth.getUser()
    user.value = auth?.user || null

    // 2) твой список сервисов (из стора)
    const list = await dataStore.fetchData() // должен вернуть [{ id, sailing, date, service, ... }]
    rows.value = Array.isArray(list) ? list : []

    // 3) мои статусы из service_guides
    if (user.value) {
      const { data: mine, error } = await supabase
        .from('service_guides')
        .select('service_id, status')
        .eq('user_id', user.value.id)
      if (error) throw error
      statusByServiceId.value = Object.fromEntries(
        (mine || []).map(m => [m.service_id, m.status])
      )
    } else {
      statusByServiceId.value = {}
    }
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Failed to load services')
  } finally {
    loading.value = false
  }
}

function setupRealtime () {
  if (!user.value || channel) return
  channel = supabase
    .channel('sg-service-table')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'service_guides', filter: `user_id=eq.${user.value.id}` },
      (payload) => {
        const evt = payload.eventType
        if (evt === 'INSERT' || evt === 'UPDATE') {
          const r = payload.new
          statusByServiceId.value = {
            ...statusByServiceId.value,
            [r.service_id]: r.status
          }
        } else if (evt === 'DELETE') {
          const r = payload.old
          const copy = { ...statusByServiceId.value }
          delete copy[r.service_id]
          statusByServiceId.value = copy
        }
      }
    )
    .subscribe()
}

async function selectService (row) {
  if (!user.value) return ElMessage.info('Please log in')
  row._busy = true
  try {
    const { error } = await supabase.from('service_guides').insert({
      service_id: row.id,
      user_id: user.value.id,
      status: 'tentative'
    })
    if (error && !String(error.message).includes('duplicate')) throw error
    // локально проставим (realtime всё равно придёт)
    statusByServiceId.value = { ...statusByServiceId.value, [row.id]: 'tentative' }
    ElMessage.success('Selected')
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Unable to select')
  } finally {
    row._busy = false
  }
}

async function unselectService (row) {
  if (!user.value) return ElMessage.info('Please log in')
  row._busy = true
  try {
    const { error } = await supabase
      .from('service_guides')
      .delete()
      .eq('service_id', row.id)
      .eq('user_id', user.value.id)
      .eq('status', 'tentative')
    if (error) throw error
    const copy = { ...statusByServiceId.value }
    delete copy[row.id]
    statusByServiceId.value = copy
    ElMessage.success('Removed')
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Unable to unselect')
  } finally {
    row._busy = false
  }
}

async function requestCxl (row) {
  if (!user.value) return ElMessage.info('Please log in')
  row._busy = true
  try {
    const { error } = await supabase
      .from('service_guides')
      .update({ status: 'cxl_requested' })
      .eq('service_id', row.id)
      .eq('user_id', user.value.id)
      .eq('status', 'confirmed')
    if (error) throw error
    statusByServiceId.value = { ...statusByServiceId.value, [row.id]: 'cxl_requested' }
    ElMessage.success('Cancellation requested')
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Unable to request cancellation')
  } finally {
    row._busy = false
  }
}
</script>

<style scoped>
.card { margin-top: 1rem; padding: 1rem; }
</style>
