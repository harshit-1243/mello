import { cn } from "@/lib/cn";

export function Marquee({
  items,
  duration = 34,
  className,
  itemClassName,
}: {
  items: React.ReactNode[];
  duration?: number;
  className?: string;
  itemClassName?: string;
}) {
  const group = (key: string, hidden: boolean) => (
    <div
      key={key}
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
    >
      {items.map((it, i) => (
        <span key={i} className={cn("flex items-center", itemClassName)}>
          {it}
          <span
            aria-hidden
            className="mx-6 inline-block h-2.5 w-2.5 shrink-0 rotate-45 bg-current opacity-40 sm:mx-10"
          />
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("marquee-mask overflow-hidden", className)}>
      <div
        className="marquee-track animate-marquee"
        style={{ "--mq-duration": `${duration}s` } as React.CSSProperties}
      >
        {group("a", false)}
        {group("b", true)}
      </div>
    </div>
  );
}
