// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  //supabase pass: 6Pq#xn286QzxB5F
  modules: [
    "@nuxt/ui",
    "@element-plus/nuxt",
    [
      "@pinia/nuxt",
      {
        autoImports: ["defineStore", ["defineStore", "definePiniaStore"]],
      },
    ],
  ],
});
