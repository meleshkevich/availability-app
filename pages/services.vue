<template>
  <div>
    <div class="container">
      <h3>Available services</h3>

      <div class="card-container">
        <ServiceTable />
      </div>
    </div>
  </div>
</template>
<script setup>
// const { supabase } = useSupabase();
// const { user } = useAuth();

definePageMeta({ middleware: 'auth' });
</script>

<style scoped>
.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 3rem 0;
  height: 90vh;
}
h3 {
  font-size: 2rem;
}

.card-container {
  margin-top: 1rem;
}
.card {
  margin-top: 1rem;
  padding: 1rem;
}
.card h2 {
  font-weight: bold;
  font-size: 1.5rem;
  margin-top: 0.5rem;
}
.delete {
  cursor: pointer;
}
.delete:hover {
  color: red;
}
</style>
