import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Client } from "@/generated/prisma/client";

// Resolves the logged-in Supabase user to our Profile row. Redirects to
// /login if there's no session or the profile row hasn't been created yet
// (should be instant via the auth.users trigger, but guards against races).
export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect("/login");

  return profile;
}

// Clients the current user is allowed to see: all of them if admin,
// otherwise only the ones granted via UserClientAccess.
export async function getAccessibleClients(): Promise<Client[]> {
  const profile = await getCurrentProfile();

  if (profile.isAdmin) {
    return prisma.client.findMany({ orderBy: { name: "asc" } });
  }

  const access = await prisma.userClientAccess.findMany({
    where: { userId: profile.id },
    include: { client: true },
    orderBy: { client: { name: "asc" } },
  });

  return access.map((a) => a.client);
}

// Guards every /[clientSlug]/* page. 404s on an unknown slug, bounces
// non-admins without explicit access back to the client picker.
export async function requireClientAccess(
  slug: string,
): Promise<{ profile: Profile; client: Client }> {
  const profile = await getCurrentProfile();

  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) notFound();

  if (profile.isAdmin) return { profile, client };

  const access = await prisma.userClientAccess.findUnique({
    where: { userId_clientId: { userId: profile.id, clientId: client.id } },
  });
  if (!access) redirect("/");

  return { profile, client };
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile.isAdmin) redirect("/");
  return profile;
}
