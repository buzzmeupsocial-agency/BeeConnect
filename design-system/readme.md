# BuzzMeUp — Design System

BuzzMeUp é uma agência de marketing de influência: conecta marcas a criadores e gerencia campanhas, tráfego pago e gestão comercial. O material de origem para este sistema é o próprio trabalho visual produzido no projeto ("Layouts visuais BuzzMeUp"): um moodboard de marca, 8 templates de post (1080×1350), 3 templates de anúncio e um carrossel completo publicado ("O Brasil é o 11º maior mercado de wellness do mundo"). Não há Figma nem codebase de produto anexados — este é um sistema **brand-guidelines-only**, construído a partir das peças de marketing já criadas no projeto.

Fontes usadas como referência (arquivos deste mesmo projeto):
- `Moodboard BuzzMeUp.dc.html` — paleta, tipografia, logotipo
- `Layouts Padrão BuzzMeUp.dc.html` — 8 modelos de post
- `Layout Padrão - Anúncios.dc.html` — 3 modelos de anúncio (seta, anéis, grid de pontos)
- `Post 01 - Mercado de Saúde (Carrossel).dc.html` — carrossel de 7 slides

## Produtos
BuzzMeUp não tem um app ou site com telas de produto neste projeto — o output da marca é **conteúdo social/anúncios** (posts estáticos, carrosséis, anúncios pagos). Por isso este sistema não inclui um "UI kit" de telas de software; em vez disso, oferece tokens, componentes reutilizáveis e uma galeria de templates de referência (ver `guidelines/templates-gallery.html`) para montar novas peças.

## Conteúdo fundamentals
- **Tom:** direto, confiante, um pouco provocador ("Seu concorrente já está anunciando agora enquanto você pensa"). Frases curtas, imperativas em CTAs ("Fale com a gente", "Saiba mais").
- **Pessoa:** fala com "você"/"sua marca" — nunca formal demais.
- **Números:** estatísticas grandes são o gancho principal de muitos posts (73%, 4.8x ROI, 11º maior mercado) — sempre com uma legenda curta explicando o dado.
- **Emoji:** não são usados.
- **Vibe:** economia de saúde/wellness + marketing de performance — dados concretos, urgência comercial, tom de "estamos por dentro do jogo".

## Visual foundations
- **Cores:** laranja `#F9A11B` é a cor primária (CTAs, eyebrows, acentos, numerais); preto `#3F3A39` é a cor de texto/fundo escuro; roxo `#683A95` e verde `#72C064` são acentos secundários usados pontualmente (tags, resultados positivos/ROI). Fundos neutros: `#EDEAE6` (canvas/moodboard) e `#F1F0ED` (anúncios, com grid de pontos). Máximo 1-2 cores de fundo por peça.
- **Tipografia:** Stinger (800/700/400) para todos os títulos e headlines — nunca no corpo. Basic Sans (400/700) para corpo, legendas e labels. Poppins ExtraBold (via Google Fonts) exclusivamente para números grandes de estatística (a versão trial da Stinger carimba um watermark nos números — por isso a troca). June Expt Variable é a fonte do logotipo, mas só existe embutida nas imagens do logo — não há arquivo de fonte para uso live.
- **Espaçamento:** grade generosa, praticamente sem padding pequeno — 80px de margem é o padrão de posts 1080×1350; barras/acentos ficam em 160-200px de largura, 6px de altura.
- **Fundos:** posts alternam fundo claro/escuro/gradiente para dar ritmo a carrosséis; anúncios usam fundo neutro com grid de pontos sutil. Fotografia é sempre full-bleed com overlay escuro (gradiente de baixo para cima) para garantir contraste do texto — nunca foto "solta" sem overlay.
- **Motivos gráficos:** seta dupla cortada no canto superior esquerdo, anéis concêntricos no canto inferior direito, grid de pontos sutil — os três aparecem juntos nos anúncios como assinatura visual (ver `BrandMotif`).
- **Formas:** CTAs sempre em pílula (`border-radius: 999px`); cards/tags e imagens usam raio pequeno (4px) ou nenhum; nunca cantos muito arredondados.
- **Sombras:** discretas — usadas só como "offset" sólido (ex.: `box-shadow: 0 4px 0 rgba(...)`), nunca blur suave estilo material design.
- **Animação/hover/press:** não há sistema definido nas peças estáticas produzidas; ao portar para telas interativas, seguir convenção simples: hover levemente mais escuro/opaco, press com leve encolhimento (scale 0.97).
- **Transparência:** usada em overlays de foto (gradiente preto 5%→95%) e em faixas de progresso desativadas de carrossel (`rgba(255,255,255,0.35)`).

## Iconografia
Não há sistema de ícones nem SVGs de terceiros nas peças de origem. A marca resolve iconografia com formas geométricas próprias (setas, anéis) e numerais grandes — ver `guidelines/iconography.html`. Não usar emoji.

## Intentional additions
- `BrandMotif`: os 3 motivos gráficos (seta, anéis, grid) apareciam hard-coded e repetidos nos 3 templates de anúncio — extraídos como componente para reuso.
- `StatCard`, `Badge`, `AccentDivider`, `Button`: nenhum código de produto/Figma foi fornecido; como o material de origem é só brand guidelines + peças estáticas, esses são os primitivos mínimos que essas peças reutilizam entre si (número+legenda, tag de categoria, barra de assinatura, CTA em pílula).

## Índice
- `styles.css` — importa todos os tokens (cores, tipografia, espaçamento, fontes)
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`
- `assets/` — logos (preto, branco, laranja, horizontal) + `moodboard/` (8 thumbnails de template)
- `fonts/` — Stinger (Heavy/Bold/Regular), Basic Sans (Regular/Bold)
- `guidelines/` — specimens de cor, tipografia, espaçamento, logo, motivos gráficos, iconografia, galeria de templates
- `components/` — `buttons/Button`, `badges/Badge`, `cards/StatCard`, `dividers/AccentDivider`, `motifs/BrandMotif`
- `SKILL.md` — versão exportável para Claude Code

## Caveats
- Fonte do logotipo (June Expt Variable) só existe como imagem — se precisar do logotipo em texto editável, peça o arquivo de fonte.
- Nenhuma tela de produto/software foi fornecida, então este sistema cobre identidade + templates de marketing, não uma UI kit de app/site.
