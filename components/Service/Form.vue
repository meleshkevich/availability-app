<template>
  <el-card class="card">
    <el-input
      class="card-input"
      v-model="notesInput.sailing"
      placeholder="Sailing"
    />
    <!-- <el-input
      class="card-input"
      v-model="notesInput.date"
      placeholder="Date"
    ></el-input> -->
    <el-date-picker
      v-model="notesInput.date"
      type="date"
      placeholder="Pick a day"
      size="default"
    />

    <el-input
      class="card-input"
      v-model="notesInput.service"
      placeholder="Service"
    ></el-input>
    <el-button type="primary" @click="handleSubmit">Add service</el-button>
  </el-card>
</template>
<script setup>
import { useDataStore } from '~/stores/data';
const dataStore = useDataStore();
const notesInput = reactive(dataStore.notesInput);

const { supabase } = useSupabase();
const { user } = useAuth();

const handleSubmit = async () => {
  console.log(dataStore.notesInput.sailing);
  // if (!notesInput.value.sailing || !notesInput.service) return;
  // await supabase.from("notes").insert({
  // (dataStore.notesInput.value.sailing = notesInput.sailing),
  //   (dataStore.notesInput.value.date = notesInput.date),
  //   (dataStore.notesInput.value.type = notesInput.type),
  //   (dataStore.notesInput.value.service = notesInput.service),
  //   (dataStore.notesInput.value.user_id = user.value.id),
  // });
  dataStore.resetNotes();
};
</script>

<style scoped>
.card {
  padding: 1.5rem;
  display: flex;

  /* flex-direction: row; */
}
.card-input {
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}
</style>
