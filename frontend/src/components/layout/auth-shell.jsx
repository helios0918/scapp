import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  centered = false,
}) {
  const Header = (
    <div className="space-y-3 text-center">
      <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-zinc-900">
        {title}
      </h1>

      {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
    </div>
  );

  if (centered) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md border border-zinc-200 bg-white">
          <CardContent className="space-y-8 p-8">
            {Header}
            {children}
            {footer ? (
              <div className="text-sm text-zinc-500">{footer}</div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border border-zinc-200 bg-white">
        <CardContent className="space-y-8 p-8">
          {Header}
          {children}
          {footer ? (
            <div className="text-sm text-zinc-500">{footer}</div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
