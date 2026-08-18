export interface TabBarProps {
  /** @startingPoint section="Components" subtitle="Navegação por abas em pílula — aba ativa em preto sólido" viewport="700x100" */
  tabs: string[];
  active: string;
  onChange?: (tab: string) => void;
}
