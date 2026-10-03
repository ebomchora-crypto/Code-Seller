import assert from 'node:assert/strict'
import test from 'node:test'

import { internationalPhone } from '../../supabase/functions/_shared/countries.ts'
import { whatsappUrl } from './contactLinks.ts'
import { phoneDigits } from '../../supabase/functions/code-maker/site.ts'

test('WhatsApp usa o código do país do número', () => {
  assert.equal(whatsappUrl('(11) 99999-0000'), 'https://wa.me/5511999990000')
  assert.equal(whatsappUrl('+351 912 345 678'), 'https://wa.me/351912345678')
  assert.equal(whatsappUrl('0044 7700 900123'), 'https://wa.me/447700900123')
})

test('telefone da busca vira internacional pelo país', () => {
  assert.equal(internationalPhone('912 345 678', null, 'PT'), '+351912345678')
  assert.equal(internationalPhone('07700 900123', null, 'GB'), '+447700900123')
  assert.equal(internationalPhone(null, '+34600111222', 'ES'), '+34600111222')
  assert.equal(internationalPhone('351912345678', null, 'PT'), '+351912345678')
})

test('Code Maker monta o WhatsApp com o código do país', () => {
  assert.equal(phoneDigits('19998887777'), '5519998887777')
  assert.equal(phoneDigits('+351 912 345 678'), '351912345678')
  assert.equal(phoneDigits('123'), null)
})
