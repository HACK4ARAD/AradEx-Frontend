<script setup lang="ts">
// Codul de recuperare, arătat o singură dată (după „Cont nou”, „Am uitat parola”, „Parolă nouă” și „Cod de recuperare nou”):
// ce e, codul cu „Copiază” și bifa „L-am salvat într-un loc sigur”, fără de care „Continuă” rămâne dezactivat.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon } from '@/shared/components'
import CopyableCode from '@/shared/components/auth/CopyableCode.vue'
import type { Ui } from '@/shared/composables/useAuthForm'

withDefaults(defineProps<{ code: string; ui?: Ui }>(), { ui: 'm' })
const emit = defineEmits<{ continue: [] }>()
const { t } = useI18n()
const saved = ref(false)
</script>

<template>
  <div data-test="recovery-notice">
    <span class="w-12 h-12 rounded-[14px] bg-peach text-accent flex items-center justify-center"><AppIcon name="key" /></span>
    <h1 class="m-0 mt-3.5 font-semibold tracking-[-0.025em] leading-tight" :class="ui === 'w' ? 'text-[24px]' : 'text-[30px]'">{{ t('auth.recoveryCode.title') }}</h1>
    <p class="text-muted mt-2.5 mb-0 leading-relaxed" :class="ui === 'w' ? 'text-[14px]' : 'text-[15px]'">{{ t('auth.recoveryCode.text') }}</p>

    <CopyableCode :code="code" class="mt-5" />

    <label class="flex items-start gap-3 cursor-pointer select-none mt-5" data-test="recovery-saved">
      <input v-model="saved" type="checkbox" class="peer sr-only" />
      <span class="mt-px w-[22px] h-[22px] shrink-0 rounded-[7px] border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30"
        :class="saved ? 'bg-ink border-ink text-white' : 'border-[#C9C9C2] bg-white'" aria-hidden="true">
        <AppIcon v-if="saved" name="check" :size="16" />
      </span>
      <span class="text-[14px] leading-snug text-ink/85">{{ t('auth.recoveryCode.saved') }}</span>
    </label>

    <AppButton block class="mt-5" :disabled="!saved" data-test="recovery-continue" @click="emit('continue')">{{ t('auth.recoveryCode.continue') }}</AppButton>
  </div>
</template>
