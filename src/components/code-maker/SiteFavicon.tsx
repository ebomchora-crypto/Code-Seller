import { faviconDataUri } from '../../../supabase/functions/code-maker/site'
import type { SiteIconFields } from '@/services/supabase/codeMaker'

// O ícone do site: o que a IA desenhou ou, nos sites antigos, a inicial do nome na cor da marca.
export function SiteFavicon({ site, size = 32, className = '' }: { site: { name: string } & SiteIconFields; size?: number; className?: string }) {
  const src = faviconDataUri({
    title: site.name,
    favicon: site.favicon ?? undefined,
    palette: { brand: site.brand ?? undefined, brandDark: site.brand_dark ?? undefined, accent: site.accent ?? undefined },
  })
  return <img src={src} alt="" width={size} height={size} draggable={false} className={`shrink-0 rounded-[28%] ${className}`} style={{ width: size, height: size }} />
}
