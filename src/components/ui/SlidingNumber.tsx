"use client";

import { motion } from "motion/react";

/**
 * SlidingNumber — each digit sits in a 1em window over a 0-9 column; when the
 * value changes the column springs to the new digit, so numbers roll like an
 * odometer. Best on a monospace/tabular font so columns stay aligned.
 */
function Digit({ d }: { d: number }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        height: "1em",
        width: "1ch",
        lineHeight: 1,
        verticalAlign: "bottom",
      }}
    >
      <motion.span
        style={{ display: "block" }}
        animate={{ y: `-${d}em` }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ display: "block", height: "1em", lineHeight: 1, textAlign: "center" }}>
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function SlidingNumber({ value, className }: { value: number; className?: string }) {
  const chars = value.toLocaleString("en-IN").split("");
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "flex-end" }}>
      {chars.map((ch, i) =>
        /\d/.test(ch) ? <Digit key={i} d={Number(ch)} /> : <span key={i}>{ch}</span>,
      )}
    </span>
  );
}
