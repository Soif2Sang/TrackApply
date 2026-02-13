import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { authClient } from "@/lib/auth-client";

import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";
import Loader from "@/components/loader";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
  auth: typeof authClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Full-Stack TypeScript Boilerplate",
      },
      {
        name: "description",
        content: "A modern full-stack boilerplate with React, tRPC, Better Auth, and Drizzle ORM",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });


  return (
    <>
      <HeadContent />
        <div className="grid grid-rows-[auto_1fr] h-svh bg-background">
          {isFetching ? <Loader /> : <Outlet />}
        </div>
        <Toaster richColors />
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
