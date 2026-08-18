// Uso: npx tsx prisma/make-admin.ts email@exemplo.com
// Promove um usuário (que já fez login pelo menos uma vez, criando seu
// Profile via trigger) a admin — admin vê todos os clientes sem precisar
// de linhas em UserClientAccess.
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const email = process.argv[2];
if (!email) {
  console.error("Uso: npx tsx prisma/make-admin.ts email@exemplo.com");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const profile = await prisma.profile.findFirst({ where: { email } });
  if (!profile) {
    console.error(
      `Nenhum profile encontrado para ${email}. A pessoa precisa fazer login pelo menos uma vez antes (o trigger cria o profile no primeiro signup).`,
    );
    process.exit(1);
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { isAdmin: true },
  });

  console.log(`${email} agora é admin.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
