import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, ImagePlus, ListChecks, MessageCircle, Square, X, Zap } from 'lucide-react';
import type { AgentMode } from '../lib/agent';
import { fileToDataUrl, MAX_IMAGES } from '../lib/images';

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
  /** Imagens anexadas (data URL). Sem `onImages`, o botão de anexar não aparece. */
  images?: string[]; onImages?: (images: string[]) => void;
}

export default function AiPromptBox({ value, onChange, onSend, onStop, busy, disabled, canSend, placeholder, footnote, mode, onMode, modes, auto, onAuto, maxLength = 30000, images = [], onImages }: Props) {
  const field = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');
  const add = async (files: File[]) => {
    if (!onImages || !files.length) return;
    setProblem('');
    try {
      const next = [...images];
      for (const file of files) { if (next.length >= MAX_IMAGES) { setProblem(`Até ${MAX_IMAGES} imagens por pedido.`); break; } next.push(await fileToDataUrl(file)); }
      onImages(next);
    } catch (error) { setProblem((error as Error).message); }
  };
  useEffect(() => { const el = field.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 220)}px`; }, [value]);
  const available = MODES.filter(item => !modes || modes.includes(item.value));
  return <div><div className="cm-promptbox" data-busy={busy || undefined}>
    {images.length > 0 && <div className="flex flex-wrap gap-2 px-1.5 pb-1.5 pt-0.5">{images.map((url, index) => <div key={index} className="group relative"><img src={url} alt={`Imagem anexada ${index + 1}`} className="size-14 rounded-xl border border-vs-border object-cover" /><button type="button" aria-label="Remover imagem" onClick={() => onImages?.(images.filter((_, i) => i !== index))} className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-black/80 text-white shadow"><X size={11} /></button></div>)}</div>}
    <textarea ref={field} rows={2} className="cm-promptbox-field" aria-label="Pedido para a IA" placeholder={placeholder} value={value} maxLength={maxLength} disabled={disabled}
      onChange={event => onChange(event.target.value)}
      onPaste={event => { const files = [...event.clipboardData.files].filter(file => file.type.startsWith('image/')); if (files.length && onImages) { event.preventDefault(); void add(files); } }}
      onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (canSend && !busy) onSend(); } }} />
    <div className="cm-promptbox-bar">
      <div className="flex min-w-0 flex-1 items-center gap-0.5 flex-wrap">
        {onImages && <><button type="button" className="cm-chip" title="Anexar imagem (print de erro, design para copiar…)" aria-label="Anexar imagem" disabled={busy || images.length >= MAX_IMAGES} onClick={() => picker.current?.click()}><ImagePlus size={15} /></button><input ref={picker} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={event => { void add([...(event.target.files ?? [])]); event.target.value = ''; }} /></>}
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
  {problem && <p className="mt-1.5 text-center text-[11px] text-vs-warning" role="alert">{problem}</p>}
  {footnote && <p className="mt-1.5 text-center text-[10px] text-vs-dim">{footnote}</p>}
  </div>;
}
