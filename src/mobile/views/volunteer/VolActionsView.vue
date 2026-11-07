<script setup lang="ts">
// T18 · Acțiunile tale (design/final `/vol/actions`): cardul negru cu coordonatorul și contoarele, apoi acțiunile alocate
// (lacăt până cu 30 de minute înainte de start, bifă verde când toți sunt confirmați).
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { EmptyState, Skeleton } from '@/shared/components'
import VolAccountButton from '@/shared/components/volunteer/VolAccountButton.vue'
import VolActionCard from '@/shared/components/volunteer/VolActionCard.vue'
import { initials } from '@/shared/composables/useCommunity'
import { useVolunteerHome } from '@/shared/composables/useVolunteer'

const { t } = useI18n()
const router = useRouter()
const { me, actions, loading, failed, load } = useVolunteerHome()
const firstName = computed(() => me.value?.name.split(' ')[0] ?? '')
const stats = computed(() => me.value ? [
  [me.value.actions, t('volunteer.actions.statAssigned')], [me.value.scanned, t('volunteer.actions.statScanned')], [me.value.toScan, t('volunteer.actions.statToScan')],
] : [])
onMounted(load)
</script>

<template>
  <div class="flex items-center justify-between gap-3 pt-2 mb-4">
    <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('volunteer.actions.title') }}</h1>
    <VolAccountButton :coordinator="me?.coordinatorName" :one-time="me?.oneTime" />
  </div>

  <Skeleton v-if="loading && !me" :rows="3" :height="160" />
  <EmptyState v-else-if="failed && !me" icon="cloud_off" :title="t('volunteer.actions.loadError')" :action="t('common.retry')" @action="load" />
  <template v-else-if="me">
    <div class="rounded-[20px] bg-ink text-bg p-4" data-test="vol-card">
      <div class="flex items-center gap-3">
        <span class="w-11 h-11 shrink-0 rounded-full bg-bg text-ink text-[16px] font-bold flex items-center justify-center">{{ initials(me.name) }}</span>
        <div class="min-w-0 flex-1">
          <b class="block text-[17px] truncate">{{ me.name }}</b>
          <span v-if="me.coordinatorName" class="block text-[13.5px] opacity-75 truncate">{{ t('volunteer.account.coordinator', { name: me.coordinatorName }) }}</span>
        </div>
        <span class="shrink-0 h-7 px-3 rounded-full bg-accent text-white text-[13px] font-bold inline-flex items-center">{{ t('volunteer.role') }}</span>
      </div>
      <div class="grid grid-cols-3 gap-2 mt-3.5">
        <div v-for="[n, label] in stats" :key="String(label)" class="rounded-[14px] bg-white/10 px-3 py-2.5">
          <b class="block text-[22px] leading-tight">{{ n }}</b><span class="block text-[12.5px] opacity-75 leading-snug">{{ label }}</span>
        </div>
      </div>
      <p class="text-[12.5px] opacity-60 mt-3 mb-0">{{ t('volunteer.account.createdBy') }}<template v-if="me.oneTime"> · {{ t('volunteer.account.oneTime') }}</template></p>
    </div>

    <h2 class="text-[20px] font-semibold tracking-[-0.02em] mt-6 mb-3">{{ t('volunteer.actions.assigned') }}</h2>
    <EmptyState v-if="!actions.length" icon="event_busy" :title="t('volunteer.actions.empty')" :text="t('volunteer.actions.emptyText')" />
    <div v-else class="flex flex-col gap-3.5">
      <VolActionCard v-for="a in actions" :key="a.id" :action="a" :first-name="firstName" @scan="(id) => router.push({ path: '/vol/scan', query: { a: id } })" />
    </div>
  </template>
</template>
