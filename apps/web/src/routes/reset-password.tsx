import ResetPasswordForm from "@/components/auth/reset-password-form";
import { createFileRoute } from '@tanstack/react-router';
import z from "zod";

export const Route = createFileRoute("/reset-password")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return z.object({
      token: z.string().optional(),
    }).parse(search);
  }
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return <ResetPasswordForm token={token} />;
}
