// Projeção por "ritmo dos últimos 7 dias": média diária dos últimos 7 dias
// com dado, extrapolada pelos dias restantes do período e somada ao que já
// foi realizado.
export function projectPace(
  dailyValues: number[],
  daysRemaining: number,
): { realized: number; projected: number; dailyPace: number } {
  const realized = dailyValues.reduce((a, b) => a + b, 0);
  const window = dailyValues.slice(-7);
  const dailyPace = window.length
    ? window.reduce((a, b) => a + b, 0) / window.length
    : 0;
  const projected = realized + dailyPace * Math.max(0, daysRemaining);
  return { realized, projected, dailyPace };
}
