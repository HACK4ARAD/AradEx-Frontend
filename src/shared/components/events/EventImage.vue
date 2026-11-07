<script setup lang="ts">
// T06 · fundalul cu poza evenimentului; fără poză: nuanța + emoji-ul categoriei (ca în design/final).
import { computed } from 'vue'
import { CATEGORY_STYLE } from '@/shared/composables/useEvents'
import type { EventCategory } from '@/shared/types/events'

const props = defineProps<{ src?: string; category: EventCategory; emojiSize?: number }>()
const style = computed(() => props.src
  ? { backgroundImage: `url('${props.src}')` }
  : { background: `radial-gradient(120% 90% at 18% 8%, rgba(255,255,255,.22), transparent 55%), ${CATEGORY_STYLE[props.category].tone}` })
</script>

<template>
  <div class="relative bg-center bg-cover bg-no-repeat flex items-center justify-center" :style="style">
    <span v-if="!src" aria-hidden="true" :style="{ fontSize: (emojiSize ?? 64) + 'px' }">{{ CATEGORY_STYLE[category].emoji }}</span>
    <slot />
  </div>
</template>
