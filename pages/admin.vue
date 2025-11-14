<template>
  <div class="container">
    <h3>Admin — Services</h3>
 <Icon name="uil:github" size="24" class="text-black" aria-hidden="true" />
     <AdminAddService />
    <ServiceTable mode="admin" />
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
</script>

<style scoped>
.container { max-width: 100%; margin: 0 auto; padding: 3rem 0;  }
h2 { margin-bottom: 1rem; }
h3 { font-size: 2rem; }
</style>
