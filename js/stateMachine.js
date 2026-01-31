import { CONFIG } from "./config.js";

function cmp(a, b) {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

function inRange(h, start, end) {
  return cmp(h, start) >= 0 && cmp(h, end) <= 0;
}

export function computeMode(ctx) {
  if (!ctx?.hijri) return { mode: "unknown", countdownToUtc: null };

  const h = { y: ctx.hijri.hYear, m: ctx.hijri.hMonth, d: ctx.hijri.hDay };
  const y = h.y;

  const fitrStart = { y, m: 10, d: 1 };
  const fitrEnd   = { y, m: 10, d: CONFIG.durations.eidFitrDays };

  const adhaStart = { y, m: 12, d: 10 };
  const adhaEnd   = { y, m: 12, d: 9 + CONFIG.durations.eidAdhaDays };

  // Eid al-Fitr window (3 days)
  if (inRange(h, fitrStart, fitrEnd)) {
    return {
      mode: "eid-fitr",
      countdownToUtc: ctx.targets ? (ctx.targets.eidFitrUtc + CONFIG.durations.eidFitrDays * 86400000) : null
    };
  }

  // Eid al-Adha window (4 days)
  if (inRange(h, adhaStart, adhaEnd)) {
    return {
      mode: "eid-adha",
      countdownToUtc: ctx.targets ? (ctx.targets.eidAdhaUtc + CONFIG.durations.eidAdhaDays * 86400000) : null
    };
  }

  // Ramadan month: countdown to Eid al-Fitr
  if (h.m === 9) {
    return { mode: "ramadan", countdownToUtc: ctx.targets ? ctx.targets.eidFitrUtc : null };
  }

  // Between Eid Fitr and Eid Adha -> countdown to Adha
  const afterFitr = cmp(h, fitrEnd) > 0;
  const beforeAdha = cmp(h, adhaStart) < 0;
  if (afterFitr && beforeAdha) {
    return { mode: "countdown-adha", countdownToUtc: ctx.targets ? ctx.targets.eidAdhaUtc : null };
  }

  // Otherwise -> countdown to Ramadan (same year if before, else next year)
  const beforeRamadan = h.m < 9;
  if (beforeRamadan) {
    return { mode: "countdown-ramadan", countdownToUtc: ctx.targets ? ctx.targets.ramadanStartUtc : null };
  }
  return { mode: "countdown-ramadan", countdownToUtc: ctx.targets ? ctx.targets.nextRamadanUtc : null };
}
