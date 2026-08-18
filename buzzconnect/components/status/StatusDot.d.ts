export interface StatusDotProps {
  /** @startingPoint section="Components" subtitle="Indicador de status com ponto colorido" viewport="700x140" */
  status: 'positive' | 'warning' | 'negative';
  /** Texto customizado; se omitido usa o label padrão do status. */
  label?: string;
}
