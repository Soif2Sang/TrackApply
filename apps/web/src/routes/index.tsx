import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Database, Lock, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Full-Stack TypeScript Boilerplate
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            A modern, production-ready stack with authentication, database, and API built in.
            Start building your next project in minutes, not days.
          </p>
          <div className="flex gap-4">
            <Link to="/sign-up">
              <Button size="lg">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Better Auth with email/password and password reset built-in
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Database Ready</h3>
              <p className="text-sm text-muted-foreground">
                PostgreSQL with Drizzle ORM and migrations configured
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Type-Safe API</h3>
              <p className="text-sm text-muted-foreground">
                Full-stack type safety with tRPC and TanStack Query
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Modern Stack</h3>
              <p className="text-sm text-muted-foreground">
                React, TanStack Router, Tailwind CSS, and shadcn/ui
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="container mx-auto px-4 py-16 bg-muted/50">
          <h2 className="text-3xl font-bold text-center mb-12">Built With</h2>
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="text-center">
              <div className="font-semibold">Frontend</div>
              <div className="text-sm">React • Vite • TanStack Router</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Backend</div>
              <div className="text-sm">Hono • tRPC • Better Auth</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Database</div>
              <div className="text-sm">PostgreSQL • Drizzle ORM</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Styling</div>
              <div className="text-sm">Tailwind CSS • shadcn/ui</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
