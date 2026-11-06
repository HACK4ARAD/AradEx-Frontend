<script setup lang="ts">
import { useRouter } from 'vue-router'
import { AppIcon } from '@/shared/components'
import LoginForm from '@/shared/components/auth/LoginForm.vue'

const router = useRouter()
</script>

<template>
  <button class="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center mb-3" @click="router.back()"><AppIcon name="arrow_back" /></button>
  <LoginForm />
</template>
