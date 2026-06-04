"use client";

import { scrollToId } from "@/lib/smooth-scroll";

export function SmoothLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const isHash = href.startsWith("#");
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      className={className}
      onClick={
        isHash
          ? (e) => {
              e.preventDefault();
              scrollToId(href);
            }
          : undefined
      }
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
