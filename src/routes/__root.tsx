import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
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
      { title: "Guide Me Through — Sri Lankan A/L Study Companion" },
      { name: "description", content: "Guide Me Through helps Sri Lankan A/L students track marks paper-by-paper, plan revision, and learn with an AI tutor across Physical Science, Bio, Tech and Commerce streams." },
      { name: "keywords", content: "guide me through, guidemethrough, Sri Lanka A/L, Advanced Level, AL study app, AL tutor, AL progress tracker" },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: "Guide Me Through" },
      { property: "og:title", content: "Guide Me Through — Sri Lankan A/L Study Companion" },
      { name: "twitter:title", content: "Guide Me Through — Sri Lankan A/L Study Companion" },
      { property: "og:description", content: "Track your Sri Lankan A/L progress paper-by-paper and learn with an AI tutor. Built for A/L students." },
      { name: "twitter:description", content: "Track your Sri Lankan A/L progress paper-by-paper and learn with an AI tutor." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e51c1d35-68a3-4a62-b8bf-72c8bae2a310" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e51c1d35-68a3-4a62-b8bf-72c8bae2a310" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.guidemethrough.org/" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Guide Me Through",
          alternateName: "GuideMeThrough",
          url: "https://www.guidemethrough.org/",
          description: "Sri Lankan A/L study companion: track marks paper-by-paper and learn with an AI tutor.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/94768533739?text=Hi%2C%20I%20have%20a%20complaint%20about%20PaperPath%3A%20"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Complain via WhatsApp"
      title="Complain via WhatsApp: 076 853 3739"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/30 transition-transform hover:scale-105 hover:bg-primary/90"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.27c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM16.02 6.4c-5.31 0-9.62 4.31-9.62 9.62 0 1.69.44 3.34 1.28 4.79l-1.36 4.97 5.09-1.33c1.4.76 2.97 1.17 4.6 1.17h.01c5.31 0 9.62-4.31 9.62-9.62 0-2.57-1-4.99-2.82-6.8a9.56 9.56 0 0 0-6.8-2.8zm0 17.61h-.01a8 8 0 0 1-4.07-1.12l-.29-.17-3.02.79.81-2.94-.19-.3a7.99 7.99 0 0 1-1.23-4.25c0-4.41 3.59-8 8.01-8 2.14 0 4.15.83 5.66 2.35a7.95 7.95 0 0 1 2.35 5.66c0 4.41-3.59 7.99-8.02 7.99z"/>
      </svg>
    </a>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <WhatsAppFab />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
