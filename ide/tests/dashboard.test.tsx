import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
test('project creation failure remains visible and preserves the entered name', async () => {
  vi.stubGlobal('fetch', async (_url: string, options?: RequestInit) => new Response(JSON.stringify(options?.method === 'POST' ? { error: 'Não foi possível gravar no disco.' } : []), { status: options?.method === 'POST' ? 500 : 200, headers: { 'Content-Type': 'application/json' } }));
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Novo projeto/i }));
  fireEvent.change(screen.getByPlaceholderText('Nome do projeto'), { target: { value: 'Meu app' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar projeto' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('gravar no disco'));
  expect((screen.getByPlaceholderText('Nome do projeto') as HTMLInputElement).value).toBe('Meu app');
});
