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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 relative overflow-hidden">
      
      {/* Animated Colorful Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top Right Blob */}
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-[120px] mix-blend-normal dark:mix-blend-screen animate-in fade-in duration-1000" />
        {/* Center Left Blob */}
        <div className="absolute top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-blue-500/20 via-cyan-400/10 to-transparent blur-[120px] mix-blend-normal dark:mix-blend-screen animate-in fade-in duration-1000 delay-300" />
        {/* Bottom Center Blob */}
        <div className="absolute top-[60%] left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-t from-fuchsia-500/15 via-rose-400/10 to-transparent blur-[150px] mix-blend-normal dark:mix-blend-screen animate-in fade-in duration-1000 delay-500" />
      </div>

      {/* Grid Pattern Overlay for Texture */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
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
            <Button variant="outline" size="sm" onClick={onSignIn} disabled={isLoading} className="shadow-sm hover:border-indigo-500/30 transition-colors">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center relative z-10">
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-24 pb-16 text-center md:pt-32 md:pb-24 flex flex-col items-center relative">
          
          <a 
            href="https://github.com/Soif2Sang/TrackApply"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/50 border border-indigo-500/20 text-sm font-medium text-foreground hover:bg-indigo-500/5 transition-colors mb-8 shadow-sm backdrop-blur-md relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse z-10"></span>
            <span className="z-10">100% Open Source Job Tracker</span>
            <ArrowRight className="h-3 w-3 z-10" />
          </a>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 text-balance leading-[1.1]">
            Automate your job search. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 drop-shadow-sm">
              Zero manual entry.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 text-balance leading-relaxed font-medium">
            Connect your Gmail. Our AI automatically extracts application statuses, interview invites, and rejections. 
            Keep your job hunt perfectly organized without lifting a finger.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              onClick={onSignIn}
              disabled={isLoading}
              size="lg"
              className="h-12 px-8 text-base shadow-xl shadow-indigo-500/20 bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-[1.02] border border-transparent"
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
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-md border-border/60 hover:bg-muted/50 hover:border-indigo-500/30 transition-all shadow-sm" asChild>
              <a href="https://github.com/Soif2Sang/TrackApply" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-5 w-5" />
                View Repository
              </a>
            </Button>
          </div>
        </section>

        {/* Dashboard Mockup/Preview */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl rounded-[3rem] -z-10" />
          <div className="rounded-2xl border border-white/10 bg-card/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden backdrop-blur-xl relative group ring-1 ring-black/5 dark:ring-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:shadow-[0_16px_48px_rgba(99,102,241,0.15)]">
            
            {/* Window Controls Mac-style */}
            <div className="h-12 border-b border-white/10 bg-muted/30 flex items-center px-4 gap-2 backdrop-blur-md">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm" />
            </div>
            
            {/* The Image */}
            <img 
              src="/showcase.png" 
              alt="TrackApply Dashboard Preview" 
              className="w-full h-auto object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100 hidden dark:block"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-text')?.classList.remove('hidden');
              }}
            />
             <img 
              src="/showcase.png" 
              alt="TrackApply Dashboard Preview" 
              className="w-full h-auto object-cover opacity-95 transition-opacity duration-500 group-hover:opacity-100 block dark:hidden shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
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
        <section className="w-full max-w-6xl mx-auto px-6 py-24 relative z-10">
          <div className="mb-16 text-center md:text-left relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need,<br className="md:hidden" /> nothing you don't.</h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl font-medium">
              We reimagined the job hunt so you can focus on interviewing, not data entry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 md:gap-6">
            
            {/* Bento 1: AI Magic (2 cols, 1 row) */}
            <div className="md:col-span-2 bg-card/60 backdrop-blur-md rounded-[2rem] border border-white/10 p-8 md:p-10 flex flex-col justify-between overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-purple-500/30 transition-all duration-500 dark:bg-card/40">
              <div className="relative z-10 max-w-md">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-purple-500/30 shadow-inner">
                  <Sparkles className="text-purple-500 w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">AI-Powered Inbox</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Our Google Gemini integration automatically scans incoming emails, identifying application updates, interview invites, and rejections.
                </p>
              </div>
              
              {/* Decorative AI Tags */}
              <div className="absolute right-0 bottom-0 w-full h-full pointer-events-none">
                <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-colors duration-700" />
                
                <div className="absolute right-6 bottom-10 flex flex-col gap-3 opacity-80 group-hover:opacity-100 transition-all translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 duration-500 ease-out">
                  <div className="bg-background/90 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)] rounded-xl px-5 py-3 flex items-center gap-3 transform group-hover:-rotate-3 transition-transform duration-500">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse"></span>
                    <span className="text-sm font-bold tracking-wide">NEXT_STEP</span>
                  </div>
                  <div className="bg-background/90 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)] rounded-xl px-5 py-3 flex items-center gap-3 -ml-8 transform group-hover:rotate-2 transition-transform duration-500 delay-75">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
                    <span className="text-sm font-bold tracking-wide">RECRUITMENT_ACK</span>
                  </div>
                  <div className="bg-background/90 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.1)] rounded-xl px-5 py-3 flex items-center gap-3 -ml-4 transform group-hover:-rotate-1 transition-transform duration-500 delay-150">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]"></span>
                    <span className="text-sm font-bold tracking-wide">DISAPPROVAL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Privacy (1 col, 1 row) */}
            <div className="md:col-span-1 bg-card/60 backdrop-blur-md rounded-[2rem] border border-white/10 p-8 md:p-10 flex flex-col overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-500 dark:bg-card/40">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-colors duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-emerald-500/30 shadow-inner">
                  <ShieldCheck className="text-emerald-500 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Zero Storage</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  We use read-only Gmail access. Emails are processed on the fly and never stored on any server.
                </p>
              </div>
              <Lock className="absolute -bottom-10 -right-10 w-56 h-56 text-foreground/[0.03] group-hover:scale-110 group-hover:text-emerald-500/10 transition-all duration-700 ease-out -rotate-12 pointer-events-none" />
            </div>

            {/* Bento 3: Open Source (1 col, 1 row) */}
            <div className="md:col-span-1 bg-card/60 backdrop-blur-md rounded-[2rem] border border-white/10 p-8 md:p-10 flex flex-col overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-orange-500/30 transition-all duration-500 dark:bg-card/40">
              <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[60px] group-hover:bg-orange-500/10 transition-colors duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-orange-500/30 shadow-inner">
                  <Github className="text-orange-500 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">100% Open</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Self-host or contribute. TrackApply is built in public for the community.
                </p>
              </div>
              
              {/* Fake code block */}
              <div className="absolute -bottom-6 -right-6 bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 rotate-12 group-hover:rotate-6 group-hover:-translate-y-3 group-hover:-translate-x-3 transition-all duration-500 font-mono text-sm text-muted-foreground opacity-90 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="flex gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-blue-500 font-medium">git clone</span> url<br/>
                <span className="text-blue-500 font-medium">npm</span> install<br/>
                <span className="text-blue-500 font-medium">npm</span> run dev<br/>
                <span className="text-emerald-500 font-bold mt-2 inline-block">✓ Ready</span>
              </div>
            </div>

            {/* Bento 4: Centralized Dashboard (2 cols, 1 row) */}
            <div className="md:col-span-2 bg-card/60 backdrop-blur-md rounded-[2rem] border border-white/10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-500 dark:bg-card/40">
              <div className="flex-1 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-blue-500/30 shadow-inner">
                  <LayoutDashboard className="text-blue-500 w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">Track & Manage</h3>
                <p className="text-muted-foreground leading-relaxed text-lg max-w-sm">
                  Say goodbye to messy spreadsheets. View your entire hiring pipeline in a clean, centralized dashboard.
                </p>
              </div>
              
              {/* Mini dashboard UI mockup */}
              <div className="w-full md:w-2/5 shrink-0 bg-background/80 backdrop-blur border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-5 flex flex-col gap-4 group-hover:-translate-y-3 group-hover:shadow-[0_16px_48px_rgba(59,130,246,0.15)] transition-all duration-500 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-5 w-24 bg-foreground/10 rounded-md"></div>
                  <div className="h-5 w-16 bg-foreground/5 rounded-md"></div>
                </div>
                
                {[
                  { bg: "bg-blue-500", border: "border-blue-500/20", glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]" },
                  { bg: "bg-emerald-500", border: "border-emerald-500/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]" },
                  { bg: "bg-purple-500", border: "border-purple-500/20", glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]" },
                ].map((style, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${style.border} bg-background/50 hover:bg-background transition-colors`}>
                    <div className={`w-10 h-10 rounded-full ${style.bg} ${style.glow} shrink-0 bg-opacity-20 flex items-center justify-center`}>
                      <div className={`w-4 h-4 rounded-full ${style.bg} opacity-80`}></div>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-2.5 w-full bg-foreground/10 rounded-full"></div>
                      <div className="h-2 w-2/3 bg-foreground/5 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Background glow for dashboard */}
              <div className="absolute left-[70%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700" />
            </div>

          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full relative py-32 text-center px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 -z-20 border-t border-white/5" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-t from-indigo-500/10 via-purple-500/5 to-transparent blur-[100px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <Inbox className="h-10 w-10 text-indigo-500 dark:text-indigo-400 relative z-10" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-balance leading-tight">
              Ready to automate your <br className="hidden md:block"/> job search?
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl mb-10 text-balance max-w-xl font-medium">
              Join the open-source community taking control of their career journey with AI.
            </p>
            
            <Button
              onClick={onSignIn}
              disabled={isLoading}
              size="lg"
              className="h-14 px-10 text-lg shadow-[0_8px_32px_rgba(99,102,241,0.3)] bg-foreground text-background hover:bg-foreground/90 transition-all hover:scale-[1.03] border border-transparent"
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
            
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Read-only access</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 px-6 bg-background/50 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-500" />
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
