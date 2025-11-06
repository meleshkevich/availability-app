// plugins/pdfmake.client.ts
import { defineNuxtPlugin } from 'nuxt/app'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// Встроенный набор (Roboto) попадает в виртуальную ФС
pdfMake.vfs = pdfFonts.vfs

export default defineNuxtPlugin(() => {
  return { provide: { pdfMake } }
})
