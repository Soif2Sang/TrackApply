import { 
  Briefcase, 
  Zap, 
  Loader2, 
  Github, 
  ShieldCheck, 
  Bot, 
  LayoutDashboard, 
  ArrowRight,
  Lock,
  Sparkles,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignInPageProps {
  onSignIn: () => void;
  isLoading?: boolean;
}

export function SignInPage({ onSignIn, isLoading }: SignInPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/40 via-background to-transparent z-0" />

      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
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
            <Button variant="outline" size="sm" onClick={onSignIn} disabled={isLoading} className="shadow-sm">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center relative z-10">
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-24 pb-16 text-center md:pt-32 md:pb-24 flex flex-col items-center">
          <a 
            href="https://github.com/Soif2Sang/TrackApply"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8 shadow-sm backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            100% Open Source Job Tracker
            <ArrowRight className="h-3 w-3" />
          </a>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 text-balance leading-[1.1]">
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
              className="h-12 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
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
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm" asChild>
              <a href="https://github.com/Soif2Sang/TrackApply" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View Repository
              </a>
            </Button>
          </div>
        </section>

        {/* Dashboard Mockup/Preview */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent blur-3xl rounded-[3rem] -z-10" />
          <div className="rounded-2xl border border-border/60 bg-card/80 shadow-2xl overflow-hidden backdrop-blur-md relative group ring-1 ring-black/5 dark:ring-white/10">
            {/* Window Controls Mac-style */}
            <div className="h-12 border-b border-border/50 bg-muted/20 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm" />
            </div>
            
            {/* The Image */}
            <img 
              src="/showcase.png" 
              alt="TrackApply Dashboard Preview" 
              className="w-full h-auto object-cover opacity-90 transition-opacity group-hover:opacity-100 hidden dark:block"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-text')?.classList.remove('hidden');
              }}
            />
             <img 
              src="/showcase.png" 
              alt="TrackApply Dashboard Preview" 
              className="w-full h-auto object-cover opacity-95 transition-opacity group-hover:opacity-100 block dark:hidden"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            
            <div className="hidden fallback-text p-32 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
              <LayoutDashboard className="h-16 w-16 mb-4 opacity-20" />
              <p>Dashboard Preview</p>
            </div>
          </div>
        </section>

        {/* Bento Grid Section */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24">
          <div className="mb-16 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need,<br className="md:hidden" /> nothing you don't.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              We reimagined the job hunt so you can focus on interviewing, not data entry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 md:gap-6">
            
            {/* Bento 1: AI Magic (2 cols, 1 row) */}
            <div className="md:col-span-2 bg-card rounded-[2rem] border border-border/60 p-8 md:p-10 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow">
              <div className="relative z-10 max-w-md">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/20">
                  <Sparkles className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI-Powered Inbox</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our Google Gemini integration automatically scans incoming emails, identifying application updates, interview invites, and rejections.
                </p>
              </div>
              
              {/* Decorative AI Tags */}
              <div className="absolute right-0 bottom-0 w-full h-full pointer-events-none">
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
                
                <div className="absolute right-4 bottom-8 flex flex-col gap-3 opacity-80 group-hover:opacity-100 transition-all translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 duration-500 ease-out">
                  <div className="bg-background/90 backdrop-blur border border-border shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 transform group-hover:-rotate-2 transition-transform">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                    <span className="text-sm font-semibold">NEXT_STEP</span>
                  </div>
                  <div className="bg-background/90 backdrop-blur border border-border shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 -ml-8 transform group-hover:rotate-1 transition-transform">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    <span className="text-sm font-semibold">RECRUITMENT_ACK</span>
                  </div>
                  <div className="bg-background/90 backdrop-blur border border-border shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 -ml-4 transform group-hover:-rotate-1 transition-transform">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    <span className="text-sm font-semibold">DISAPPROVAL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Privacy (1 col, 1 row) */}
            <div className="md:col-span-1 bg-card rounded-[2rem] border border-border/60 p-8 md:p-10 flex flex-col overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-emerald-500/20">
                  <ShieldCheck className="text-emerald-500 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Zero Storage</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We use read-only Gmail access. Emails are processed on the fly and never stored on any server.
                </p>
              </div>
              <Lock className="absolute -bottom-8 -right-8 w-48 h-48 text-muted-foreground/5 group-hover:scale-110 group-hover:text-emerald-500/5 transition-all duration-700 ease-out -rotate-12" />
            </div>

            {/* Bento 3: Open Source (1 col, 1 row) */}
            <div className="md:col-span-1 bg-card rounded-[2rem] border border-border/60 p-8 md:p-10 flex flex-col overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-orange-500/20">
                  <Github className="text-orange-500 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">100% Free & Open</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Self-host or contribute. TrackApply is built in public for the community.
                </p>
              </div>
              
              {/* Fake code block */}
              <div className="absolute -bottom-6 -right-6 bg-muted/80 backdrop-blur-md border border-border/80 rounded-2xl p-5 rotate-12 group-hover:rotate-6 group-hover:-translate-y-2 group-hover:-translate-x-2 transition-all duration-500 font-mono text-xs text-muted-foreground opacity-80 shadow-lg">
                <span className="text-blue-400">git clone</span> url<br/>
                <span className="text-blue-400">npm</span> install<br/>
                <span className="text-blue-400">npm</span> run dev<br/>
                <span className="text-green-500">✓ Ready</span>
              </div>
            </div>

            {/* Bento 4: Centralized Dashboard (2 cols, 1 row) */}
            <div className="md:col-span-2 bg-card rounded-[2rem] border border-border/60 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative group shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1 relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-blue-500/20">
                  <LayoutDashboard className="text-blue-500 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Track & Manage</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  Say goodbye to messy spreadsheets. View your entire hiring pipeline in a clean, centralized dashboard.
                </p>
              </div>
              
              {/* Mini dashboard UI mockup */}
              <div className="w-full md:w-2/5 shrink-0 bg-background/50 border border-border/80 rounded-2xl shadow-sm p-4 flex flex-col gap-3 group-hover:-translate-y-2 group-hover:shadow-md transition-all duration-500 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-20 bg-muted-foreground/20 rounded-md"></div>
                  <div className="h-4 w-12 bg-muted-foreground/10 rounded-md"></div>
                </div>
                
                {[
                  { bg: "bg-blue-500/20", border: "border-blue-500/20" },
                  { bg: "bg-green-500/20", border: "border-green-500/20" },
                  { bg: "bg-primary/20", border: "border-primary/20" },
                ].map((style, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-xl border ${style.border} bg-background`}>
                    <div className={`w-8 h-8 rounded-full ${style.bg} shrink-0`}></div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-2 w-full bg-muted-foreground/20 rounded-full"></div>
                      <div className="h-2 w-2/3 bg-muted-foreground/10 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Background glow for dashboard */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            </div>

          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full relative py-24 text-center px-6 overflow-hidden">
          <div className="absolute inset-0 bg-muted/30 border-t border-border/50 -z-20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center mb-8 shadow-sm">
              <Inbox className="h-8 w-8 text-foreground" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-balance">
              Ready to automate your job search?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 text-balance max-w-xl">
              Join the open-source community taking control of their career journey with AI.
            </p>
            
            <Button
              onClick={onSignIn}
              disabled={isLoading}
              size="lg"
              className="h-14 px-10 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
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
            
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Read-only access</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 px-6 bg-background relative z-10">
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