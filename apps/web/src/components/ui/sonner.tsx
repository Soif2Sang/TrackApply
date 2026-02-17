"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast border-border bg-card text-card-foreground shadow-lg",
          title: "text-foreground text-sm font-medium",
          description: "text-card-foreground text-xs",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          success: "border-green-500/30 bg-green-500/10",
          error: "border-red-500/30 bg-red-500/10",
          warning: "border-yellow-500/30 bg-yellow-500/10",
          info: "border-blue-500/30 bg-blue-500/10",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
