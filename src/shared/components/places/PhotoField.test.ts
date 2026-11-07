import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/shared/i18n'
import PhotoField from './PhotoField.vue'
import { isExternalImage, mediaApi } from '@/shared/api/media'

const opts = { global: { plugins: [i18n] } }

describe('PhotoField', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('uploads the picked file and puts the returned URL in the field', async () => {
    const upload = vi.spyOn(mediaApi, 'upload').mockResolvedValue({
      url: 'https://api.test/api/v1/media/uploads/ab.jpg', key: 'uploads/ab.jpg', contentType: 'image/jpeg', size: 3,
    })
    const w = mount(PhotoField, { props: { label: 'Poză (URL)', modelValue: 'https://www.visitarad.ro/x.jpg' }, ...opts })
    expect(w.text()).toContain('Pe alt site: www.visitarad.ro · se copiază automat în S3')
    expect(w.find('[data-test="photo-url"]').exists()).toBe(false)

    const input = w.find('[data-test="photo-input"]')
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'poza.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    expect(upload).toHaveBeenCalledWith(file)
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['https://api.test/api/v1/media/uploads/ab.jpg'])
  })

  it('shows the link only on request', async () => {
    const w = mount(PhotoField, { props: { label: 'Poză', modelValue: '' }, ...opts })
    expect(w.text()).toContain('Adaugă o poză')
    await w.find('[data-test="photo-link-toggle"]').trigger('click')
    await w.find('[data-test="photo-url"]').setValue('https://api.test/api/v1/media/uploads/ab.jpg')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['https://api.test/api/v1/media/uploads/ab.jpg'])
  })

  it('tells our photos from photos on other sites', () => {
    expect(isExternalImage('https://www.visitarad.ro/storage/a.jpg')).toBe(true)
    expect(isExternalImage('https://api.test/api/v1/media/places/a.jpg')).toBe(false)
    expect(isExternalImage('/img/loc-ca.jpg')).toBe(false)
    expect(isExternalImage(undefined)).toBe(false)
  })
})
