export interface BarChartProps {
  /** @startingPoint section="Components" subtitle="Barras diárias — realizado sólido, projeção translúcida" viewport="700x220" */
  title?: string;
  values: number[];
  /** Índice a partir do qual as barras são projeção (renderizadas translúcidas). Omitir = tudo realizado. */
  projectedFrom?: number;
  /** Cor da série. Default: var(--bc-series-1) (laranja / Meta Ads) */
  color?: string;
  height?: number;
}
