import { cn } from "@/lib/cn";

export function Eyebrow({
  children,
  onStage = false,
  className,
}: {
  children: React.ReactNode;
  onStage?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-eyebrow uppercase",
        onStage ? "text-signal" : "text-green",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
