import { FileText } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
      <footer className="bg-sidebar border-t py-12 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="animate-fade-in-up animation-delay-200">
              <div className="flex items-center space-x-2 mb-4 group">
                <FileText className="h-6 w-6 text-accent group-hover:animate-pulse transition-all duration-300" />
                <span className="text-lg font-bold group-hover:text-primary transition-colors duration-300">Word Automation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Streamline your document workflow with intelligent automation and powerful templating.
              </p>
            </div>

            <div className="animate-fade-in-up animation-delay-400">
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="animate-fade-in animation-delay-600">
                  <a href="#features" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Features
                  </a>
                </li>
                <li className="animate-fade-in animation-delay-700">
                  <Link to="/pricing" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div className="animate-fade-in-up animation-delay-600">
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="animate-fade-in animation-delay-800">
                  <a href="#" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Help Center
                  </a>
                </li>
                <li className="animate-fade-in animation-delay-900">
                  <a href="#" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Documentation
                  </a>
                </li>
                <li className="animate-fade-in animation-delay-1000">
                  <Link to="/support" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Contact Us
                  </Link>
                </li>
                <li className="animate-fade-in animation-delay-1100">
                  <Link to="/status" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div className="animate-fade-in-up animation-delay-800">
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="animate-fade-in animation-delay-1200">
                  <a href="#" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Privacy
                  </a>
                </li>
                <li className="animate-fade-in animation-delay-1300">
                  <a href="#" className="hover:text-foreground transition-all duration-300 hover:translate-x-1 inline-block">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground animate-fade-in animation-delay-1400">
            <p>&copy; 2025 Word Automation. All rights reserved.</p>
          </div>
        </div>
      </footer>
  );
}