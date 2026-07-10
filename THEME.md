# THEME.md — Identidade Visual Rick Roleta

Paleta extraída dos banners oficiais em `/public/banners/` e nos arquivos `AFL-–-*` na raiz do projeto.

## Banners de referência

| Arquivo | Descrição |
|---|---|
| `banner-1-torneio.png` | Horizontal — "Torneio do Rick Roleta · Até R$4.000 em prêmios" |
| `banner-2-lives.png` | Horizontal — "Horários Lives 11h e 21h diárias" |
| `banner-3-vip.png` | Horizontal — "Faça parte do nosso Grupo VIP" |
| `banner-4-suporte.png` | Horizontal — "Suporte ao Vivo" |
| `logo-rick.png` | Vertical/portrait — Logo "RICK ROLETA" com fundo roxo e roleta |
| `banner-principal.png` | Foto editorial (campo futebol/pôr-do-sol) — uso decorativo |
| `banner-rodape.png` | Footer regulatório +18 SPA/MF |

## Tokens — de onde veio cada cor

| Token CSS | Hex | Fonte |
|---|---|---|
| `--brand-primary` | `#8b2fd4` | Roxo vibrante dominante em todos os banners AFL e no logo |
| `--brand-secondary` | `#c084fc` | Destaque/highlight roxo claro (glow dos banners) |
| `--brand-accent` | `#f5bc0e` | Amarelo pontual (accent em destaques) |
| `--brand-glow` | `rgba(139,47,212,0.40)` | Glow derivado do brand-primary |
| `--bg-base` | `#080010` | Fundo ultra-escuro com leve tint roxo |
| `--bg-elevated` | `#0f0020` | Superfície elevada (sidebar, header) |
| `--bg-card` | `#170530` | Cards e painéis |
| `--bg-input` | `#1e0840` | Campos de formulário |
| `--border-subtle` | `rgba(139,47,212,0.12)` | Bordas sutis com tint roxo |
| `--border-muted` | `rgba(139,47,212,0.25)` | Bordas médias |
| `--text-primary` | `#f4f4f4` | Texto principal |
| `--text-secondary` | `#b8a8d0` | Texto secundário (leve tint lavanda) |
| `--text-muted` | `#6b5a82` | Texto apagado |
| `--success` | `#22c55e` | Verde sistema |
| `--danger` | `#ef4444` | Vermelho |
| `--warning` | `#f59e0b` | Amarelo âmbar |
| `--info` | `#a855f7` | Violeta (alinhado à marca) |

## Nota de correção

A primeira iteração usou verde neon (#1de84a) extraído do banner regulatório footer (+18 SPA/MF).
Após análise dos banners oficiais AFL-*-RICK-ROLETA-APP-*, ficou evidente que a cor da marca é **roxo/violeta** (#8b2fd4).
O verde do footer é cor da regulação (padrão SPA/MF), não da marca Rick Roleta.

---

## Linguagem Visual v2 — Redesign sem Bordas

### Princípio de Elevation (sem borda)

Profundidade criada por **tom de fundo** — não por bordas. Quanto mais elevado, mais claro.

| Token | Hex | Uso |
|---|---|---|
| `--surface-1` | `#07000D` | Fundo base (mais escuro) |
| `--surface-2` | `#100820` | Cards e painéis principais |
| `--surface-3` | `#180C2E` | Cards internos, headers de seção |
| `--surface-4` | `#221040` | Inputs, superfícies interativas |

### Sombras

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.35)` | Elevação sutil |
| `--shadow-md` | `0 4px 20px rgba(0,0,0,0.45)` | Cards, tabelas |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.65)` | Modais, overlays |
| `--shadow-glow` | `0 0 28px rgba(139,47,212,0.40)` | Glow da marca |

### Radius

| Token | Valor | Uso |
|---|---|---|
| `--radius-card` | `22px` | Cards hero externos |
| `--radius-inner` | `14px` | Elementos internos de card |

### Gradiente Atmosférico (body)

```css
background-image: radial-gradient(
  ellipse 120% 55% at 50% -5%,
  rgba(26,16,48,0.92) 0%,
  transparent 62%
);
background-attachment: fixed;
```

Cria profundidade visual sutil no topo da tela sem impactar legibilidade.

### HeroCard Pattern

Componente `src/components/HeroCard.tsx` — gradiente roxo diagonal com shimmer.

```
linear-gradient(135deg, #8b2fd4 → #5b0e9c → #2d0070)
boxShadow: 0 8px 32px rgba(139,47,212,0.45) + ring branco 6%
```

Usado no DayHeader da Banca. Internamente usa branco/rgba em vez de tokens semânticos para garantir contraste sobre o gradiente.

### Bottom Nav Pill (mobile)

Nav fixada a `bottom: 12px; left: 12px; right: 12px` com `borderRadius: 9999px`, backdrop blur 16px e box-shadow escuro. FAB central com `translateY(-14px)` e gradient roxo com glow 0.7 opacidade.
