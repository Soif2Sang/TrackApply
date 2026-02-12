import SignInForm from "@/components/auth/sign-in-form";
import SignUpForm from "@/components/auth/sign-up-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({
    from: "/sign-in",
  });

  return (
    <SignInForm
      onSwitchToSignUp={() =>
        navigate({
          to: "/sign-up",
        })
      }
    />
  );
}
