import { useEffect, useState } from 'react';
const QUERY = '(max-width: 767px)';
/** Celular/tablet em pé: a IDE troca a divisão em colunas por uma tela de cada vez. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches === true);
  useEffect(() => {
    const media = window.matchMedia?.(QUERY); if (!media) return;
    const update = () => setMobile(media.matches); update();
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  return mobile;
}
