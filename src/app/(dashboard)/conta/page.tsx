import { getCurrentProfile } from "@/lib/access-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";

export default async function ContaPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Minha conta</h1>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Trocar senha</CardTitle>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
