import type { SVGProps } from "react";

/** Shared minimal stroke-icon base (Lucide-flavoured, calm weight). */
function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const Check = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const X = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);

export const ArrowUp = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);

export const ArrowDown = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
);

export const Phone = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 4h3l2 5-2 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2.1 2A16 16 0 0 1 3 6.1 2 2 0 0 1 5 4Z" />
  </Svg>
);

export const PhoneMissed = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M5 4h3l2 5-2 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2.1 2A16 16 0 0 1 3 6.1 2 2 0 0 1 5 4Z" />
    <path d="m15 3 5 5M20 3l-5 5" />
  </Svg>
);

export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Svg>
);

export const CalendarCheck = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5M9 15l2.2 2.2L15.5 13" />
  </Svg>
);

export const MessageCheck = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 20.5l1.4-5.2A8.5 8.5 0 1 1 21 11.5Z" />
    <path d="m8.5 11.8 2.3 2.3 4.7-4.6" />
  </Svg>
);

export const ShieldCheck = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const Users = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16.5 5.2a3.2 3.2 0 0 1 0 6M17.5 19a5.5 5.5 0 0 0-2.5-4.6" />
  </Svg>
);

export const Globe = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
  </Svg>
);

export const BarChart = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 20h16M7 20v-6M12 20V8M17 20v-9" />
  </Svg>
);

export const Repeat = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M17 3.5 20.5 7 17 10.5M20.5 7H7a3.5 3.5 0 0 0-3.5 3.5v1M7 20.5 3.5 17 7 13.5M3.5 17h13.5a3.5 3.5 0 0 0 3.5-3.5v-1" />
  </Svg>
);

export const Bolt = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </Svg>
);

export const Menu = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </Svg>
);

export const PlayCircle = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8.5 6 3.5-6 3.5v-7Z" fill="currentColor" stroke="none" />
  </Svg>
);
