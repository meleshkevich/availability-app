<template>
  <div class="container">
    <div class="header">
      <h3>Guides</h3>
      <div class="actions">
        <el-input
          v-model="q"
          placeholder="Search by name, email or phone"
          clearable style="width: 320px"
          @input="debouncedLoad"
        />
        <el-button @click="load" :loading="loading">Refresh</el-button>
        <el-button type="primary" :disabled="dirty.size===0" @click="saveChanges" :loading="saving">
          Save changes ({{ dirty.size }})
        </el-button>
      </div>
    </div>
     <el-card class="card">
    <el-table :data="items" v-loading="loading" style="width:100%">
      <el-table-column prop="display_name" label="Display name" min-width="200">
        <template #default="{ row }">
          <el-input v-model="row.display_name" @change="markDirty(row)" placeholder="Enter name"/>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="Email" min-width="240" />
      <el-table-column prop="phone" label="Phone" min-width="180">
        <template #default="{ row }">
          <el-input v-model="row.phone" @change="markDirty(row)" placeholder="+420..." />
        </template>
      </el-table-column>
      <el-table-column prop="last_sign_in_at" label="Last sign-in" width="200">
        <template #default="{ row }">
          <span>{{ formatDate(row.last_sign_in_at) }}</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted  } from 'vue'
import { ElMessage } from 'element-plus'

const items = ref([])
const page = ref(1)
const perPage = ref(20)
const count = ref(0)
const q = ref('')
const loading = ref(false)
const saving = ref(false)
const dirty = ref(new Set()) // user_id set

const formatDate = (v) => v ? new Date(v).toLocaleString() : '—'

async function load () {
  loading.value = true
  try {
    // $fetch возвращает непосредственно объект ответа из API
    const res = await $fetch('/api/admin/guides/list', {
      method: 'GET',
      query: { page: page.value, perPage: perPage.value, q: q.value }
    })
    items.value = res.items || []
    count.value = res.count ?? items.value.length
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Failed to load guides')
  } finally {
    loading.value = false
  }
}

function onPage(p) {
  page.value = p
  load()
}

function markDirty(row) {
  dirty.value.add(row.user_id)
}

async function saveChanges () {
  if (dirty.value.size === 0) return
  saving.value = true
  try {
    const updates = items.value
      .filter(r => dirty.value.has(r.user_id))
      .map(r => ({
        user_id: r.user_id,
        display_name: r.display_name ?? null,
        phone: r.phone ?? null
      }))

    // Тоже просто ждём успешного возврата; если ошибка — $fetch кинет исключение
    await $fetch('/api/admin/guides/save', {
      method: 'POST',
      body: { updates }
    })

    dirty.value.clear()
    ElMessage.success('Saved')
  } catch (e) {
    console.error(e)
    ElMessage.error(e.message || 'Failed to save changes')
  } finally {
    saving.value = false
  }
}

// debounce на поиск
let t
function debouncedLoad() {
  clearTimeout(t)
  t = setTimeout(load, 300)
}

onMounted(load)
</script>

<style scoped>
.container { max-width: 100%; margin: 0 auto; padding: 3rem 0;  }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.actions { display: flex; gap: 8px; }
.pagination { display: flex; justify-content: center; margin-top: 12px; }
h2 { margin-bottom: 1rem; }
h3 { font-size: 2rem; }
</style>
