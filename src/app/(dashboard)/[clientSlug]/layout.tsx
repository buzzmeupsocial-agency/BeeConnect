import { requireClientAccess } from "@/lib/access-control";
import { ClientTabs } from "@/components/dashboard/client-tabs";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const { client } = await requireClientAccess(clientSlug);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{client.name}</h1>
      <span className="mb-4 mt-2 block h-[3px] w-12 bg-primary" />
      <ClientTabs slug={client.slug} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
