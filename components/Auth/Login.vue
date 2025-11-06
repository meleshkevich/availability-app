<template>
  <div class="wrap">
    <el-card class="card">
      <h2>Sign in</h2>
      <el-form :model="form" @submit.prevent="onSignIn">
        <el-form-item label="Email">
          <el-input v-model="form.email" type="email" autocomplete="email" />
        </el-form-item>
        <el-form-item label="Password">
          <el-input v-model="form.password" type="password" autocomplete="current-password" />
        </el-form-item>
        <div class="actions">
          <el-button type="primary" :loading="loading" @click="onSignIn">Sign in</el-button>
          <el-button :loading="loading" @click="onSignUp" text>Sign up</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
const { signIn, signUp } = useAuth()

const loading = ref(false)
const form = ref({ email: '', password: '' })

async function onSignIn () {
  loading.value = true
  try {
    await signIn({ email: form.value.email, password: form.value.password })
    ElMessage.success('Signed in')
    navigateTo('/services') // куда вести после входа
  } catch (e) {
    ElMessage.error(e.message || 'Sign in failed')
  } finally { loading.value = false }
}

async function onSignUp () {
  loading.value = true
  try {
    await signUp({ email: form.value.email, password: form.value.password })
    ElMessage.success('Check your email to verify')
  } catch (e) {
    ElMessage.error(e.message || 'Sign up failed')
  } finally { loading.value = false }
}
</script>

<style scoped>
.wrap { min-height: 60vh; display: flex; align-items: center; justify-content: center; }
.card { width: 420px; }
.actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
