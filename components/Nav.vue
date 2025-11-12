<template>
  <el-menu
    :default-active="activeIndex"
    class="nav"
    mode="horizontal"
    :ellipsis="false"
    @select="handleSelect"
  >
    <el-menu-item index="/">
      <!-- <img
        style="width: 100px"
        src=""
        alt="App logo"
      /> -->
      <NuxtLink to="/" class="nav-logo">Availability App</NuxtLink>
    </el-menu-item>

    <!-- admin-visible -->
    <template v-if="isLoggedIn && admin">
  <el-menu-item index="/services" class="nav-link">
    Services
  </el-menu-item>
  <el-menu-item index="/guides">
     Guides 
  </el-menu-item>
    </template>

    <!-- user-visible -->
    <template v-else>
      <el-menu-item index="/services">
        Services
      </el-menu-item>
      <el-menu-item index="/myServices">
        My Services 
      </el-menu-item>
    </template>

    <!-- user info / login -->
      <div style="display: flex; flex-grow: 1; justify-content: flex-end;">
    <el-menu-item v-if="isLoggedIn" class="nav-user">
      <span class="user-email">{{ displayName }}</span>
      <el-button link type="danger" @click="signOut">|| Logout</el-button>
    </el-menu-item>
    <el-menu-item v-else>
      <NuxtLink to="/" class="nav-link login">|| Login</NuxtLink>
    </el-menu-item>
    </div>
  </el-menu>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router' // Import useRouter

const { signOut, isLoggedIn, user, displayName } = useAuth() // Assume useAuth is defined and imported

const router = useRouter() // Get the router instance

const admin = ref(false)
const activeIndex = ref('1')

const handleSelect = (key, keyPath) => {
  // Using Nuxt Router to navigate based on selected key
  router.push({
    path: keyPath[0] // assuming keyPath contains the desired route
  })
}

onMounted(() => checkAdmin())
watchEffect(() => checkAdmin())

function checkAdmin() {
  admin.value = user?.value?.id === '16dfdc03-dd0b-41d5-801f-d2c6a91efb0c'
}
</script>

<style scoped>
 
.nav {
  background: var(--el-bg-color-overlay, #fff);
  border-bottom: 1px solid var(--el-border-color, #eaeaea);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  font-weight: 600;
  font-size: 18px;
  color: var(--el-color-primary, #409eff);
  text-decoration: none;
}

.nav-logo:hover {
  color: var(--el-color-primary-light-3, #66b1ff);
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--el-color-primary, #409eff);
}

.nav-link.active {
  color: var(--el-color-primary, #409eff);
  border-bottom: 2px solid var(--el-color-primary, #409eff);
  padding-bottom: 2px;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-email {
  font-size: 14px;
  color: #666;
}

/* Логин выделим как кнопку */
.login {
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}

/* адаптив для маленьких экранов */
@media (max-width: 640px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 8px 16px;
    align-items: flex-start;
  }
  .nav-menu {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
 

