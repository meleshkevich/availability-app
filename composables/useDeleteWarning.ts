// composables/useDeleteWarning.ts
import { h, render, ref } from 'vue'
import DeleteWarning from '../components/DeleteWarning.vue'

export type DeleteWarningOptions = {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  // любые доп. пропсы тоже поддержим
  [key: string]: any
}

export function useDeleteWarning() {
  const confirm = (options: DeleteWarningOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      if (process.server) return resolve(false)

      const container = document.createElement('div')
      document.body.appendChild(container)

      const model = ref(true) // сразу открываем диалог

      const cleanup = () => {
        render(null, container)
        container.remove()
      }

      const vnode = h(DeleteWarning, {
        modelValue: model.value,
        'onUpdate:modelValue': (v: boolean) => {
          model.value = v
          // если закрыли "крестиком" или ESC — считаем как cancel (false)
          if (!v) {
            resolve(false)
            cleanup()
          }
        },

        title: options.title ?? 'Cancellation warning',
        message: options.message ?? 'Are you sure to delete this service?',
        confirmText: options.confirmText ?? 'Yes, delete',
        cancelText: options.cancelText ?? 'No, cancel',
        ...options,

        onConfirm: () => {
          resolve(true)
          cleanup()
        },
        onCancel: () => {
          resolve(false)
          cleanup()
        },
        onClose: () => {
          // сработает, если закрыли диалог не нажимая кнопки
          resolve(false)
          cleanup()
        },
      })

      render(vnode, container)
    })
  }

  return { confirm }
}
