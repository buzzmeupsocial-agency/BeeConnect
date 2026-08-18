export interface KpiCardProps {
  /** @startingPoint section="Components" subtitle="Card de KPI — label, valor grande, legenda" viewport="700x160" */
  label: string;
  value: string;
  caption?: string;
  /** 'highlight' colore o valor em laranja (ex.: projeção). Default: 'default' */
  accent?: 'default' | 'highlight';
}
