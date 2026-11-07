<script setup lang="ts">
// T20 · W1 → site-ul de prezentare al aplicației mobile (secțiunile în web/components/site/).
// T23: un cont personal conectat (Vizitator / Localnic) vede în loc pagina lui de start (PersonalHome), ca în aplicație.
import { computed } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import PersonalHome from '@/web/components/home/PersonalHome.vue'
import SiteHero from '@/web/components/site/SiteHero.vue'
import SiteFeatures from '@/web/components/site/SiteFeatures.vue'
import SiteNowInArad from '@/web/components/site/SiteNowInArad.vue'
import SiteCommunity from '@/web/components/site/SiteCommunity.vue'
import SiteRoles from '@/web/components/site/SiteRoles.vue'
import SitePanels from '@/web/components/site/SitePanels.vue'

const auth = useAuthStore()
const personal = computed(() => auth.user?.role === 'VISITOR' || auth.user?.role === 'LOCAL')
</script>

<template>
  <PersonalHome v-if="personal" />
  <div v-else class="flex flex-col gap-14 md:gap-20 pb-6">
    <SiteHero />
    <SiteFeatures />
    <SiteNowInArad />
    <SiteCommunity />
    <SiteRoles />
    <SitePanels />
  </div>
</template>
