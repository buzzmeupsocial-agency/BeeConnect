export interface ButtonProps {
  /** @startingPoint section="Components" subtitle="Pílula de CTA — primary, dark, outline" viewport="700x140" */
  children: React.ReactNode;
  /** Estilo visual. Default: 'primary' */
  variant?: 'primary' | 'dark' | 'outline';
  /** Tamanho. Default: 'md' */
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}
