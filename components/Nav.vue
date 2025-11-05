<template>
  <nav class="nav">
    <div class="nav-container">
      <!-- Лого или название -->
      <NuxtLink to="/" class="nav-logo">Availability App</NuxtLink>

      <!-- Основное меню -->
      <ul class="nav-menu">
        <li>
          <NuxtLink to="/services" class="nav-link" active-class="active">Services</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/myServices" class="nav-link" active-class="active">My Services</NuxtLink>
        </li>
         <li v-if="isLoggedIn && admin">
          <NuxtLink to="/guides" class="nav-link" active-class="active">Guides</NuxtLink>
        </li>
        <li v-if="isLoggedIn && admin">
          <NuxtLink to="/admin" class="nav-link" active-class="active">Admin</NuxtLink>
        </li>
        <li v-if="isLoggedIn" class="nav-user">
          <span class="user-email">{{ user?.email }}</span>
          <el-button link type="danger" @click="signOut">Logout</el-button>
        </li>
        <li v-else>
          <NuxtLink to="/login" class="nav-link login">Login</NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue'
const { signOut, isLoggedIn, user } = useAuth()

const admin = ref(false)

onMounted(() => checkAdmin())
watchEffect(() => checkAdmin())

function checkAdmin() {
  // 🔧 замени ID на реальный или используй флаг из user_metadata
  admin.value = user?.value?.id === '6bd6594f-6dd9-403e-8fa5-01c48aed8bf1'
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
