import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp } from '../lib/layout';

type SashProps = {
  /** vertical = linha vertical que muda a largura; horizontal = linha que muda a altura. */
  orientation: 'vertical' | 'horizontal';
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Ao arrastar para a esquerda/para cima o tamanho cresce (painel preso à direita/embaixo). */
  invert?: boolean;
  /** Chamado ao soltar, para guardar o tamanho final. */
  onCommit?: (value: number) => void;
  label: string;
  /** Posição da divisória dentro do pai (padrão: borda esquerda/superior do painel). */
  edge?: 'start' | 'end';
};

// Divisória arrastável no estilo do VS Code (sash): 4px, fica azul ao passar o
// mouse, redimensiona pelo ponteiro e pelas setas do teclado.
export function Sash({ orientation, value, min, max, onChange, invert = false, onCommit, label, edge = 'start' }: SashProps) {
  const start = useRef<{ pointer: number; size: number } | null>(null);
  const [active, setActive] = useState(false);
  const vertical = orientation === 'vertical';
  const sign = invert ? -1 : 1;
  function down(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { pointer: vertical ? event.clientX : event.clientY, size: value };
    setActive(true);
    document.body.classList.add('is-dragging');
    document.body.style.cursor = vertical ? 'col-resize' : 'row-resize';
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const delta = (vertical ? event.clientX : event.clientY) - start.current.pointer;
    onChange(clamp(start.current.size + sign * delta, min, max));
  }
  function up(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const delta = (vertical ? event.clientX : event.clientY) - start.current.pointer;
    const final = clamp(start.current.size + sign * delta, min, max);
    start.current = null;
    setActive(false);
    document.body.classList.remove('is-dragging');
    document.body.style.cursor = '';
    onCommit?.(final);
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    const grow = vertical ? (invert ? 'ArrowLeft' : 'ArrowRight') : (invert ? 'ArrowUp' : 'ArrowDown');
    const shrink = vertical ? (invert ? 'ArrowRight' : 'ArrowLeft') : (invert ? 'ArrowDown' : 'ArrowUp');
    if (event.key !== grow && event.key !== shrink) return;
    event.preventDefault();
    const next = clamp(value + (event.key === grow ? 16 : -16), min, max);
    onChange(next); onCommit?.(next);
  }
  const position = vertical ? (edge === 'start' ? { left: -2 } : { right: -2 }) : (edge === 'start' ? { top: -2 } : { bottom: -2 });
  return <div role="separator" aria-orientation={vertical ? 'vertical' : 'horizontal'} aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={min} aria-valuemax={max} tabIndex={0}
    className={`${vertical ? 'sash-v' : 'sash-h'} ${active ? 'sash-active' : ''}`} style={position}
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key} />;
}
