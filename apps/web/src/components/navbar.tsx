import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ModeToggle } from "./mode-toggle";
import { authClient } from "@/lib/auth-client";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

const Navbar1 = () => {
  const { data: session } = authClient.useSession();
  const location = useLocation();
  const navigate = useNavigate();

  // Reset all underlines when location changes
  useEffect(() => {
    const allUnderlines = document.querySelectorAll('.nav-underline');
    allUnderlines.forEach((underline) => {
      const link = underline.closest('a') as HTMLAnchorElement;
      if (link) {
        const isCurrentlyActive = link.getAttribute('href') === location.pathname || 
                                  (link.getAttribute('href') === '/' && location.pathname === '/');
        (underline as HTMLElement).style.width = isCurrentlyActive ? '100%' : '0%';
      }
    });
  }, [location.pathname]);

  const links = [
    { title: "Home", url: "/" },
    ...(session
      ? [
          {
            title: "Dashboard",
            url: `/dashboard`,
          },
        ]
      : []),
  ];

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      navigate({ to: "/sign-in" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname === item.url;

    return (
      <NavigationMenuItem key={item.title}>
        <Link
          to={item.url}
          className={`inline-flex h-10 w-max items-center justify-center rounded-lg bg-background/50 px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/5 hover:text-primary hover:scale-105 hover:shadow-sm border border-transparent hover:border-primary/10 ${
            isActive ? 'text-primary bg-primary/10 border-primary/20' : ''
          }`}
          activeOptions={{ exact: true }}
          onMouseEnter={(e) => {
            const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
            if (underline && !isActive) {
              underline.style.width = '100%';
            }
          }}
          onMouseLeave={(e) => {
            const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
            if (underline && !isActive) {
              underline.style.width = '0%';
            }
          }}
        >
          <span className="relative">
            {item.title}
            <span 
              className="nav-underline absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-200"
              style={{
                width: isActive ? '100%' : '0%'
              }}
            ></span>
          </span>
        </Link>
      </NavigationMenuItem>
    );
  };

  const renderMobileMenuItem = (item: MenuItem) => {
    return (
      <Link
        key={item.title}
        to={item.url}
        className="[&.active]:text-primary [&.active]:bg-primary/10 text-md font-semibold p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-primary/10"
        activeOptions={{ exact: true }}
      >
        {item.title}
      </Link>
    );
  };

  return (
    <header className="p-4 bg-background/80 sticky top-0 z-50 flex min-h-(--header-height) w-full flex-shrink-0 items-center justify-center border-b border-border/50 backdrop-blur-xl shadow-sm transition-all duration-300">
      {/* Desktop Menu */}
      <nav className="hidden justify-between lg:flex w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg group-hover:scale-110 transition-all duration-300">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                Boilerplate
              </span>
              <span className="text-xs text-muted-foreground font-medium transition-all duration-300 -mt-1">
                Full-Stack Starter
              </span>
            </div>
          </Link>
          
          {/* Navigation */}
          <div className="flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {links.map((item) => renderMenuItem(item))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          <ModeToggle />
          {session && (
            <div className="flex items-center gap-3">
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                Sign Out
              </Button>
            </div>
          )}
          {!session && (
            <div className="flex items-center gap-2">
              <Link to="/sign-in">
                <Button 
                  variant="ghost" 
                  className="hover:scale-105 transition-all duration-200"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-105 transition-all duration-200 hover:shadow-lg group"
                >
                  <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className="block lg:hidden w-full">
        <div className="flex items-center justify-between">
          {/* Mobile Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            activeOptions={{ exact: true }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg group-hover:scale-110 transition-all duration-300">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Boilerplate
            </span>
          </Link>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="hover:scale-105 transition-all duration-200 hover:shadow-sm border-border/50"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
              <SheetHeader className="pb-6">
                <SheetTitle>
                  <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg group-hover:scale-110 transition-all duration-300">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        Boilerplate
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Full-Stack Starter
                      </span>
                    </div>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 p-4">
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col gap-4"
                >
                  {links.map((item) => renderMobileMenuItem(item))}
                </Accordion>

                <div className="flex flex-col gap-3 pt-6 border-t border-border/50">
                  {session && (
                    <div className="flex flex-col gap-3">
                      <Button 
                        variant="destructive" 
                        onClick={handleSignOut}
                        className="w-full hover:scale-[1.02] transition-all duration-200"
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                  {!session && (
                    <div className="flex flex-col gap-3">
                      <Link to="/sign-in" className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full hover:scale-[1.02] transition-all duration-200"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/sign-up" className="w-full">
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-[1.02] transition-all duration-200 group"
                        >
                          <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                  <div className="flex justify-center pt-2">
                    <ModeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export { Navbar1 };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      navigate({ to: "/sign-in" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.items) {
      return (
        <NavigationMenuItem key={item.title}>
          <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
          <NavigationMenuContent className="bg-popover text-popover-foreground">
            {item.items.map((subItem) => (
              <NavigationMenuLink asChild key={subItem.title} className="w-80">
                <SubMenuLink item={subItem} />
              </NavigationMenuLink>
            ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }

    const isActive = location.pathname === item.url;

    return (
      <NavigationMenuItem key={item.title}>
        <Link
          to={item.url}
          className={`inline-flex h-10 w-max items-center justify-center rounded-lg bg-background/50 px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/5 hover:text-primary hover:scale-105 hover:shadow-sm border border-transparent hover:border-primary/10 ${
            isActive ? 'text-primary bg-primary/10 border-primary/20' : ''
          }`}
          activeOptions={{ exact: true }}
          onMouseEnter={(e) => {
            const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
            if (underline && !isActive) {
              underline.style.width = '100%';
            }
          }}
          onMouseLeave={(e) => {
            const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
            if (underline && !isActive) {
              underline.style.width = '0%';
            }
          }}
        >
          <span className="relative">
            {item.title}
            <span 
              className="nav-underline absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-200"
              style={{
                width: isActive ? '100%' : '0%'
              }}
            ></span>
          </span>
        </Link>
      </NavigationMenuItem>
    );
  };

  const renderMobileMenuItem = (item: MenuItem) => {
    if (item.items) {
      return (
        <AccordionItem
          key={item.title}
          value={item.title}
          className="border-b-0"
        >
          <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="mt-2">
            {item.items.map((subItem) => (
              <SubMenuLink key={subItem.title} item={subItem} />
            ))}
          </AccordionContent>
        </AccordionItem>
      );
    }

    return (
      <Link
        key={item.title}
        to={item.url}
        className="[&.active]:text-primary [&.active]:bg-primary/10 text-md font-semibold p-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-primary/10"
        activeOptions={{ exact: true }}
      >
        {item.title}
      </Link>
    );
  };

  const SubMenuLink = ({ item }: { item: MenuItem }) => {
    return (
      <Link
        className="[&.active]:text-primary [&.active]:bg-primary/10 flex flex-row gap-4 rounded-lg p-4 leading-none no-underline transition-all duration-200 outline-none select-none hover:bg-primary/5 hover:text-primary hover:scale-[1.02] hover:shadow-sm group border border-transparent hover:border-primary/10"
        to={item.url}
        activeOptions={{ exact: true }}
      >
        <div className="text-foreground group-hover:text-primary transition-colors duration-200 group-hover:scale-110">{item.icon}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold group-hover:text-primary transition-colors duration-200">{item.title}</div>
          {item.description && (
            <p className="text-sm leading-snug text-muted-foreground group-hover:text-primary/70 transition-colors duration-200 mt-1">
              {item.description}
            </p>
          )}
        </div>
      </Link>
    );
  };

  return (
    <header className="p-4 bg-background/80 sticky top-0 z-50 flex min-h-(--header-height) w-full flex-shrink-0 items-center justify-center border-b border-border/50 backdrop-blur-xl shadow-sm transition-all duration-300">
      {/* Desktop Menu */}
      <nav className="hidden justify-between lg:flex w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          {/* Enhanced Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg group-hover:scale-110 transition-all duration-300">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                Word Automation
              </span>
              <span className="text-xs text-muted-foreground font-medium transition-all duration-300 -mt-1">
                Professional Templates
              </span>
            </div>
          </Link>
          
          {/* Enhanced Navigation */}
          <div className="flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {links.map((item) => renderMenuItem(item))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="flex gap-3 items-center">
          <ModeToggle />
          {session && (
            <div className="flex items-center gap-3">
              <OrganizationSwitcher />
              <div className="h-6 w-px bg-border"></div>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          )}
          {!session && (
            <div className="flex items-center gap-2">
              <Link to="/sign-in">
                <Button 
                  variant="ghost" 
                  className="hover:scale-105 transition-all duration-200"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-105 transition-all duration-200 hover:shadow-lg group"
                >
                  <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Mobile Menu */}
      <div className="block lg:hidden w-full">
        <div className="flex items-center justify-between">
          {/* Enhanced Mobile Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            activeOptions={{ exact: true }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg group-hover:scale-110 transition-all duration-300">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Word Automation
            </span>
          </Link>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="hover:scale-105 transition-all duration-200 hover:shadow-sm border-border/50"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
              <SheetHeader className="pb-6">
                <SheetTitle>
                  <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg group-hover:scale-110 transition-all duration-300">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        Word Automation
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Professional Templates
                      </span>
                    </div>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 p-4">
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col gap-4"
                >
                  {links.map((item) => renderMobileMenuItem(item))}
                </Accordion>

                <div className="flex flex-col gap-3 pt-6 border-t border-border/50">
                  {session && (
                    <div className="flex flex-col gap-3">
                      <OrganizationSwitcher />
                      <Button 
                        variant="destructive" 
                        onClick={handleSignOut}
                        className="w-full hover:scale-[1.02] transition-all duration-200"
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                  {!session && (
                    <div className="flex flex-col gap-3">
                      <Link to="/sign-in" className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full hover:scale-[1.02] transition-all duration-200"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/sign-up" className="w-full">
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:scale-[1.02] transition-all duration-200 group"
                        >
                          <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                  <div className="flex justify-center pt-2">
                    <ModeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export { Navbar1 };
