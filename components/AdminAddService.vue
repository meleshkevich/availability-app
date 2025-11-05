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
                @visible-change="(v)=>{ if(v) fetchTypes('') }"
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
      </div>
    </transition>

    <!-- Диалог создания нового типа -->
    <el-dialog v-model="showNewType" title="New service type" width="420px">
      <el-input v-model="newTypeName" placeholder="Type name (e.g. City Tour)" />
      <template #footer>
        <el-button @click="showNewType=false">Cancel</el-button>
        <el-button type="primary" :loading="creatingType" @click="createType">Create</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

/** свернуто по умолчанию */
const expanded = ref(false)
const toggle = () => (expanded.value = !expanded.value)

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
const creatingType = ref(false)

async function fetchTypes (query) {
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
  if (!newTypeName.value.trim()) return
  creatingType.value = true
  try {
    const created = await $fetch('/api/admin/service-types/create', {
      method: 'POST',
      body: { name: newTypeName.value.trim() }
    })
    ElMessage.success('Type created')
    showNewType.value = false
    newTypeName.value = ''
    await fetchTypes('')
    form.value.service_type_id = created.id
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Create type failed')
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

/* шапка-аккордеон */
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

/* тело */
.body { padding-top: 8px; }
.row { display:flex; align-items:center; gap:8px; }

/* анимация */
.fade-slide-enter-active,
.fade-slide-leave-active { transition: all .18s ease; }
.fade-slide-enter-from,
.fade-slide-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
