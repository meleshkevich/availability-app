<template>
  <header class="site-header">
    <Nav />
  </header>
  <el-container class="app-root">
    <el-main class="page-wrap">
      <slot />
    </el-main>
    <footer class="footer">© {{ new Date().getFullYear() }} -- Availability App --</footer>
  </el-container>
</template>

<script setup>
//  
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  background: var(--el-bg-color-overlay, #fff);
  border-bottom: 1px solid var(--el-border-color, #eaeaea);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* общий контейнер для страниц */
.page-wrap {
  flex: 1 1 auto;
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 16px;
}

.footer {
  border-top: 1px solid #eee;
  padding: 12px 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
}
</style>
