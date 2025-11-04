<template>
  <div class="container">
    <h3>My Services</h3>
    <div class="card-container">
      <ServiceTable mode="mine" />
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
</script>
