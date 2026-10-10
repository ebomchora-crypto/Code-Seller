import { useEffect, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { api } from '../lib/api';

type Status = { ai: boolean; model: string | null; account?: { signedIn: boolean; email: string } };

/** Entrada com a conta do Code Sellers: é ela que liga o assistente de IA na IDE instalada (sem chave para digitar). */
export default function AccountLogin({ status, changed }: { status: Status | null; changed: () => void }) {
  const [waiting, setWaiting] = useState(false); const [error, setError] = useState('');
  const signedIn = status?.account?.signedIn;
  // Depois de clicar em "Entrar", o navegador abre; aqui só esperamos a IDE perceber que o login terminou.
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => changed(), 2000); const stop = setTimeout(() => setWaiting(false), 10 * 60_000);
    return () => { clearInterval(timer); clearTimeout(stop); };
  }, [waiting, changed]);
  useEffect(() => { if (signedIn) setWaiting(false); }, [signedIn]);
  async function start() { setError(''); try { await api('/account/start', 'POST', {}); setWaiting(true); } catch (e) { setError((e as Error).message); } }
  async function leave() { setError(''); try { await api('/account/logout', 'POST', {}); changed(); } catch (e) { setError((e as Error).message); } }
  if (!status) return null;
  if (signedIn) return <p className="text-xs mt-2 flex items-center gap-2 flex-wrap" style={{ color: 'var(--vs-fg-muted)' }}>Conectado: {status.account?.email}<button className="underline inline-flex items-center gap-1" onClick={() => void leave()}><LogOut size={12} />Sair</button></p>;
  if (status.ai) return null;
  return <div className="mt-3">
    <button className="btn-primary w-full" onClick={() => void start()} disabled={waiting}><LogIn size={14} />{waiting ? 'Aguardando o login no navegador…' : 'Entrar com o Code Sellers'}</button>
    <p className="text-xs mt-2" style={{ color: 'var(--vs-fg-dim)' }}>{waiting ? 'Conclua o login na janela que abriu no navegador. Esta tela atualiza sozinha.' : 'O assistente usa a IA do Code Sellers: é só entrar com a sua conta, sem chave nem configuração.'}</p>
    {error && <p role="alert" className="error-banner mt-2">{error}</p>}
  </div>;
}
