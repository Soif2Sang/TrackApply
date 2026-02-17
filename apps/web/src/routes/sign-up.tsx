import SignUpForm from '@/components/auth/sign-up-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import z from 'zod';

export const Route = createFileRoute('/sign-up')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) =>
    z.object({
      token: z.string().optional(),
    }).parse(search),
})

function RouteComponent() {
  const navigate = useNavigate({
    from: "/sign-up",
  });
  const { token } = Route.useSearch();

  return (
    <SignUpForm
      onSwitchToSignIn={() =>
        navigate({
          to: "/sign-in",
        })
      }
      invitationToken={token}
    />
  );
}
