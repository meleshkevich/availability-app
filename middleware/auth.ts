export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()
  const publicPaths = new Set(['/', '/login'])
  if (publicPaths.has(to.path)) return
  if (!user.value) return navigateTo('/login')
})
