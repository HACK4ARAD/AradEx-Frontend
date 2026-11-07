<script setup lang="ts">
// T09 · Panou firmă · Profilul firmei (design/final web.html „Firmă · Profilul firmei”): ce văd oamenii pe pagina publică.
// `verified` nu se schimbă de aici (îl setează Primăria/Adminul, T14).
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppInput, EmptyState, Skeleton } from '@/shared/components'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import UnverifiedBanner from '@/shared/components/business/UnverifiedBanner.vue'
import { useBusinessPanel } from '@/shared/composables/useBusiness'
import type { BusinessCategory } from '@/shared/types/business'

const router = useRouter()
const { t } = useI18n()
const p = useBusinessPanel()

const CATEGORIES: BusinessCategory[] = ['CAFE', 'RESTAURANT', 'PRODUCER', 'WINERY', 'SHOP', 'OTHER']
const form = reactive({ name: '', category: 'CAFE' as BusinessCategory, description: '', address: '', lat: '', lng: '', phone: '', website: '', imageUrl: '' })
const errors = ref<Partial<Record<keyof typeof form, string>>>({})

onMounted(p.load)
watch(() => p.me.value?.business, (b) => {
  if (!b) return
  Object.assign(form, {
    name: b.name, category: b.category as BusinessCategory, description: b.description ?? '', address: b.address ?? '',
    lat: b.lat != null ? String(b.lat) : '', lng: b.lng != null ? String(b.lng) : '', phone: b.phone ?? '', website: b.website ?? '', imageUrl: b.imageUrl ?? '',
  })
}, { immediate: true })

async function save() {
  const e: typeof errors.value = {}
  const lat = Number(form.lat.replace(',', '.')), lng = Number(form.lng.replace(',', '.'))
  if (!form.name.trim()) e.name = t('business.form.required')
  if (!form.address.trim()) e.address = t('business.form.required')
  if (!form.lat.trim() || Number.isNaN(lat) || Math.abs(lat) > 90) e.lat = t('business.form.badNumber')
  if (!form.lng.trim() || Number.isNaN(lng) || Math.abs(lng) > 180) e.lng = t('business.form.badNumber')
  if (form.website.trim() && !/^https?:\/\/.+/.test(form.website.trim())) e.website = t('business.form.urlRequired')
  errors.value = e
  if (Object.keys(e).length) return
  await p.updateProfile({
    name: form.name.trim(), category: form.category, description: form.description.trim() || undefined, address: form.address.trim(),
    lat, lng, phone: form.phone.trim() || undefined, website: form.website.trim() || undefined, imageUrl: form.imageUrl.trim() || undefined,
  }, t('business.profile.saved'))
}

const field = 'w-full bg-white border border-line rounded-[14px] px-3.5 text-[16px] outline-none focus:border-ink'
</script>

<template>
  <Skeleton v-if="p.loading.value" :rows="3" :height="80" />
  <EmptyState v-else-if="!p.me.value" icon="storefront" :title="t('business.loadError')" :action="t('common.retry')" @action="p.load" />
  <template v-else>
    <UnverifiedBanner v-if="!p.me.value.business.verified" />
    <PanelHeader :title="t('business.profile.title')" :subtitle="t('business.profile.subtitle')">
      <AppButton variant="ghost" size="sm" icon="visibility" @click="router.push(`/w/businesses/${p.me.value.business.id}`)">{{ t('business.panel.openPublic') }}</AppButton>
    </PanelHeader>
    <form class="bg-white rounded-[20px] border border-line p-6 max-w-[760px] flex flex-col gap-4" novalidate @submit.prevent="save">
      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput v-model="form.name" :label="t('business.profile.name')" :error="errors.name" />
        <label class="block">
          <span class="block text-[14px] font-semibold mb-2">{{ t('business.profile.category') }}</span>
          <select v-model="form.category" :class="[field, 'h-12']">
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ t(`business.category.${c}`) }}</option>
          </select>
        </label>
      </div>
      <label class="block">
        <span class="block text-[14px] font-semibold mb-2">{{ t('business.profile.description') }}</span>
        <textarea v-model="form.description" rows="3" maxlength="2000" :class="[field, 'py-3 resize-y']" />
      </label>
      <AppInput v-model="form.address" :label="t('business.profile.address')" :error="errors.address" />
      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput v-model="form.lat" :label="t('business.profile.lat')" :error="errors.lat" />
        <AppInput v-model="form.lng" :label="t('business.profile.lng')" :error="errors.lng" />
        <AppInput v-model="form.phone" type="tel" :label="t('business.profile.phone')" />
        <AppInput v-model="form.website" type="url" placeholder="https://" :label="t('business.profile.website')" :error="errors.website" />
      </div>
      <AppInput v-model="form.imageUrl" :label="t('business.profile.imageUrl')" />
      <div class="flex justify-end"><AppButton type="submit" :loading="p.saving.value">{{ t('business.profile.save') }}</AppButton></div>
    </form>
  </template>
</template>
