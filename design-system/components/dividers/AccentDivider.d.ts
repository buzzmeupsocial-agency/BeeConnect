export interface AccentDividerProps {
  /** @startingPoint section="Components" subtitle="Barra de destaque usada como assinatura em rodapés e títulos" viewport="700x100" */
  color?: 'orange' | 'purple' | 'dark' | 'white';
  /** Largura em px. Default: 160 */
  width?: number;
  /** Fade para transparente (usado sob headlines). Default: false */
  gradient?: boolean;
}
