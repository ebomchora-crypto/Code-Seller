import assert from 'node:assert/strict'
import test from 'node:test'
import { readCopilotSidebarCollapsed, writeCopilotSidebarCollapsed } from './copilotLayout.ts'

class MapStorage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
}

test('sidebar collapse preference round-trips through browser storage', () => {
  const storage = new MapStorage()
  assert.equal(readCopilotSidebarCollapsed(storage), false)
  writeCopilotSidebarCollapsed(storage, true)
  assert.equal(readCopilotSidebarCollapsed(storage), true)
  writeCopilotSidebarCollapsed(storage, false)
  assert.equal(readCopilotSidebarCollapsed(storage), false)
})

test('invalid or unavailable storage falls back to expanded', () => {
  assert.equal(readCopilotSidebarCollapsed({ getItem: () => 'unexpected' }), false)
  assert.equal(readCopilotSidebarCollapsed({ getItem: () => { throw new Error('blocked') } }), false)
  assert.doesNotThrow(() => writeCopilotSidebarCollapsed({ setItem: () => { throw new Error('blocked') } }, true))
})
