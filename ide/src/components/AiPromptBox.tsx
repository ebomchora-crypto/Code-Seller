import { useEffect, useRef } from 'react';
import { ArrowUp, Bot, ListChecks, MessageCircle, Square, Zap } from 'lucide-react';
import type { AgentMode } from '../lib/agent';

// Caixa de pedido da IA: o mesmo desenho do Code Maker (cantos bem arredondados, brilho roxo, botão redondo).
const MODES: { value: AgentMode; label: string; hint: string; icon: typeof Bot }[] = [
  { value: 'agent', label: 'Agente', hint: 'A IA faz tudo nos arquivos da pasta', icon: Bot },
  { value: 'ask', label: 'Perguntar', hint: 'Só responde, sem alterar nada', icon: MessageCircle },
  { value: 'plan', label: 'Planejar', hint: 'Monta um plano, sem alterar nada', icon: ListChecks },
];

interface Props {
  value: string; onChange: (value: string) => void; onSend: () => void; onStop: () => void;
  busy: boolean; disabled?: boolean; canSend: boolean; placeholder: string; footnote?: string;
  mode?: AgentMode; onMode?: (mode: AgentMode) => void; modes?: AgentMode[];
  auto?: boolean; onAuto?: (value: boolean) => void; maxLength?: number;
}

export default function AiPromptBox({ value, onChange, onSend, onStop, busy, disabled, canSend, placeholder, footnote, mode, onMode, modes, auto, onAuto, maxLength = 30000 }: Props) {
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = field.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 220)}px`; }, [value]);
  const available = MODES.filter(item => !modes || modes.includes(item.value));
  return <div><div className="cm-promptbox" data-busy={busy || undefined}>
    <textarea ref={field} rows={2} className="cm-promptbox-field" aria-label="Pedido para a IA" placeholder={placeholder} value={value} maxLength={maxLength} disabled={disabled}
      onChange={event => onChange(event.target.value)}
      onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (canSend && !busy) onSend(); } }} />
    <div className="cm-promptbox-bar">
      <div className="flex min-w-0 flex-1 items-center gap-0.5 flex-wrap">
        {mode && onMode && available.length > 1 && available.map(item => <button key={item.value} type="button" disabled={busy} title={item.hint} aria-pressed={mode === item.value} className="cm-chip" data-active={mode === item.value || undefined} onClick={() => onMode(item.value)}><item.icon size={13} />{item.label}</button>)}
        {mode === 'agent' && onAuto && <button type="button" title="Quando ligado, os comandos do terminal rodam sem pedir a sua permissão (só em pastas marcadas como confiáveis)" aria-pressed={!!auto} className="cm-chip" data-active={auto || undefined} onClick={() => onAuto(!auto)}><Zap size={13} />Auto</button>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {busy
          ? <button type="button" className="cm-send cm-send-stop" onClick={onStop} aria-label="Parar"><Square size={13} fill="currentColor" /></button>
          : <button type="button" className="cm-send" disabled={!canSend} onClick={onSend} aria-label="Enviar"><ArrowUp size={17} /></button>}
      </div>
    </div>
  </div>
  {footnote && <p className="mt-1.5 text-center text-[10px] text-vs-dim">{footnote}</p>}
  </div>;
}
