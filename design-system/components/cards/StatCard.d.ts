export interface StatCardProps {
  /** @startingPoint section="Components" subtitle="Número grande + eyebrow + legenda" viewport="700x260" */
  eyebrow?: string;
  value: string;
  unit?: string;
  caption?: string;
  /** Cor de destaque. Default: 'orange' */
  accent?: 'orange' | 'purple' | 'green';
  /** Usar cores claras sobre fundo escuro. Default: false */
  inverted?: boolean;
}
