<template>
  <el-card class="card">
    <el-table :data="tableData" style="width: 90%">
      <el-table-column prop="sailing" label="Sailing" width="150" />
      <el-table-column prop="date" label="Date" width="100" />
      <el-table-column prop="service" label="Service" width="300" />

      <el-table-column
        v-if="isAdmin"
        prop="assigned_to"
        label="Guide"
        width="300"
      />
      <el-table-column label="Operations">
        <el-button
          class="select-btn"
          size="small"
          @click="handleSelect($event.target)"
          >Select</el-button
        >

        <el-button
          v-if="isAdmin"
          class="delete-btn"
          size="small"
          type="danger"
          @click="handleDelete($event.target)"
          >Delete
        </el-button>
      </el-table-column>
    </el-table>
  </el-card>
</template>
<script setup>
import { useDataStore } from '~/stores/data';
const dataStore = useDataStore();

const { supabase } = useSupabase();
const { user } = useAuth();
const { isAdmin, userData } = useUser();
const tableData = ref([]);

definePageMeta({ middleware: 'auth' });

const fetchData = async () => {
  tableData.value = await dataStore.fetchData();
};

onMounted(async () => {
  setTimeout(async () => {
    tableData.value = await dataStore.fetchData();
  }, 500);
});

const setRowsIndexes = () => {
  let selectBtns = document.querySelectorAll('.select-btn');
  let deleteBtns = document.querySelectorAll('.delete-btn');
  selectBtns.forEach((btn, i) => {
    btn.setAttribute('row', i);
  });
  deleteBtns.forEach((btn, i) => {
    btn.setAttribute('row', i);
  });
};

const handleSelect = async (e) => {
  setRowsIndexes();
  const rowIndex = e.parentNode.getAttribute('row');
  const id = tableData.value[rowIndex].id;
  await supabase
    .from('notes')
    .update({
      assigned_to: user.value.id,
    })
    .eq('id', id);
  fetchData();
};
const handleDelete = async (e) => {
  setRowsIndexes();
  const rowIndex = e.parentNode.getAttribute('row');

  const id = tableData.value[rowIndex].id;
  await supabase.from('notes').delete().eq('id', id);
  fetchData();
};
</script>
<style scoped>
.card {
  margin-top: 1rem;
  padding: 1rem;
}
</style>
