"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAllClients, syncClient } from "@/lib/sync/run-sync";

export async function createOrUpdateClient(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const metaAdAccountId = String(formData.get("metaAdAccountId") ?? "").trim() || null;
  const googleAdsCustomerId =
    String(formData.get("googleAdsCustomerId") ?? "").trim() || null;

  if (!slug || !name) throw new Error("Slug e nome são obrigatórios");

  if (id) {
    await prisma.client.update({
      where: { id },
      data: { slug, name, metaAdAccountId, googleAdsCustomerId },
    });
  } else {
    await prisma.client.create({
      data: { slug, name, metaAdAccountId, googleAdsCustomerId },
    });
  }

  revalidatePath("/admin/clientes");
}

export async function inviteUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) throw new Error("Email é obrigatório");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/usuarios");
}

export async function setUserAdmin(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const isAdmin = formData.get("isAdmin") === "true";

  await prisma.profile.update({ where: { id: userId }, data: { isAdmin } });
  revalidatePath("/admin/usuarios");
}

export async function toggleClientAccess(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const clientId = String(formData.get("clientId"));
  const grant = formData.get("grant") === "true";

  if (grant) {
    await prisma.userClientAccess.upsert({
      where: { userId_clientId: { userId, clientId } },
      update: {},
      create: { userId, clientId },
    });
  } else {
    await prisma.userClientAccess
      .delete({ where: { userId_clientId: { userId, clientId } } })
      .catch(() => {});
  }

  revalidatePath("/admin/usuarios");
}

export async function triggerSyncAll() {
  await requireAdmin();
  await syncAllClients();
  revalidatePath("/admin/sync");
}

export async function triggerSyncClient(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId"));
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  await syncClient(client);
  revalidatePath("/admin/sync");
}
