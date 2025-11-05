<template>
  <div class="app-root">
    <!-- Глобальная навигация -->
    <Nav />

    <!-- Контейнер контента -->
    <main class="page-wrap">
      <slot />
    </main>

    <!-- (опционально) футер -->
    <!-- <footer class="footer">© {{ new Date().getFullYear() }} — Availability App</footer> -->
  </div>
</template>

<script setup>
// ничего не нужно
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* общий контейнер для страниц */
.page-wrap {
  flex: 1 1 auto;
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 16px;
}

/* необязательный футер */
/* .footer {
  border-top: 1px solid #eee;
  padding: 12px 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
} */

</style>
