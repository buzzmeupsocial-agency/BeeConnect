// Campanhas de "Orgânico" são identificadas pelo nome (convenção do cliente:
// tag "[Traf] [Audiência]"), não por um objective/resultType da API — Meta e
// Google não têm uma terceira categoria nativa para isso, é uma
// classificação própria do negócio.
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip accents (Audiência -> audiencia)
}

export function isOrganicCampaign(name: string): boolean {
  const n = normalize(name);
  return n.includes("[traf]") && n.includes("audi");
}
