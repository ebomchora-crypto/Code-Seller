import assert from 'node:assert/strict'
import test from 'node:test'
import { entryFromHtml, isOutdated } from './appVersion.ts'

test('reads the main file of the published page', () => {
  const html = '<script>x</script><script type="module" crossorigin src="/assets/r2/index-Crfyceg5.js"></script>'
  assert.equal(entryFromHtml(html), '/assets/r2/index-Crfyceg5.js')
  assert.equal(entryFromHtml('<html></html>'), null)
})

test('only a different published file counts as a new version', () => {
  assert.equal(isOutdated('/assets/r2/index-a.js', '/assets/r2/index-b.js'), true)
  assert.equal(isOutdated('/assets/r2/index-a.js', '/assets/r2/index-a.js'), false)
  assert.equal(isOutdated(null, '/assets/r2/index-b.js'), false)
  assert.equal(isOutdated('/assets/r2/index-a.js', null), false)
})
