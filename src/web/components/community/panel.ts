/**
 * Clasele panourilor web (design/final/web.html: `.head`, `.kpi`, `.acard`, `.toolbar`, `.seg`, `table`, `.pill`, `.btn`, `.fcard`,
 * `.fsec`, `.lrow`, `.feed`), aceleași ca în panoul de Evenimente (T06). Panourile web NU folosesc stilul aplicației mobile
 * (titluri de 28–32px, chip-uri rotunde, butoane h-12).
 */
export const H1 = 'm-0 text-[24px] tracking-[-0.025em] font-semibold'
export const SUB = 'text-muted text-[13.5px] mt-1'
export const HEAD = 'flex flex-wrap items-end justify-between gap-4 mb-5'

export const CARD = 'bg-white border border-line rounded-[14px] p-4 min-w-0'
export const CARD_FLUSH = 'bg-white border border-line rounded-[14px] overflow-hidden min-w-0'
export const CH = 'flex items-start justify-between gap-2.5 mb-3'
export const CH_TITLE = 'm-0 text-[14.5px] tracking-[-0.01em] font-semibold'
export const HINT = 'text-muted text-[12.5px] mt-0.5'
export const TOOLBAR = 'flex flex-wrap items-center gap-2.5 px-3.5 py-3 border-b border-line'
export const COUNT = 'ml-auto text-muted text-[12.5px]'

export const SEG = 'inline-flex flex-wrap gap-0.5 p-[3px] rounded-[10px] bg-soft'
export const segBtn = (on: boolean) => `h-[30px] px-3 rounded-lg font-semibold text-[13px] ${on ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-muted'}`

export const TH = 'text-left text-[11.5px] font-semibold text-muted px-3.5 py-2.5 border-b border-line whitespace-nowrap bg-[#FBFBFA] uppercase tracking-[.04em]'
export const TD = 'px-3.5 py-3 border-b border-line text-[13.5px] align-middle'
export const TR = 'hover:bg-[#FBFBFA] [&:last-child>td]:border-b-0'
export const TT = 'font-semibold'
export const TS = 'text-[12.5px] text-muted mt-0.5'
export const THUMB = 'w-10 h-10 rounded-[10px] shrink-0 bg-green-deep bg-cover bg-center flex items-center justify-center text-white'
export const AVATAR = 'w-8 h-8 rounded-full bg-soft flex items-center justify-center font-bold text-[12px] shrink-0'
export const CODE = 'font-mono font-semibold text-[12px] px-1.5 py-0.5 rounded-md bg-soft whitespace-nowrap'

export const PILL = 'inline-flex items-center gap-[5px] text-[12px] font-semibold px-[9px] py-[3px] rounded-full whitespace-nowrap'
/** Culorile din `pill()` al designului: verde publicat / confirmat, gri ciornă, galben în așteptare, roșu respins. */
export const PILL_TONE: Record<string, string> = {
  PUBLISHED: 'bg-ok-soft text-ok', CONFIRMED: 'bg-ok-soft text-ok', DONE: 'bg-soft text-muted', DRAFT: 'bg-soft text-muted',
  REGISTERED: 'bg-warn-soft text-warn', NO_SHOW: 'bg-bad-soft text-bad', CANCELLED: 'bg-bad-soft text-bad',
}
export const BAR = 'h-1.5 rounded-[3px] bg-soft overflow-hidden min-w-[80px]'

export const BTN = 'h-10 px-4 rounded-xl bg-ink text-white font-semibold text-[14px] inline-flex items-center justify-center gap-1.5 no-underline whitespace-nowrap disabled:opacity-45'
export const BTN_SEC = 'h-10 px-4 rounded-xl border border-line bg-white text-ink font-semibold text-[14px] inline-flex items-center justify-center gap-1.5 no-underline whitespace-nowrap disabled:opacity-45'
export const BTN_SM = 'h-8 px-[11px] rounded-[9px] bg-ink text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1 no-underline whitespace-nowrap disabled:opacity-45'
export const BTN_SM_SEC = 'h-8 px-[11px] rounded-[9px] border border-line bg-white text-ink text-[13px] font-semibold inline-flex items-center justify-center gap-1 no-underline whitespace-nowrap disabled:opacity-45'
export const BTN_SM_OK = 'h-8 px-[11px] rounded-[9px] bg-ok text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-45'

export const INPUT = 'h-10 rounded-[10px] border border-line bg-white px-3 outline-none w-full text-[14px] focus:border-ink focus:shadow-[0_0_0_3px_rgba(17,17,19,.08)]'
export const LABEL = 'font-semibold text-[13px]'
export const FCARD = 'bg-white border border-line rounded-[14px] p-[22px] flex flex-col gap-[18px] min-w-0'
export const FSEC = 'text-[11.5px] font-bold tracking-[.07em] uppercase text-muted pt-1'
export const chip = (on: boolean) => `h-8 px-3 rounded-full border text-[13px] font-semibold ${on ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line'}`

export const LROW = 'flex items-center gap-3 py-2.5 border-b border-line last:border-b-0 text-[13.5px]'
export const FEED_ROW = 'flex gap-2.5 items-start py-2.5 border-b border-line last:border-b-0 text-[13px]'
export const FEED_ICON = 'w-7 h-7 rounded-lg bg-soft flex items-center justify-center shrink-0'
export const EMPTY = 'py-9 px-6 text-center text-muted'
