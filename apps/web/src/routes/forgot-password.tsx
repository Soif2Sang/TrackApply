import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ForgotPasswordForm
      onSuccess={() => {
        // Optional: Show a success notification or redirect
      }}
    />
  );
}
