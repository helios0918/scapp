import React from "react";

export function AppShell({ subtitle, actions, children }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-10 pt-6 md:px-8">
      <header className="glass-surface mb-6 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              SCAPP.
            </h1>
            {subtitle ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      {children}
    </main>
  );
}
