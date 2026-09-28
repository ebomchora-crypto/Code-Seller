import assert from 'node:assert/strict'
import test from 'node:test'

import { FULL_NAME_HEADER, GOOGLE_HEADER_ALIASES, addFullNameColumn, firstCsvValue, normalizeCsvHeader } from './contactCsv.ts'

test('junta Nome, Nome do meio e Sobrenome do CSV do Google', () => {
  const headers = ['First Name', 'Middle Name', 'Last Name', 'E-mail 1 - Value']
  const rows = [
    { 'First Name': 'Ana', 'Middle Name': '', 'Last Name': 'Souza', 'E-mail 1 - Value': 'ana@x.com' },
    { 'First Name': 'João', 'Middle Name': 'P.', 'Last Name': 'Lima', 'E-mail 1 - Value': '' },
  ]
  const result = addFullNameColumn(headers, rows)
  assert.equal(result.headers[0], FULL_NAME_HEADER)
  assert.equal(result.rows[0][FULL_NAME_HEADER], 'Ana Souza')
  assert.equal(result.rows[1][FULL_NAME_HEADER], 'João P. Lima')
})

test('usa a empresa quando não há nome', () => {
  const headers = ['First Name', 'Last Name', 'Organization Name']
  const rows = [{ 'First Name': '', 'Last Name': '', 'Organization Name': 'Padaria Sol' }]
  assert.equal(addFullNameColumn(headers, rows).rows[0][FULL_NAME_HEADER], 'Padaria Sol')
})

test('formato antigo do Google (Given Name / Family Name)', () => {
  const headers = ['Given Name', 'Family Name']
  const rows = [{ 'Given Name': 'Bia', 'Family Name': 'Reis' }]
  assert.equal(addFullNameColumn(headers, rows).rows[0][FULL_NAME_HEADER], 'Bia Reis')
})

test('não mexe quando já existe coluna de nome', () => {
  const headers = ['nome', 'First Name']
  const rows = [{ nome: 'Carlos', 'First Name': 'C' }]
  const result = addFullNameColumn(headers, rows)
  assert.deepEqual(result.headers, headers)
  assert.equal(result.rows, rows)
})

test('apelidos das colunas do Google', () => {
  assert.equal(GOOGLE_HEADER_ALIASES[normalizeCsvHeader('E-mail 1 - Value')], 'email')
  assert.equal(GOOGLE_HEADER_ALIASES[normalizeCsvHeader('Phone 1 - Value')], 'phone')
  assert.equal(GOOGLE_HEADER_ALIASES[normalizeCsvHeader(FULL_NAME_HEADER)], 'name')
})

test('campos com vários valores do Google ficam só com o primeiro', () => {
  assert.equal(firstCsvValue('phone', '+55 16 99999-0000 ::: +55 16 3333-4444'), '+55 16 99999-0000')
  assert.equal(firstCsvValue('email', 'a@x.com ::: b@y.com'), 'a@x.com')
  assert.equal(firstCsvValue('phone', ' ::: +55 11 98888-7777'), '+55 11 98888-7777')
  assert.equal(firstCsvValue('phone', '(16) 99999-0000'), '(16) 99999-0000')
  assert.equal(firstCsvValue('notes', 'cliente antigo ::: pediu orçamento'), 'cliente antigo · pediu orçamento')
})
