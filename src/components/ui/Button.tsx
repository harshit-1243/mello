"use client";

import { cn } from "@/lib/cn";
import { scrollToId } from "@/lib/smooth-scroll";

type Variant = "primary" | "secondary" | "ghost" | "ghostStage";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight " +
  "transition-[transform,background-color,color,box-shadow,border-color] duration-200 ease-out-expo " +
  "select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-[52px] px-7 text-[1.02rem]",
};

const variants: Record<Variant, string> = {
  primary: "bg-green text-on-green shadow-soft hover:bg-green-press hover:shadow-lift",
  secondary:
    "bg-paper-raised text-ink border border-line hover:border-ink/25 hover:-translate-y-px hover:shadow-soft",
  ghost: "text-ink hover:bg-ink/[0.05]",
  ghostStage: "text-on-stage/80 hover:text-on-stage hover:bg-white/[0.06]",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "color">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  external,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = cn(base, sizes[size], variants[variant], className);

  if (href) {
    const isAnchor = href.startsWith("#");
    if (isAnchor) {
      return (
        <a
          href={href}
          className={cls}
          onClick={(e) => {
            e.preventDefault();
            scrollToId(href);
          }}
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        className={cls}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
