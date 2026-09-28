import assert from 'node:assert/strict'
import test from 'node:test'

import { cropOverflow, cropStyle, dragCrop, initialCrop, normalizeCrop, slugify, validateSlug } from './portfolio.ts'

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

test('ajuste da imagem: valores do banco viram um ajuste válido', () => {
  assert.deepEqual(normalizeCrop(null), { x: 50, y: 50, zoom: 1, fit: 'cover' })
  assert.deepEqual(normalizeCrop({ x: -20, y: 140, zoom: 9, fit: 'contain' }), { x: 0, y: 100, zoom: 3, fit: 'contain' })
  assert.deepEqual(normalizeCrop({ x: '10', zoom: 0.5, fit: 'x' }), { x: 50, y: 50, zoom: 1, fit: 'cover' })
})

test('ajuste da imagem: print alto começa no topo', () => {
  assert.equal(initialCrop(1440, 5000).y, 0)
  assert.equal(initialCrop(1920, 1080).y, 50)
  assert.equal(initialCrop(1600, 1000).y, 50)
})

test('ajuste da imagem: arrastar e zoom', () => {
  const frame = { width: 320, height: 200 }
  // Imagem bem alta: sobra só na vertical (sem zoom).
  const tall = cropOverflow(frame, { width: 1000, height: 3000 }, 1)
  assert.equal(tall.x, 0)
  assert.equal(tall.y, 760)
  // Com zoom 2 sobra nas duas direções.
  const zoomed = cropOverflow(frame, { width: 1600, height: 1000 }, 2)
  assert.deepEqual(zoomed, { x: 320, y: 200 })
  // Arrastar a imagem para cima (dy negativo) desce o ponto visível.
  const moved = dragCrop({ x: 50, y: 0, zoom: 1, fit: 'cover' }, 30, -380, tall)
  assert.deepEqual(moved, { x: 50, y: 50, zoom: 1, fit: 'cover' })
  // Nunca passa das bordas.
  assert.equal(dragCrop({ x: 50, y: 50, zoom: 2, fit: 'cover' }, 10_000, 0, zoomed).x, 0)
  assert.deepEqual(cropStyle({ x: 50, y: 0, zoom: 1, fit: 'cover' }), { objectPosition: '50% 0%' })
  assert.deepEqual(cropStyle({ x: 20, y: 30, zoom: 2, fit: 'cover' }), { objectPosition: '20% 30%', transform: 'scale(2)', transformOrigin: '20% 30%' })
})
