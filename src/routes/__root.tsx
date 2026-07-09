import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { closeNativeAuthBrowser, completeNativeOAuthFromUrl, isBrHeroNativeApp } from "../lib/native-auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BRHero — O 1º RPG IDLE Brasileiro" },
      { name: "description", content: "BRHero - RPG mobile idle brasileiro. Batalhas automáticas, evolução constante e chefões épicos. Entre com Google e jogue no navegador ou baixe no Google Play." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "BRHero — O 1º RPG IDLE Brasileiro" },
      { property: "og:description", content: "BRHero - RPG mobile idle brasileiro. Batalhas automáticas, evolução constante e chefões épicos. Entre com Google e jogue no navegador ou baixe no Google Play." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "BRHero — O 1º RPG IDLE Brasileiro" },
      { name: "twitter:description", content: "BRHero - RPG mobile idle brasileiro. Batalhas automáticas, evolução constante e chefões épicos. Entre com Google e jogue no navegador ou baixe no Google Play." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/beb35632-c65b-4a0e-bdfb-f779127686f1/id-preview-213b3cfc--23a59135-60ed-4cd8-9a32-fe35291633ee.lovable.app-1783531589300.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/beb35632-c65b-4a0e-bdfb-f779127686f1/id-preview-213b3cfc--23a59135-60ed-4cd8-9a32-fe35291633ee.lovable.app-1783531589300.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lilita+One&family=Fredoka:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (!isBrHeroNativeApp()) return;

    let cancelled = false;

    const finishNativeLogin = async (url: string) => {
      try {
        const handled = await completeNativeOAuthFromUrl(url);
        if (!handled || cancelled) return;
        await closeNativeAuthBrowser();
        window.location.replace("/game");
      } catch (error) {
        console.error(error);
      }
    };

    void finishNativeLogin(window.location.href);

    let removeListener: (() => void) | undefined;
    void import("@capacitor/app").then(async ({ App }) => {
      const launch = await App.getLaunchUrl();
      if (launch?.url) void finishNativeLogin(launch.url);
      const handle = await App.addListener("appUrlOpen", (event) => {
        void finishNativeLogin(event.url);
      });
      removeListener = () => { void handle.remove(); };
    }).catch(() => {
      // APKs antigos podem ainda não ter o plugin App registrado.
    });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
