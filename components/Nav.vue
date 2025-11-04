<template>
  <nav>
    <ul>
      <li>
        <NuxtLink to="/"> Home </NuxtLink>
      </li>
      <li v-if="isLoggedIn()">
        <NuxtLink to="/services"> Service List </NuxtLink>
         
      </li>
      <li v-if="isLoggedIn()">
       <NuxtLink to="/myServices"> My Services </NuxtLink>
      </li>
      
      <li v-if="admin">
        <NuxtLink to="/admin"> Admin </NuxtLink>
      </li>
         <li v-if="admin">
        <NuxtLink to="/guides"> Guides </NuxtLink>
      </li>
      <li v-if="isLoggedIn()" class="logout" @click="signOut">
        Logout, {{ user.identities[0].identity_data.email }}
      </li>
    </ul>
  </nav>
</template>
<script setup>
const { signOut, isLoggedIn, user } = useAuth();
const admin = ref(false);
onMounted(() => {
  setTimeout(() => {
    user.value.id === "6bd6594f-6dd9-403e-8fa5-01c48aed8bf1"
      ? (admin.value = true)
      : (admin.value = false);
  }, 0);
});
</script>

<style scoped>
nav {
  background: black;
  height: 10vh;
}
ul {
  display: flex;
  height: 100%;
  align-items: center;
  padding: 0 2rem;
}
li {
  color: white;
  margin-right: 1rem;
  a {
    color: white;
  }
}
.logout {
  margin-left: auto;
  cursor: pointer;
}
</style>
