<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import AppButton from './AppButton.vue'
defineProps<{ icon?: string; title: string; text?: string; action?: string }>()
defineEmits<{ action: [] }>()
</script>

<template>
  <!-- design/final emptyState(): card alb, icon mare gri, titlu, text, buton negru mic -->
  <div class="bg-white rounded-[20px] border border-line shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] text-center px-5 py-9">
    <AppIcon :name="icon ?? 'inbox'" :size="40" class="text-muted" />
    <h3 class="mt-3 mb-1.5 text-[18px] font-semibold">{{ title }}</h3>
    <p v-if="text" class="text-muted text-[14px] leading-[1.45] m-0">{{ text }}</p>
    <AppButton v-if="action" size="sm" class="mt-3.5 mx-auto" @click="$emit('action')">{{ action }}</AppButton>
  </div>
</template>
