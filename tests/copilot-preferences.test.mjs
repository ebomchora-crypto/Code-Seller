import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_COPILOT_PREFERENCES } from '../src/types/autopilot.ts'

test('a new Copilot conversation does not select a sales playbook', () => {
  assert.equal(DEFAULT_COPILOT_PREFERENCES.playbook, 'none')
})
