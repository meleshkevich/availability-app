<template>
  <div class="container">
    <h3>Available services</h3>
    <div class="card-container">
      <ServiceTable mode="all" />
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
</script>

<style scoped>
.container { max-width: 90%; margin: 0 auto; padding: 3rem 0;  }
h3 { font-size: 2rem; }
.card-container { margin-top: 1rem; }
</style>
