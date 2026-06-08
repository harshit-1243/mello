/** The mello tile mark — green square with the four waveform bars. */
export function DashMark({ size = 26 }: { size?: number }) {
  const bar = "rounded-[2px] bg-on-green";
  const w = Math.round(size * 0.085);
  return (
    <span
      className="grid place-items-center rounded-[7px] bg-green"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="flex items-end gap-[2px]" style={{ height: size * 0.46 }}>
        <i className={bar} style={{ width: w, height: "42%" }} />
        <i className={bar} style={{ width: w, height: "82%" }} />
        <i className={bar} style={{ width: w, height: "60%" }} />
        <i className={bar} style={{ width: w, height: "100%" }} />
      </span>
    </span>
  );
}
