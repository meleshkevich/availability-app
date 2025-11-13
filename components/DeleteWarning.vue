<template>
    <el-dialog v-model="visible" :title="title" :close-on-click-modal="false" append-to-body @close="handleClose">
        <div class="text-sm">
            <slot>
                <p v-html="message"></p>
            </slot>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">{{ cancelText || 'Cancel' }}</el-button>
                <el-button type="primary" @click="handleConfirm">
                    {{ confirmText || 'Confirm' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
    modelValue?: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
    (e: 'close'): void
}>()

const visible = computed({
    get: () => props.modelValue ?? false,
    set: (v: boolean) => emit('update:modelValue', v),
})

function handleConfirm() {
    emit('confirm')
    visible.value = false
}

function handleCancel() {
    emit('cancel')
    visible.value = false
}

function handleClose() {
    emit('close')
}
</script>
