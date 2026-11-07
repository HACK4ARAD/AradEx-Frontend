<script setup lang="ts">
/**
 * Butonul principal al unei acțiuni comunitare (bara de jos pe mobil, cardul din dreapta pe web): Primăria → validare;
 * înscris → QR-ul meu / Prezență confirmată; încheiată / plină → dezactivat; vizitator → „Sunt din Arad · mă înscriu”;
 * fără cont sau localnic → „Mă înscriu · +N puncte”.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton } from '@/shared/components'
import { isEnded, spotsLeft } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import type { ActionSummary, RegistrationDto } from '@/shared/types/community'

const props = defineProps<{ action: ActionSummary; registration?: RegistrationDto; saving?: boolean }>()
const emit = defineEmits<{ register: []; qr: []; staff: [] }>()
const { t } = useI18n()
const auth = useAuthStore()
const free = computed(() => spotsLeft(props.action))
const ended = computed(() => isEnded(props.action))
const isStaff = computed(() => auth.hasRole('CITY_HALL'))
const canRegister = computed(() => auth.role === 'LOCAL' || auth.role === 'VISITOR')
</script>

<template>
  <AppButton v-if="isStaff" block variant="secondary" icon="qr_code_scanner" @click="emit('staff')">{{ t('community.action.staffCta') }}</AppButton>
  <AppButton v-else-if="registration" block icon="qr_code_2" :class="registration.status === 'CONFIRMED' ? '!bg-green' : ''" @click="emit('qr')">
    {{ registration.status === 'CONFIRMED' ? t('community.action.confirmedCta', { n: action.pointsReward }) : t('community.action.myQrCta') }}
  </AppButton>
  <AppButton v-else-if="ended" block disabled>{{ t('community.action.endedCta') }}</AppButton>
  <AppButton v-else-if="free <= 0" block disabled>{{ t('community.action.fullCta') }}</AppButton>
  <div v-else-if="auth.role === 'VISITOR'" class="flex flex-col gap-1.5">
    <AppButton block icon="how_to_reg" class="!bg-green" :loading="saving" @click="emit('register')">{{ t('community.action.visitorCta') }}</AppButton>
    <span class="text-muted text-[12px] text-center">{{ t('community.action.visitorNote') }}</span>
  </div>
  <AppButton v-else-if="!auth.isLoggedIn || canRegister" block icon="how_to_reg" class="!bg-green" :loading="saving" @click="emit('register')">
    {{ t('community.action.registerCta', { n: action.pointsReward }) }}
  </AppButton>
  <AppButton v-else block disabled>{{ t('community.action.notForRole') }}</AppButton>
</template>
