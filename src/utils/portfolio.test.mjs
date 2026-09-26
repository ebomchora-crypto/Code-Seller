import assert from 'node:assert/strict'
import test from 'node:test'

import { slugify, validateSlug } from './portfolio.ts'

test('gera apelido a partir do nome', () => {
  assert.equal(slugify('Arthur Filipe'), 'arthur-filipe')
  assert.equal(slugify('  AQ Solutions — Sites & Sistemas!  '), 'aq-solutions-sites-sistemas')
  assert.equal(slugify('João Ávila'), 'joao-avila')
})

test('valida formato, reservados e palavrões', () => {
  assert.equal(validateSlug('arthur'), null)
  assert.equal(validateSlug('aq-solutions'), null)
  assert.ok(validateSlug('ab'))
  assert.ok(validateSlug('-arthur'))
  assert.ok(validateSlug('Arthur'))
  assert.ok(validateSlug('admin'))
  assert.ok(validateSlug('site-porra'))
})
