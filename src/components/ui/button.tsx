"use client";
import { cn, ripple } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, useCallback } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, onClick, ...props }, ref) => {
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      ripple(e);
      onClick?.(e);
    }, [onClick]);

    const base = "relative overflow-hidden inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-[#E8311A] text-white hover:bg-[#c9280f]",
      secondary: "bg-[#282828] text-[#F0F0F0] border border-[#333333] hover:border-[#444444] hover:bg-[#222]",
      ghost: "text-[#9CA3AF] hover:text-[#F0F0F0] hover:bg-[#282828]",
      danger: "bg-[#EF4444] text-white hover:bg-[#dc2626]",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded",
      md: "px-4 py-2 text-sm rounded",
      lg: "px-6 py-3 text-base rounded",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
