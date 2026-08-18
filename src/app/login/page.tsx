import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2">
            <Image src="/brand/logo-preto.png" alt="BuzzMeUp" width={28} height={28} className="size-7 object-contain" />
            <CardTitle className="font-display text-xl">BeeConnect</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Entre com seu email e senha
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTo ?? "/"} />
        </CardContent>
      </Card>
    </div>
  );
}
