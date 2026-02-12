import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: '/dashboard',
        },
      });
    }
  },
  component: DashboardComponent,
});

function DashboardComponent() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>You're logged in successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a clean boilerplate with authentication built in.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Start building your application</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Add your custom features, routes, and components here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>Learn more about the stack</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>TanStack Router</li>
              <li>tRPC</li>
              <li>Better Auth</li>
              <li>Drizzle ORM</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
