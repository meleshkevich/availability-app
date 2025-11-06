<template>
  <div>
    <div class="container">
      <div v-if="isLoggedIn">
        <h2 v-if="isLoggedIn">Welcome, {{ displayName }}!</h2>
      </div>
      <div v-else>
        <AuthLogin/>
      </div>
    </div>
  </div>
</template>
<script setup>
const { isLoggedIn, displayName } = useAuth();
const { supabase } = useSupabase();
 
</script>

<style scoped>
.container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90vh;
}
</style>
