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
        title: "TrackApply - Job Tracking",
      },
      {
        name: "description",
        content: "TrackApply - Job Tracking",
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
    select: (s) =>
      s.isLoading &&
      s.location.pathname !==
        (s.resolvedLocation?.pathname ?? s.location.pathname),
  });


  return (
    <>
      <HeadContent />
        <div className="grid grid-rows-[auto_1fr] bg-background">
          {isFetching ? <Loader /> : <Outlet />}
        </div>
        <Toaster />
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
