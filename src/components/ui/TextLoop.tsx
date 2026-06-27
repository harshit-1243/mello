"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * TextLoop — cycles through a list of words, each sliding/fading up as it
 * swaps. Used to rotate mello's verticals (turfs · gyms · clubs · …).
 */
export function TextLoop({
  words,
  interval = 2200,
  className,
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span style={{ display: "inline-flex", overflow: "hidden", verticalAlign: "bottom" }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          className={className}
          initial={{ y: "0.7em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-0.7em", opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "inline-block" }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
