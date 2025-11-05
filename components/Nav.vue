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
       <li v-if="admin">
        <NuxtLink to="/adminOld"> AdminOld </NuxtLink>
      </li>
      <li v-if="isLoggedIn()" class="logout" @click="signOut">
        Logout, {{ user.identities[0].identity_data.email }}
      </li>
    </ul>
  </nav>
</template>
<script setup>
const { signOut, isLoggedIn, user } = useAuth();

//TODO: to clarify admin role!!!!
const admin = ref(true);
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
  list-style-type: none;  
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
    text-decoration: none; /* убираем стандартное подчёркивание */
    transition: text-decoration 0.2s ease;
  }

  a:hover {
    text-decoration: underline; /* добавляем подчёркивание при hover */
  }

    .router-link-exact-active {
    text-decoration: underline;
  }
}
.logout {
  margin-left: auto;
  cursor: pointer;
}
</style>
