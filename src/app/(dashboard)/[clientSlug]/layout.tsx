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
      <h1 className="mb-4 text-2xl font-semibold">{client.name}</h1>
      <ClientTabs slug={client.slug} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
