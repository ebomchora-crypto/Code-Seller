import assert from 'node:assert/strict'
import test from 'node:test'

import { filterChoices, mergeChoices } from './choiceList.ts'

test('junta sem repetir e mantém as sugestões primeiro', () => {
  assert.deepEqual(mergeChoices(['Barbearia', 'Clínica'], ['clinica', 'Odontologia', 'Auto elétrica', 'Odontologia', ' ']), [
    'Barbearia',
    'Clínica',
    'Auto elétrica',
    'Odontologia',
  ])
})

test('filtra ignorando acento e maiúsculas', () => {
  assert.deepEqual(filterChoices(['Clínica', 'Estética', 'Barbearia'], 'clin'), ['Clínica'])
  assert.deepEqual(filterChoices(['Clínica', 'Barbearia'], ''), ['Clínica', 'Barbearia'])
})
