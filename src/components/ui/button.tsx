import React from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
      secondary:
        "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm",
      outline:
        "bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

