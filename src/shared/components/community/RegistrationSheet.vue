<script setup lang="ts">
/** Sheet-ul „QR-ul tău” al unei înscrieri la o acțiune comunitară, cu „Anulează înscrierea” cât timp așteaptă validarea. Mobil și web. */
import { useI18n } from 'vue-i18n'
import { AppButton, AppSheet } from '@/shared/components'
import RegistrationTicket from './RegistrationTicket.vue'
import type { RegistrationDto } from '@/shared/types/community'

defineProps<{ registration?: RegistrationDto | null; saving?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ cancel: [] }>()
const { t } = useI18n()
</script>

<template>
  <AppSheet v-model:open="open" :title="t('community.ticket.title')">
    <RegistrationTicket v-if="registration" :registration="registration" />
    <template v-if="registration && registration.status === 'REGISTERED'" #footer>
      <AppButton block variant="ghost" :loading="saving" @click="emit('cancel')">{{ t('community.action.cancel') }}</AppButton>
    </template>
  </AppSheet>
</template>
