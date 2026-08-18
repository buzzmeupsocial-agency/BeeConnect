// Projeção pelo "ritmo do período": média diária de TODO o período já
// realizado (montante acumulado / dias decorridos), extrapolada pelos dias
// restantes e somada ao que já foi realizado. Ex.: R$18.000 em 18 dias =
// R$1.000/dia; com 12 dias restantes, projeta R$18.000 + R$12.000 = R$30.000.
export function projectPace(
  dailyValues: number[],
  daysRemaining: number,
): { realized: number; projected: number; dailyPace: number } {
  const realized = dailyValues.reduce((a, b) => a + b, 0);
  const dailyPace = dailyValues.length ? realized / dailyValues.length : 0;
  const projected = realized + dailyPace * Math.max(0, daysRemaining);
  return { realized, projected, dailyPace };
}
