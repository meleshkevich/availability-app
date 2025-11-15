<template>
  <el-card class="add-card" shadow="never">
    <!-- Шапка-аккордеон -->
    <div class="card-header" role="button" tabindex="0"
         @click="toggle" @keydown.enter.prevent="toggle" @keydown.space.prevent="toggle">
      <div class="title">
        <el-icon class="chev" :class="{ open: expanded }">
          <ArrowDown />
        </el-icon>
        <span>Add service</span>
      </div>
      <el-tag v-if="expanded" size="small" effect="plain">Collapse</el-tag>
      <el-tag v-else size="small" effect="plain">Expand</el-tag>
    </div>

    <!-- Тело: сворачиваем/разворачиваем -->
    <transition name="fade-slide">
      <div v-show="expanded" class="body">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="Add Service" name="single">
            <el-form :model="form" label-width="120px" @submit.prevent="createService">
              <el-form-item label="Sailing">
                <el-input v-model="form.sailing" placeholder="e.g. MSC-1234" />
              </el-form-item>

              <el-form-item label="Date">
                <el-date-picker
                  v-model="form.date"
                  type="date"
                  placeholder="Pick a date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>

              <el-form-item label="Service type">
                <div class="row">
                  <el-select
                    v-model="form.service_type_id"
                    filterable
                    remote
                    reserve-keyword
                    :remote-method="fetchTypes"
                    :loading="loadingTypes"
                    placeholder="Select service type"
                    style="min-width:260px"
                    @visible-change="(v: any) => { if(v) fetchTypes('') }"
                    clearable
                  >
                    <el-option
                      v-for="t in types"
                      :key="t.id"
                      :label="t.name"
                      :value="t.id"
                    />
                  </el-select>

                  <el-button type="primary" link @click="showNewType=true">
                    + New type
                  </el-button>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" :loading="submitting" @click="createService">Create</el-button>
                <el-button @click="reset">Reset</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="Add Services" name="multiple">
            <UploadExcel />
          </el-tab-pane>
        </el-tabs>
      </div>
    </transition>

    <!-- Диалог создания нового типа -->
    <el-dialog v-model="showNewType" title="New service type" width="440px">
  <el-form :model="newType" label-width="140px" @submit.prevent>
    <el-form-item label="Name">
      <el-input v-model="newType.name" placeholder="Type name (e.g. City Tour)" />
    </el-form-item>
    <el-form-item label="Start time">
      <el-time-select v-model="newType.start_time" start="06:00" step="00:15" end="23:45" placeholder="HH:mm" />
    </el-form-item>
    <el-form-item label="End time">
      <el-time-select v-model="newType.end_time" start="06:00" step="00:15" end="23:45" placeholder="HH:mm" />
    </el-form-item>
    <el-form-item label="Duration (min)">
      <div>{{ computedDuration }}</div>
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="showNewType=false">Cancel</el-button>
    <el-button type="primary" :loading="creatingType" :disabled="!canCreate" @click="createType">Create</el-button>
  </template>
</el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import UploadExcel from '~/components/UploadExcel.vue'

const expanded = ref(false)
const toggle = () => (expanded.value = !expanded.value)

const activeTab = ref('single')

const form = ref({
  sailing: '',
  date: '',
  service_type_id: ''
})

const types = ref([])
const loadingTypes = ref(false)
const submitting = ref(false)

const showNewType = ref(false)
const newTypeName = ref('')
const newType = ref<{ name: string; start_time: string | null; end_time: string | null; duration_minutes: number | null }>({
  name: '',
  start_time: null,
  end_time: null,
  duration_minutes: null,
})
const creatingType = ref(false)

const canCreate = computed(() => {
  const n = newType.value.name.trim()
  const nameOk = n.length >= 2 && n.length <= 120
  const s = newType.value.start_time
  const e = newType.value.end_time
  const timesOk = (!s && !e) || (!!s && !!e) // либо оба пустые, либо оба заданы
  return nameOk && timesOk
})

// --- helpers такие же, как в serviceTypes.vue ---
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
function hmToMinutes(hm?: string | null) {
  if (!hm) return null
  const [h, m] = hm.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}
function calcDurationMinutes(startHM?: string | null, endHM?: string | null) {
  const s = hmToMinutes(startHM)
  const e = hmToMinutes(endHM)
  if (s == null || e == null) return null
  const diff = e - s
  return diff >= 0 ? diff : null
}

const computedDuration = computed(() => {
  const s = hmToMinutes(newType.value.start_time)
  const e = hmToMinutes(newType.value.end_time)
  if (s == null || e == null) return '-'
  const diff = e - s
  return diff >= 0 ? diff : '-'
})

watch(
  [() => newType.value.start_time, () => newType.value.end_time],
  () => {
    newType.value.duration_minutes = calcDurationMinutes(newType.value.start_time, newType.value.end_time)
  },
  { immediate: true }
)

async function fetchTypes (query: string) {
  loadingTypes.value = true
  try {
    const res = await $fetch('/api/admin/service-types/list', {
      method: 'GET',
      query: { q: query || '', page: 1, perPage: 20 }
    })
    types.value = res?.items || []
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Failed to load types')
  } finally {
    loadingTypes.value = false
  }
}

async function createType () {
  if (!canCreate.value) {
    ElMessage.warning('Fill required fields')
    return
  }
  creatingType.value = true
  try {
    const start = newType.value.start_time ? normalizeHHMM(newType.value.start_time) : undefined
    const end   = newType.value.end_time   ? normalizeHHMM(newType.value.end_time)   : undefined

    const body =  {
      name: newType.value.name.trim(),
      ...(start ? { start_time: start } : {}),
      ...(end   ? { end_time: end }     : {}),
    }

    const created = await $fetch('/api/admin/service-types/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })

    ElMessage.success('Type created')
    showNewType.value = false
    // очистка формы создания типа
    newType.value = { name: '', start_time: null, end_time: null, duration_minutes: null }
    // обновить список типов в селекте
    await fetchTypes('')
    // выбрать только что созданный тип для текущей формы сервиса
    form.value.service_type_id = created.id
  } catch (e) {
    console.error(e)
    ElMessage.error(e?.message || 'Failed to create')
  } finally {
    creatingType.value = false
  }
}

function reset () {
  form.value = { sailing: '', date: '', service_type_id: '' }
}

async function createService () {
  if (!form.value.sailing || !form.value.date || !form.value.service_type_id) {
    return ElMessage.warning('Fill all fields')
  }
  submitting.value = true
  try {
    await $fetch('/api/admin/services/create', {
      method: 'POST',
      body: { ...form.value }
    })
    ElMessage.success('Service created')
    reset()
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Create service failed')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.add-card { margin-bottom: 12px; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px 10px;
  cursor: pointer;
  user-select: none;
}
.card-header:focus {
  outline: none;
}
.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.chev {
  transition: transform .2s ease;
}
.chev.open {
  transform: rotate(180deg);
}

.body { padding-top: 8px; }
.row { display:flex; align-items:center; gap:8px; }

.fade-slide-enter-active,
.fade-slide-leave-active { transition: all .18s ease; }
.fade-slide-enter-from,
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }
</style>