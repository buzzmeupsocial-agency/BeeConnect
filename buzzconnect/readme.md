# BuzzConnect — Design System (UI de produto)

BuzzConnect é o painel que a BuzzMeUp entrega para clientes acompanharem suas campanhas: investimento, ritmo diário, projeção, leads e campanhas. É uma extensão da identidade BuzzMeUp para uma **interface de produto densa em dados** — diferente das peças de marketing (posts/anúncios) do sistema irmão em `../` (design system BuzzMeUp).

Fonte de partida: referência funcional de um dashboard já em uso pelo cliente "Winepopper" (`../uploads/pasted-1787071433226-0.png`), com estrutura validada (abas, cards de KPI, gráficos de barra + linha) mas em tons neutros genéricos. Este sistema define como essa estrutura absorve a identidade visual da marca. Ver `../Moodboard BuzzConnect.dc.html` para o moodboard completo com todas as decisões visuais.

## Produto
Painel web (dashboard) de acompanhamento de campanhas, navegação por abas dentro de uma conta de cliente: Investimento · Leads e Compras · Campanhas · Criativos campeões. Conteúdo é predominantemente numérico/gráfico — não é conteúdo de marketing.

## Diferenças-chave vs. o design system BuzzMeUp (marketing)
- **Laranja é reservado para ação/destaque** (CTA, projeção, barra ativa) — não preenche fundos grandes como nos posts.
- **Fundo neutro `#F1F0ED`**, cards em branco puro com borda `#D8D3CC` — sem fotografia, sem overlays.
- **Stinger só em títulos de página/aba** — nunca em KPIs, tabelas ou labels (é condensado demais para números tabulares). Valores numéricos usam Basic Sans 700, não Poppins (Poppins é exclusivo de estatísticas grandes de post social).
- **Cores de série de dados**: laranja = canal 1 (ex. Meta Ads), roxo = canal 2 (ex. Google Ads) — reaproveita os acentos da marca como paleta categórica.
- **Duas cores novas, só para status**: verde (`#72C064`, já existia como acento positivo) e vermelho `#E4574C` (novo — alerta/queda). Nunca decorativos, só semânticos.
- **Sem fotografia, sem motivos gráficos** (seta/anéis/grid) — esses são de marketing, não aparecem em tela de produto.

## Padrões de componente
- **KpiCard**: label eyebrow + valor grande + legenda curta. Linha de 3 no topo de cada aba.
- **TabBar**: pílulas, aba ativa em preto sólido (não laranja — laranja é para ação, não para estado ativo de navegação).
- **BarChart**: barras diárias, realizado em cor sólida, período futuro/projeção na mesma cor a 30% opacidade.
- **StatusDot**: ponto colorido + label, para legendas de meta/ritmo.

## Índice
- `tokens/index.css` — importa fontes (reaproveitadas de `../tokens/fonts.css`) + cores/tipografia/espaçamento específicos de produto
- `components/cards/KpiCard`, `components/nav/TabBar`, `components/charts/BarChart`, `components/status/StatusDot`
- `../Moodboard BuzzConnect.dc.html` — moodboard visual de referência (ler antes de implementar)
- `../assets/` — logos da marca (reaproveitados); `../fonts/` — Stinger, Basic Sans

## Caveats
- Não há Figma nem codebase do BuzzConnect anexado — este sistema foi inferido a partir de uma única captura de tela de referência + da identidade BuzzMeUp já documentada. Fluxos, estados vazios, erros e responsividade não foram definidos — decidir caso a caso seguindo os princípios acima (laranja = ação, preto = estado ativo neutro, Basic Sans em todo número).
- Ícones: a marca não tem biblioteca própria; para UI de produto (diferente de posts), é aceitável usar uma lib de ícones de traço simples (ex. Lucide/Phosphor) em 1 cor, já que dashboards exigem iconografia funcional que os posts não exigem.
