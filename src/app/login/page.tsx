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
    <div
      className="flex min-h-svh items-center justify-center p-4"
      style={{
        backgroundColor: "var(--color-secondary)",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(63,58,57,0.08) 1px, transparent 0)",
        backgroundSize: "14px 14px",
      }}
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2">
            <Image src="/brand/logo-preto.png" alt="BuzzMeUp" width={28} height={28} className="size-7 object-contain" />
            <CardTitle className="font-display text-xl">BeeConnect</CardTitle>
          </div>
          <span className="mb-1 block h-[3px] w-10 bg-primary" />
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
