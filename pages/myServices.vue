<template>
  <el-card class="my-services-card">
    <div class="header">
      <h2>My Services</h2>
      <div class="actions">
        <el-button size="small" @click="reload" :loading="loading">Refresh</el-button>
        <el-button size="small" type="primary" @click="exportPdf" :disabled="rows.length===0">
          Export PDF
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!user && !loading"
      title="Please log in to see your services"
      type="info"
      show-icon
      class="mb-3"
    />

    <el-table
      v-loading="loading"
      :data="rows"
      style="width:100%"
      empty-text="No services yet"
    >
      <el-table-column prop="services.title" label="Service" min-width="240" />
      <el-table-column label="Status" width="160">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="220">
        <template #default="{ row }">
          <el-button
            v-if="row.status==='tentative'"
            size="small"
            :loading="row._busy"
            @click="unselect(row)"
          >
            Unselect
          </el-button>
          <el-button
            v-if="row.status==='confirmed'"
            size="small"
            type="warning"
            :loading="row._busy"
            @click="requestCancel(row)"
          >
            Request CXL
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
 
import useSupabase from '~/composables/useSupabase'

const { supabase } = useSupabase()
const rows = ref([])
const user = ref(null)
const loading = ref(false)
let channel = null // realtime channel ref

const statusLabel = (s) => ({
  tentative: 'Selected',
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

onMounted(async () => {
  await reload()
  setupRealtime()
})

onBeforeUnmount(async () => {
  if (channel) {
    await supabase.removeChannel(channel)
    channel = null
  }
})

async function reload () {
  loading.value = true
  try {
    const { data: auth } = await supabase.auth.getUser()
    user.value = auth?.user || null
    if (!user.value) {
      rows.value = []
      return
    }
    const { data, error } = await supabase
      .from('service_guides')
      .select('service_id, status, services(title)')
      .eq('user_id', user.value.id)
      .order('selected_at', { ascending: false })
    if (error) throw error
    rows.value = (data || []).map(r => ({ ...r, _busy: false }))
  } catch (e) {
    
   console.error(e.message || 'Failed to load')
  } finally {
    loading.value = false
  }
}

function setupRealtime () {
  if (!user.value || channel) return
  // Подписываемся на все изменения по моему user_id
  channel = supabase
    .channel('sg-my-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'service_guides',
        filter: `user_id=eq.${user.value.id}`
      },
      (payload) => {
        // payload: { eventType, new, old }
        const evt = payload.eventType
        if (evt === 'INSERT') {
          const r = payload.new
          // подтянуть title, если его нет (альтернатива — сделать повторный select)
          rows.value.unshift({
            service_id: r.service_id,
            status: r.status,
            services: { title: rows.value.find(x => x.service_id === r.service_id)?.services?.title || '(service)' },
            _busy: false
          })
        } else if (evt === 'UPDATE') {
          const r = payload.new
          const i = rows.value.findIndex(x => x.service_id === r.service_id)
          if (i !== -1) {
            rows.value[i] = { ...rows.value[i], status: r.status }
          } else {
            // если обновление пришло на запись, которой у нас ещё нет (редко) — перезагрузим список
            reload()
          }
        } else if (evt === 'DELETE') {
          const r = payload.old
          rows.value = rows.value.filter(x => x.service_id !== r.service_id)
        }
      }
    )
    .subscribe((status) => {
      // console.log('Realtime status:', status)
    })
}

async function unselect (row) {
  row._busy = true
  try {
    const { error } = await supabase
      .from('service_guides')
      .delete()
      .eq('service_id', row.service_id)
      .eq('user_id', user.value.id)
      .eq('status', 'tentative')
    if (error) throw error
    // локально удалим строку — на всякий, пока не пришёл realtime DELETE
    rows.value = rows.value.filter(r => r.service_id !== row.service_id)
   console.info('Removed from my services')
  } catch (e) {
    console.error(e)
    console.error(e.message || 'Unable to unselect')
  } finally {
    row._busy = false
  }
}

async function requestCancel (row) {
  row._busy = true
  try {
    const { error } = await supabase
      .from('service_guides')
      .update({ status: 'cxl_requested' })
      .eq('service_id', row.service_id)
      .eq('user_id', user.value.id)
      .eq('status', 'confirmed')
    if (error) throw error
    // локально поменяем статус — на всякий, пока не пришёл realtime UPDATE
    row.status = 'cxl_requested'
    console.info('Cancellation requested')
  } catch (e) {
    console.error(e)
    console.error(e.message || 'Unable to request cancellation')
  } finally {
    row._busy = false
  }
}

function exportPdf () {
  console.log('File download as pdf')
}
</script>

<style scoped>
.my-services-card { width: 100%; }
.header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.actions { display: flex; gap: 8px; }
.mb-3 { margin-bottom: 12px; }
</style>
