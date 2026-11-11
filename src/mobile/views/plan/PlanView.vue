<script setup lang="ts">
// T13 · E1 — Planifică-ți vizita (design/final mobile `/plan`): cât timp, când + de la ce oră, cum te deplasezi, interese,
// „Altceva?”, „Generează programul”. Cât lucrează AradBot: ecranul de așteptare pe tot ecranul (fără tab bar), apoi
// itinerariul salvat (`/itinerary/:shareCode`, cu replace). Logica: shared/composables/usePlanner.
// Modul demo (`demoOnly`): formularul se vede, dar nota „se deschide la lansare” stă sus și „Generează” e dezactivat.
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { INTERESTS, TIME_OPTIONS, TRANSPORTS, usePlanner } from '@/shared/composables/usePlanner'
import { useBack } from '@/shared/composables/useBack'
import { useAuthMode } from '@/shared/composables/useAuthMode'
import DemoPausedNotice from '@/shared/components/ui/DemoPausedNotice.vue'

const { t } = useI18n()
const router = useRouter()
const back = useBack('/itineraries')
const { form, generating, dayOptions, toggleInterest, cycleStart, generate } = usePlanner()
const { demoOnly } = useAuthMode()

const CHIP = 'min-h-11 px-4 rounded-full inline-flex items-center gap-1.5 text-[14px] border whitespace-nowrap transition-colors'
const chipCls = (on: boolean) => (on ? 'bg-ink text-white border-ink font-semibold' : 'bg-white text-ink border-line font-medium')

/** ecranul de așteptare rămâne până se deschide itinerariul (fără să clipească formularul între salvare și navigare) */
const leaving = ref(false)
/** omul a plecat de pe ecran cât lucra AradBot: nu-l mai ducem la itinerariu */
let gone = false
onBeforeUnmount(() => { gone = true })
async function go() {
  if (demoOnly.value) return
  leaving.value = true
  const saved = await generate()
  if (gone) return
  if (saved?.shareCode) await router.replace(`/itinerary/${saved.shareCode}`)
  else leaving.value = false
}
</script>

<template>
  <!-- ecranul de așteptare acoperă și tab bar-ul (design: `nav: false`) -->
  <div v-if="generating || leaving" class="fixed inset-0 z-[60] bg-bg flex flex-col items-center px-8 pt-[200px] text-center" role="status" aria-live="polite">
    <AppIcon name="auto_awesome" :size="48" class="text-accent" />
    <h2 class="mt-4 mb-0 text-[22px] font-semibold tracking-[-0.02em]">{{ t('plan.loading.title') }}</h2>
    <p class="text-muted text-[15px] mt-2 mb-0 max-w-[320px]">{{ t('plan.loading.text') }}</p>
    <div class="mt-5"><i class="ax-dot" /><i class="ax-dot" /><i class="ax-dot" /></div>
  </div>

  <div class="pb-6">
    <div class="flex items-center gap-1 pt-2 mb-3.5">
      <button type="button" class="w-11 h-11 -ml-2.5 rounded-full flex items-center justify-center shrink-0" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
      <h1 class="flex-1 m-0 text-[28px] font-semibold tracking-[-0.025em] leading-tight">{{ t('plan.form.title') }}</h1>
    </div>
    <p class="text-muted text-[14.5px] -mt-1 mb-[18px]">{{ t('plan.form.intro') }}</p>
    <DemoPausedNotice v-if="demoOnly" class="mb-[18px]" />

    <label class="block text-[14px] font-semibold mb-2">{{ t('plan.form.timeLabel') }}</label>
    <div class="flex flex-wrap gap-2 mb-[18px]">
      <button v-for="o in TIME_OPTIONS" :key="o" type="button" :class="[CHIP, chipCls(form.time === o)]" :aria-pressed="form.time === o" @click="form.time = o">{{ t(`plan.form.time.${o}`) }}</button>
    </div>

    <label class="block text-[14px] font-semibold mb-2">{{ t('plan.form.whenLabel') }}</label>
    <div class="flex flex-wrap gap-2 mb-[18px]">
      <button v-for="(d, i) in dayOptions" :key="d.iso" type="button" :class="[CHIP, chipCls(form.date === d.iso)]" :aria-pressed="form.date === d.iso" @click="form.date = d.iso">
        <AppIcon v-if="i === 0" name="calendar_month" :size="18" />{{ d.label }}
      </button>
      <button type="button" :class="[CHIP, chipCls(true)]" :aria-label="t('plan.form.fromAria', { time: form.startTime })" @click="cycleStart">
        <AppIcon name="schedule" :size="18" />{{ t('plan.form.from', { time: form.startTime }) }}
      </button>
    </div>

    <label class="block text-[14px] font-semibold mb-2">{{ t('plan.form.transportLabel') }}</label>
    <div class="flex gap-2 mb-[18px]">
      <button v-for="m in TRANSPORTS" :key="m.id" type="button" :aria-pressed="form.transport === m.id"
        class="flex-1 min-w-0 rounded-[16px] bg-white flex flex-col items-center gap-0.5 text-center"
        :class="form.transport === m.id ? 'border-2 border-ink p-[11px]' : 'border border-line p-3'" @click="form.transport = m.id">
        <AppIcon :name="m.icon" />
        <b class="text-[14px]">{{ t(`plan.form.transport.${m.id}`) }}</b>
        <span class="text-[11.5px] text-muted leading-[1.2]">{{ t(`plan.form.transportSub.${m.id}`) }}</span>
      </button>
    </div>

    <label class="block text-[14px] font-semibold mb-2">{{ t('plan.form.interestsLabel') }}</label>
    <div class="flex flex-wrap gap-2 mb-[18px]">
      <button v-for="i in INTERESTS" :key="i" type="button" :class="[CHIP, chipCls(form.interests.includes(i))]" :aria-pressed="form.interests.includes(i)" @click="toggleInterest(i)">{{ t(`plan.form.interest.${i}`) }}</button>
    </div>

    <label for="plan-text" class="block text-[14px] font-semibold mb-2">{{ t('plan.form.otherLabel') }}</label>
    <textarea id="plan-text" v-model="form.text" maxlength="500" :placeholder="t('plan.form.placeholder')"
      class="w-full min-h-24 px-4 py-3.5 rounded-[16px] border border-line bg-white outline-none text-[16px] leading-[1.45] resize-none focus:border-ink focus:shadow-[0_0_0_3px_rgba(17,17,17,.08)]" />

    <button type="button" class="w-full mt-[18px] min-h-[52px] px-5 rounded-[16px] bg-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-45"
      :disabled="generating || leaving || demoOnly" data-test="plan-generate" @click="go"><AppIcon name="auto_awesome" :size="18" />{{ t('plan.form.generate') }}</button>
    <p class="text-muted text-[12.5px] mt-2.5 text-center">{{ t('plan.form.note') }}</p>
  </div>
</template>

<style scoped>
.ax-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-muted, #5C5C5C); margin-right: 3px; animation: ax-blink 1s infinite; }
.ax-dot:nth-child(2) { animation-delay: .2s; }
.ax-dot:nth-child(3) { animation-delay: .4s; }
@keyframes ax-blink { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ax-dot { animation: none; opacity: .6; } }
</style>
