import { afterEach, expect, test, vi } from 'vitest';
import { streamChat } from '../src/lib/chat';
afterEach(() => vi.unstubAllGlobals());
test('streaming handles split packets and retains accented characters', async () => {
  const encoded = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Olá"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":" mundo"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
  vi.stubGlobal('fetch', async () => new Response(new ReadableStream({ start(controller) { for (let index = 0; index < encoded.length; index += 3) controller.enqueue(encoded.slice(index, index + 3)); controller.close(); } })));
  const output: string[] = [];
  const result = await streamChat('local', {}, new AbortController().signal, value => output.push(value));
  expect(result).toBe('Olá mundo'); expect(output.at(-1)).toBe('Olá mundo');
});
test('incomplete generations cannot become accepted AI proposals', async () => {
  vi.stubGlobal('fetch', async () => new Response('data: {"choices":[{"delta":{"content":"parcial"}}]}\n\n'));
  await expect(streamChat('local', {}, new AbortController().signal, () => {})).rejects.toThrow('incompleta');
});
