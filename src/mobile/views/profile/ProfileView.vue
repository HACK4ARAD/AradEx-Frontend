<script setup lang="ts">
// S11 — Profil (T03): contul conectat, rolul (vine din cont, nu se schimbă de aici), limba aplicației, deconectare.
// Itinerariile, salvatele și punctele detaliate vin în story-urile lor (T06, T11, T13).
import { computed, onMounted, ref } from 'vue'
import { eventsApi } from '@/shared/api/events'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import { useBack } from '@/shared/composables/useBack'
import type { Locale } from '@/shared/i18n'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const back = useBack('/m')

const initials = computed(() => (auth.user?.displayName ?? '?').split(/\s+/).map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase())

function changeLocale(l: Locale) {
  if (l !== locale.value) auth.changeLocale(l).catch((e) => ui.error(e))
}

function logout() {
  auth.logout()
  ui.toast(t('profile.loggedOut'))
  router.push('/m')
}

// T06: numărul de evenimente salvate pe rândul „Salvate” (design/final S11)
const savedCount = ref<number | null>(null)
onMounted(async () => {
  if (!auth.isLoggedIn) return
  try { savedCount.value = (await eventsApi.saved()).length } catch { /* fără număr */ }
})
</script>

<template>
  <div class="pt-1">
    <button class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center mb-2" :aria-label="t('common.back')" @click="back">
      <AppIcon name="arrow_back" />
    </button>
    <h1 class="text-[30px] font-semibold tracking-[-0.025em] m-0">{{ t('profile.title') }}</h1>

    <!-- cont -->
    <div class="bg-white rounded-[20px] p-4 flex items-center gap-3.5 mt-4">
      <template v-if="auth.user">
        <span class="w-12 h-12 rounded-full bg-ink text-white font-bold flex items-center justify-center shrink-0">{{ initials }}</span>
        <div class="min-w-0 flex-1">
          <span class="text-muted text-[13px]">{{ t('profile.connectedAs', { role: t(`auth.role.${auth.user.role}`) }) }}</span>
          <b class="block text-[16px] truncate">{{ auth.user.displayName }}</b>
          <span class="block text-muted text-[13px] truncate">{{ auth.user.email }}</span>
        </div>
      </template>
      <template v-else>
        <span class="w-12 h-12 rounded-full bg-bg flex items-center justify-center shrink-0"><AppIcon name="person" /></span>
        <div class="min-w-0 flex-1">
          <b class="block text-[16px]">{{ t('profile.guestTitle') }}</b>
          <span class="block text-muted text-[13.5px]">{{ t('profile.guestText') }}</span>
        </div>
        <router-link to="/m/login" class="h-9 px-3 rounded-xl bg-ink text-white text-[13px] font-semibold flex items-center no-underline shrink-0">{{ t('nav.login') }}</router-link>
      </template>
    </div>

    <!-- firmă -->
    <div v-if="auth.user?.business" class="bg-white rounded-[20px] p-4 mt-3 flex items-center gap-3">
      <span class="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0"><AppIcon name="storefront" /></span>
      <div class="min-w-0 flex-1">
        <b class="block text-[15px] truncate">{{ auth.user.business.name }}</b>
        <span class="text-[13px] text-muted">{{ t(`auth.category.${auth.user.business.category}`) }}</span>
      </div>
      <span class="text-[12px] font-semibold px-2.5 h-7 rounded-full flex items-center gap-1 shrink-0"
        :class="auth.user.business.verified ? 'bg-green-soft text-green' : 'bg-[#FBF0D9] text-[#8A5A00]'">
        <AppIcon :name="auth.user.business.verified ? 'verified' : 'schedule'" :size="16" />
        {{ t(auth.user.business.verified ? 'profile.verified' : 'profile.pendingVerification') }}
      </span>
    </div>

    <!-- puncte (localnic) -->
    <div v-if="auth.user?.role === 'LOCAL'" class="bg-green text-white rounded-[20px] p-4 mt-3">
      <div class="text-[13px] opacity-85">{{ t('profile.points') }}</div>
      <div class="text-[40px] font-bold tracking-[-0.03em] leading-none mt-1">{{ auth.user.pointsBalance }}
        <small class="text-[14px] font-medium opacity-85 tracking-normal">{{ t('profile.pointsAvailable') }}</small>
      </div>
    </div>

    <!-- setări -->
    <div class="bg-white rounded-[20px] px-4 mt-3">
      <!-- T06: Salvate stă în Profil (design/final S11) -->
      <router-link to="/m/saved" class="flex items-center gap-3 py-3.5 border-b border-line no-underline text-ink">
        <AppIcon name="bookmark" />
        <span class="flex-1 text-[15px]">{{ t('events.savedList.title') }}</span>
        <span v-if="savedCount != null" class="text-muted text-[15px]">{{ savedCount }}</span>
        <AppIcon name="chevron_right" />
      </router-link>
      <div class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="language" />
        <span class="flex-1 text-[15px]">{{ t('profile.language') }}</span>
        <div class="inline-flex gap-0.5 p-[3px] rounded-[10px] bg-bg" role="radiogroup" :aria-label="t('profile.language')">
          <button v-for="l in (['ro', 'en'] as const)" :key="l" type="button" role="radio" :aria-checked="locale === l"
            class="h-8 px-3 rounded-lg text-[13px] font-semibold" :class="locale === l ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-muted'"
            @click="changeLocale(l)">{{ l === 'ro' ? 'Română' : 'English' }}</button>
        </div>
      </div>
      <div class="flex items-center gap-3 py-3.5">
        <AppIcon name="shield_person" />
        <span class="flex-1 text-[15px]">{{ t('profile.roleRow') }}</span>
        <span class="text-muted text-[14px]">{{ auth.user ? t(`auth.role.${auth.user.role}`) : t('auth.role.VISITOR') }}</span>
      </div>
    </div>
    <p class="text-muted text-[12.5px] mt-2 px-1">{{ t('profile.roleHint') }}</p>

    <button v-if="auth.user" type="button" class="block mx-auto mt-5 text-[14px] font-semibold text-muted underline underline-offset-[3px]" @click="logout">
      {{ t('nav.logout') }}
    </button>
  </div>
</template>
