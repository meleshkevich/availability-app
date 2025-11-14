<template>
  <div class="container">
    <div class="header">
      <h3>Service Types</h3>
      <div class="actions">
        <el-input
          v-model="q"
          placeholder="Search by name"
          clearable
          style="width: 280px"
          @input="debouncedFetch"
        />
        <el-button @click="fetchTypes" :loading="loadingTypes">Refresh</el-button>
      </div>
    </div>

    <!-- Create accordion -->
    <el-collapse v-model="createOpen" class="create-accordion">
      <el-collapse-item name="create">
        <template #title>
          <span class="font-medium">Add new service type</span>
        </template>
        <el-form :model="newType" label-width="160px" class="mt-2" @submit.prevent="createType">
          <el-form-item label="Name">
            <el-input v-model="newType.name" placeholder="Name" clearable />
          </el-form-item>
          <el-form-item label="Start time">
            <el-time-select v-model="newType.start_time" start="06:00" step="00:15" end="23:45" placeholder="HH:mm" />
          </el-form-item>
          <el-form-item label="End time">
            <el-time-select v-model="newType.end_time" start="06:00" step="00:15" end="23:45" placeholder="HH:mm" />
          </el-form-item>
          <el-form-item label="Duration (min)">
            <el-input-number v-model="newType.duration_minutes" :min="0" :step="5" controls-position="right" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :disabled="!canCreate" @click="createType" :loading="creatingType">Add</el-button>
            <el-button @click="resetCreate" :disabled="creatingType">Clear</el-button>
          </el-form-item>
        </el-form>
      </el-collapse-item>
    </el-collapse>

    <el-card class="card">
      <el-table :data="items" v-loading="loadingTypes" style="width: 100%">
        <el-table-column prop="name" label="Name" min-width="240">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="Duration (min)" width="140">
          <template #default="{ row }">
            <span>{{ row.duration_minutes ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="Start time" width="160">
          <template #default="{ row }">
            <span>{{ formatTime(row.start_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="End time" width="160">
          <template #default="{ row }">
            <span>{{ formatTime(row.end_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="Created" width="200">
          <template #default="{ row }">
            <span>{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">Edit</el-button>
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
    </el-card>

    <!-- Edit dialog -->
    <el-dialog v-model="editOpen" title="Edit service type" width="520px">
      <el-form :model="editForm" label-width="140px" @submit.prevent>
        <el-form-item label="Name">
          <el-input v-model="editForm.name" placeholder="Name" />
        </el-form-item>
        <el-form-item label="Start time">
          <el-time-select v-model="editForm.start_time" start="06:00" step="00:15" end="23:45" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="End time">
          <el-time-select v-model="editForm.end_time" start="06:00" step="00:15" end="23:45" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="Duration (min)">
          <el-input-number v-model="editForm.duration_minutes" :min="0" :step="5" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen=false" :disabled="savingEdit">Cancel</el-button>
        <el-button type="primary" :loading="savingEdit" :disabled="!canSaveEdit" @click="saveEdit">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref, computed } from 'vue'

// Table state
const items = ref<any[]>([])
const count = ref(0)
const page = ref(1)
const perPage = ref(20)
const q = ref('')

// Create state
const createOpen = ref<string[] | string>([])
const newType = ref<{ name: string; start_time: string | null; end_time: string | null; duration_minutes: number | null }>({
  name: '',
  start_time: null,
  end_time: null,
  duration_minutes: null,
})
const creatingType = ref(false)
const canCreate = computed(() => {
  const nameOk = newType.value.name.trim().length >= 2 && newType.value.name.trim().length <= 120
  const dur = newType.value.duration_minutes
  const durOk = dur === null || (Number.isFinite(dur as any) && (dur as number) >= 0)
  const s = newType.value.start_time
  const e = newType.value.end_time
  const timesOk = (!s && !e) || (!!s && !!e)
  return nameOk && durOk && timesOk
})

// Loading state
const loadingTypes = ref(false)

// Edit state (dialog)
const editOpen = ref(false)
const editRow = ref<any | null>(null)
const editForm = ref<{ name: string; start_time: string | null; end_time: string | null; duration_minutes: number | null }>({
  name: '',
  start_time: null,
  end_time: null,
  duration_minutes: null,
})
const savingEdit = ref(false)
const canSaveEdit = computed(() => {
  if (!editOpen.value) return false
  const nameOk = editForm.value.name.trim().length >= 2 && editForm.value.name.trim().length <= 120
  const dur = editForm.value.duration_minutes
  const durOk = dur === null || (Number.isFinite(dur as any) && (dur as number) >= 0)
  const s = editForm.value.start_time
  const e = editForm.value.end_time
  const timesOk = (!s && !e) || (!!s && !!e)
  return nameOk && durOk && timesOk
})

const formatDate = (v?: string | null) => v ? new Date(v).toLocaleString() : '—'
const formatTime = (v?: string | null) => {
  if (!v) return '—'
  try {
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) return v.slice(0,5)
    const d = new Date(v)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch { return '—' }
}

async function fetchTypes () {
  loadingTypes.value = true
  try {
    const res = await $fetch<{ page:number; perPage:number; count:number; items:any[] }>(
      '/api/admin/service-types/list',
      {
        method: 'GET',
        query: { page: page.value, perPage: perPage.value, q: q.value }
      }
    )
    items.value = res.items || []
    count.value = res.count ?? items.value.length
  } catch (e: any) {
    console.error(e)
    ElMessage.error(e?.statusMessage || e?.message || 'Failed to fetch service types')
  } finally {
    loadingTypes.value = false
  }
}

async function createType() {
  if (!canCreate.value) {
    ElMessage.warning('Fill required fields')
    return
  }
  creatingType.value = true
  try {
    const body: any = { name: newType.value.name.trim() }
    if (newType.value.start_time) body.start_time = normalizeHHMM(newType.value.start_time)
    if (newType.value.end_time) body.end_time = normalizeHHMM(newType.value.end_time)
    if (newType.value.duration_minutes != null) body.duration_minutes = Number(newType.value.duration_minutes)

    await $fetch('/api/admin/service-types/create', { method: 'POST', body })
    ElMessage.success(`Created: ${body.name}`)
    resetCreate()
    createOpen.value = []
    await fetchTypes()
  } catch (e: any) {
    console.error(e)
    if (e?.statusCode === 409) {
      ElMessage.error('Service type with this name already exists')
    } else if (e?.statusCode === 400) {
      ElMessage.error(e?.statusMessage || 'Invalid data')
    } else {
      ElMessage.error(e?.statusMessage || 'Failed to create')
    }
  } finally {
    creatingType.value = false
  }
}

function resetCreate() {
  newType.value = { name: '', start_time: null, end_time: null, duration_minutes: null }
}

function normalizeHHMM(v: string) {
  if (/^\d{2}:\d{2}/.test(v)) return v.slice(0, 5)
  try {
    const d = new Date(v)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch {
    return v
  }
}

function openEdit (row: any) {
  editRow.value = row
  editForm.value = {
    name: row.name ?? '',
    start_time: row.start_time ?? null,
    end_time: row.end_time ?? null,
    duration_minutes: row.duration_minutes ?? null,
  }
  editOpen.value = true
}

async function saveEdit () {
  if (!editRow.value) return
  if (!canSaveEdit.value) {
    ElMessage.warning('Fix form errors')
    return
  }
  savingEdit.value = true
  try {
    const row = editRow.value
    const body: any = { id: row.id }
    if (editForm.value.name.trim() !== (row.name ?? '')) body.name = editForm.value.name.trim()
    const s = editForm.value.start_time ? normalizeHHMM(editForm.value.start_time) : null
    const e = editForm.value.end_time ? normalizeHHMM(editForm.value.end_time) : null
    if (s !== (row.start_time ?? null)) body.start_time = s
    if (e !== (row.end_time ?? null)) body.end_time = e
    if ((editForm.value.duration_minutes ?? null) !== (row.duration_minutes ?? null)) body.duration_minutes = editForm.value.duration_minutes

    if (Object.keys(body).length === 1) {
      ElMessage.info('No changes')
      savingEdit.value = false
      editOpen.value = false
      editRow.value = null
      return
    }

    await $fetch('/api/admin/service-types/update', { method: 'PATCH', body })
    ElMessage.success('Saved')
    editOpen.value = false
    editRow.value = null
    await fetchTypes()
  } catch (e: any) {
    console.error(e)
    if (e?.statusCode === 409) {
      ElMessage.error('Service type with this name already exists')
    } else {
      ElMessage.error(e?.statusMessage || 'Failed to save')
    }
  } finally {
    savingEdit.value = false
  }
}

function onPage(p: number) {
  page.value = p
  fetchTypes()
}

let t: any
function debouncedFetch () {
  clearTimeout(t)
  t = setTimeout(fetchTypes, 300)
}

onMounted(fetchTypes)
</script>

<style scoped>
.container { max-width: 100%; margin: 0 auto; padding: 3rem 0; }
.header { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; margin-bottom: 1rem; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pagination { display: flex; justify-content: center; margin-top: 1rem; }
.card { margin-top: 8px; }
h3 { font-size: 2rem; margin: 0; }
</style>
