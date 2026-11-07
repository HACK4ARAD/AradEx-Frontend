// Componente generice de UI (Clean Ink). Componentele de feature stau în subfoldere pe feature: components/auth/LoginForm.vue, components/events/EventCard.vue …
export { default as AppIcon } from './ui/AppIcon.vue'
export { default as AppButton } from './ui/AppButton.vue'
export { default as AppChip } from './ui/AppChip.vue'
export { default as AppCard } from './ui/AppCard.vue'
export { default as AppInput } from './ui/AppInput.vue'
export { default as EmptyState } from './ui/EmptyState.vue'
export { default as Skeleton } from './ui/Skeleton.vue'
export { default as AppToast } from './ui/AppToast.vue'
export { default as ApiStatus } from './ui/ApiStatus.vue'
export { default as PlaceholderScreen } from './ui/PlaceholderScreen.vue'
export { default as AppSheet } from './ui/AppSheet.vue'
// Componentele de feature se importă direct din fișierul lor (nu se adaugă aici):
//   qr/QrCode, qr/QrScanner (T02, gata) · events/EventCard (T06) · places/PlaceCard, places/AudioGuideBar (T05) · map/MapView (T08)
//   offers/OfferCard (T10) · community/ActionCard (T11)
