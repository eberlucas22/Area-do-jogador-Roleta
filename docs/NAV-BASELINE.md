# NAV-BASELINE — Diagnóstico de Navegação

## Data: 2026-07-15

---

## 1. Região

| Componente | Região detectada | Observação |
|---|---|---|
| Vercel Functions | `iad1` (Virginia, EUA) — padrão sem config | Antes da correção |
| Supabase | `sa-east-1` (São Paulo) — verificar em Dashboard → Settings → General | Inferido pelo domínio `.com.br` |

**Instrução para confirmar região do Supabase:**
1. Acesse [app.supabase.com](https://app.supabase.com) → seu projeto
2. Settings → General → "Region" — deve mostrar `South America (São Paulo)`

**Correção aplicada:** `vercel.json` com `"regions": ["gru1"]` (São Paulo).
Efeito esperado: latência de round-trip Vercel → Supabase cai de ~150ms para ~10-20ms.

---

## 2. Páginas com render bloqueante

| Rota | Tipo | Problema | Status |
|---|---|---|---|
| `[affiliate]/layout.tsx` | Server | `fetchBranding()` com `noStore()` — sem cache | **Corrigido** — cache 60s com admin client |
| `[affiliate]/suporte/` | Server Component (`SuporteModule`) | Query Supabase sem cache — bloqueia toda visita | **Corrigido** — cache 60s |
| demais seções | Client Components | Dados buscados no cliente após hydration | OK — não bloqueiam o shell |

---

## 3. Server-Timing

Server-Timing de RSC não é facilmente injetável em Next.js App Router sem middleware customizado.
Medição alternativa: Network tab do DevTools, coluna "Waiting (TTFB)" nas requests de navegação
(`/_next/data/...` ou RSC payloads).

### Estimativas antes das correções (produção, usuário no Brasil)

| Seção | TTFB estimado | Dominante |
|---|---|---|
| Banca | ~160ms | Round-trip Vercel iad1 → Brasil |
| Histórico | ~160ms | Round-trip Vercel iad1 → Brasil |
| Jogadas | ~160ms | Round-trip Vercel iad1 → Brasil |
| Vídeos | ~160ms | Round-trip Vercel iad1 → Brasil |
| **Suporte** | ~160ms + ~80ms Supabase = **~240ms** | Round-trip + query sem cache |
| Regras | ~160ms | Round-trip Vercel iad1 → Brasil |

### Estimativas após correções

| Seção | TTFB esperado | Melhoria |
|---|---|---|
| Banca | ~15-30ms | **-130ms** |
| Histórico | ~15-30ms | **-130ms** |
| Jogadas | ~15-30ms | **-130ms** |
| Vídeos | ~15-30ms | **-130ms** |
| **Suporte** | ~15-30ms (cache hit) | **-210ms** |
| Regras | ~15-30ms | **-130ms** |

---

## 4. Checklist de correções aplicadas

- [x] **Fase 1** — `vercel.json` com `regions: ["gru1"]`
- [x] **Fase 1** — `fetchBranding()`: removido `noStore()`, adicionado `unstable_cache` 60s com admin client
- [x] **Fase 2** — Press animation `.nav-tap:active` na bottom nav mobile
- [x] **Fase 3** — `loading.tsx` criado para: banca, historico, jogadas, videos, suporte, regras
- [x] **Fase 4** — `SuporteModule`: query cacheada com `unstable_cache` 60s via admin client
- [x] **Fase 5** — Nav usa `<Link>` em todas as rotas (prefetch automático em produção) ✓
- [x] **Fase 6** — Gráficos já usam `next/dynamic` (ssr:false) em BancaModule e HistoricoModule ✓

---

## 5. Arquivos modificados

| Arquivo | Fase | Mudança |
|---|---|---|
| `vercel.json` | 1 | Criado — `regions: ["gru1"]` |
| `src/lib/branding.ts` | 1, 4 | Removido `noStore()`, adicionado `unstable_cache` 60s |
| `src/components/modules/SuporteModule.tsx` | 4 | Query cacheada via admin client |
| `src/app/globals.css` | 2 | `.nav-tap` press animation |
| `src/components/Sidebar.tsx` | 2 | `className="nav-tap"` em MobileNavItem |
| `src/app/[affiliate]/banca/loading.tsx` | 3 | Criado — skeleton |
| `src/app/[affiliate]/historico/loading.tsx` | 3 | Criado — skeleton |
| `src/app/[affiliate]/jogadas/loading.tsx` | 3 | Criado — skeleton |
| `src/app/[affiliate]/videos/loading.tsx` | 3 | Criado — skeleton |
| `src/app/[affiliate]/suporte/loading.tsx` | 3 | Criado — skeleton |
| `src/app/[affiliate]/regras/loading.tsx` | 3 | Criado — skeleton |
