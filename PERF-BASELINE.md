# PERF-BASELINE — Antes das Otimizações
**Data:** 2026-07-10
**Build:** Next.js 16.2.10 (Turbopack)

## Bundle Estático (antes)
| Métrica | Valor |
|---------|-------|
| Total JS chunks | **2.42 MB** (minificado, não gzip) |
| CSS | 33 KB |
| Total static/ | 4.1 MB (inclui fontes woff2) |
| Maior chunk JS | ~344 KB |

## Problemas Identificados
### Código Morto (3 arquivos órfãos)
| Arquivo | Tamanho estimado |
|---------|-----------------|
| `src/components/PlatformsSheet.tsx` | ~15 KB |
| `src/components/BannerRick.tsx` | ~3 KB |
| `src/components/PlatformsSection.tsx` | ~4 KB |

### Heavy libs sem lazy loading
| Lib | npm size | Onde usada |
|-----|----------|-----------|
| recharts | 9.1 MB (npm) | BancaModule + HistoricoModule (carregam junto com a rota) |
| framer-motion | 5.6 MB (npm) | AgeGate (root layout), BannerCarousel, Sidebar, Toast |
| pdfjs-dist | 37 MB (npm) | admin/materiais (já é `await import()` ✓) |
| lucide-react | 39 MB (npm) | Importações named → tree-shaken ✓ |

### Queries ineficientes
| Arquivo | Query |
|---------|-------|
| `JogadasModule.tsx` | `select("*")` → retorna ~8 colunas desnecessárias |
| `SuporteModule.tsx` | `select("*")` |
| `BancaModule.tsx` | `select("*")` (settings + gestao_cycles) |
| `admin/jogadas/page.tsx` | `select("*")` |
| `admin/materiais/page.tsx` | `select("*")` |

### Imagens
- 24 `<img>` sem next/image
- `next.config.ts` sem `images.remotePatterns` → zero otimização de imagens externas
- Supabase Storage URLs não otimizadas

### Arquitetura
- 27 componentes "use client" — todos necessários (sem candidatos a server fáceis)
- Todas as rotas dinâmicas (ƒ) — nenhuma estática pré-gerada

## Metas
| Métrica | Meta |
|---------|------|
| First Load JS (rotas do jogador) | < 170 kB |
| Total JS chunks | < 1.8 MB (-25%) |
| `select("*")` eliminados | 100% |
| Arquivos mortos removidos | 3/3 |
