import { 
  Briefcase, 
  Zap, 
  Loader2, 
  Github, 
  ShieldCheck, 
  Mail, 
  Bot, 
  LayoutDashboard, 
  ArrowRight,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignInPageProps {
  onSignIn: () => void;
  isLoading?: boolean;
}

export function SignInPage({ onSignIn, isLoading }: SignInPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">TrackApply</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/Soif2Sang/TrackApply" 
              target="_blank" 
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-2 text-sm font-medium"
            >
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
            <Button variant="outline" size="sm" onClick={onSignIn} disabled={isLoading}>
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-24 pb-16 text-center md:pt-32 md:pb-24 flex flex-col items-center">
          <a 
            href="https://github.com/Soif2Sang/TrackApply"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            100% Open Source Job Tracker
            <ArrowRight className="h-3 w-3" />
          </a>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mb-6 text-balance leading-tight">
            Automate your job search. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Zero manual entry.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 text-balance leading-relaxed">
            Connect your Gmail. Our AI automatically extracts application statuses, interview invites, and rejections. 
            Keep your job hunt perfectly organized without lifting a finger.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              onClick={onSignIn}
              disabled={isLoading}
              size="lg"
              className="h-12 px-8 text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Get Started with Google
                </>
              )}
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <a href="https://github.com/Soif2Sang/TrackApply" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View Repository
              </a>
            </Button>
          </div>
        </section>

        {/* Dashboard Mockup/Preview */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-20">
          <div className="rounded-2xl border border-border/50 bg-card/50 shadow-2xl overflow-hidden backdrop-blur-sm relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10 md:hidden pointer-events-none" />
            
            {/* Window Controls Mac-style */}
            <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            
            {/* The Image */}
            <img 
              src="/showcase.png" 
              alt="TrackApply Dashboard Preview" 
              className="w-full h-auto object-cover opacity-90 transition-opacity group-hover:opacity-100 hidden dark:block"
              onError={(e) => {
                // Fallback text if showcase.png isn't available at root
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-text')?.classList.remove('hidden');
              }}
            />
             <img 
              src="/showcase.png" 
              alt="TrackApply Dashboard Preview" 
              className="w-full h-auto object-cover opacity-90 transition-opacity group-hover:opacity-100 block dark:hidden invert-[.85] hue-rotate-180"
              onError={(e) => {
                // Fallback text if showcase.png isn't available at root
                e.currentTarget.style.display = 'none';
              }}
            />
            
            <div className="hidden fallback-text p-24 text-center text-muted-foreground flex flex-col items-center justify-center">
              <LayoutDashboard className="h-16 w-16 mb-4 opacity-20" />
              <p>Dashboard Preview</p>
            </div>
          </div>
        </section>

        {/* Trust & Privacy Banner */}
        <section className="w-full border-y border-border/50 bg-muted/20 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  We use read-only access. Your emails are processed on-the-fly and are never stored on any server.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Github className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">100% Open Source</h3>
                <p className="text-sm text-muted-foreground">
                  Host it yourself or verify our code. TrackApply is built in public with transparency in mind.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Secure OAuth</h3>
                <p className="text-sm text-muted-foreground">
                  Login securely through Google. We don't see or store your passwords. Revoke access anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How TrackApply works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop maintaining messy spreadsheets. Let AI analyze your inbox and organize your job hunt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-border via-border to-border border-dashed border-b-2 z-0" />
            
            <div className="relative z-10 flex flex-col items-center text-center bg-background">
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Mail className="h-7 w-7 text-foreground" />
              </div>
              <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full absolute top-12 -right-2 border-2 border-background">1</div>
              <h3 className="text-xl font-semibold mb-3">Connect Gmail</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Securely link your Google account. We scan your inbox for job-related emails using a background worker.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center bg-background">
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Bot className="h-7 w-7 text-foreground" />
              </div>
              <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full absolute top-12 -right-2 border-2 border-background">2</div>
              <h3 className="text-xl font-semibold mb-3">AI Classification</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Google Gemini analyzes the emails, identifying applications, interview invites (NEXT_STEP), and rejections.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center bg-background">
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <LayoutDashboard className="h-7 w-7 text-foreground" />
              </div>
              <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full absolute top-12 -right-2 border-2 border-background">3</div>
              <h3 className="text-xl font-semibold mb-3">Track & Manage</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                View your entire hiring pipeline in a clean dashboard. See timelines, add manual notes, and track progress.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full bg-muted/30 border-t border-border/50 py-24 text-center px-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Ready to automate your job search?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 text-balance">
              Join the open-source community taking control of their career journey with AI.
            </p>
            
            <Button
              onClick={onSignIn}
              disabled={isLoading}
              size="lg"
              className="h-14 px-10 text-lg shadow-xl shadow-primary/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Get Started with Google
                </>
              )}
            </Button>
            
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              <span>No credit card required. Read-only access.</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="font-semibold text-foreground">TrackApply</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="https://github.com/Soif2Sang/TrackApply" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github className="h-4 w-4" />
              Source Code
            </a>
            <span className="hidden sm:inline-block text-border">|</span>
            <span>Built with ❤️ for the community</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
