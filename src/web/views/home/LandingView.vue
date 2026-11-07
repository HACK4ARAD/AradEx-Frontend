<script setup lang="ts">
// T20 · W1 → site-ul de prezentare al aplicației mobile (secțiunile în web/components/site/).
import SiteHero from '@/web/components/site/SiteHero.vue'
import SiteFeatures from '@/web/components/site/SiteFeatures.vue'
import SiteNowInArad from '@/web/components/site/SiteNowInArad.vue'
import SiteCommunity from '@/web/components/site/SiteCommunity.vue'
import SiteRoles from '@/web/components/site/SiteRoles.vue'
import SitePanels from '@/web/components/site/SitePanels.vue'
</script>

<template>
  <div class="flex flex-col gap-14 md:gap-20 pb-6">
    <SiteHero />
    <SiteFeatures />
    <SiteNowInArad />
    <SiteCommunity />
    <SiteRoles />
    <SitePanels />
  </div>
</template>
