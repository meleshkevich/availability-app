<template>
  <div class="container">
    <h2>Welcome, admin</h2>
    <div class="card-container">
      <ServiceForm />
      <ServiceTable />
    </div>
  </div>
</template>
<script setup>
// const { supabase } = useSupabase();
// const { user } = useAuth();

definePageMeta({ middleware: "auth" });
</script>
<style scoped>
.container {
  max-width: 90%;
  margin: 0 auto;
  padding: 3rem 0;
  height: 90vh;
}
h3 {
  font-size: 2rem;
}

.card {
  margin-top: 1rem;
  padding: 1rem;
}
.card-container {
  margin-top: 1rem;
}
</style>
