import { CONFIG } from "./config.js";

function abortableFetch(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(t));
}

// قراءة اليوم الهجري من الجهاز (بدون إنترنت) — غالبًا Umm al-Qura مع ar-SA :contentReference[oaicite:7]{index=7}
function getHijriFromDevice() {
  const fmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = fmt.formatToParts(new Date());
  const y = Number(parts.find(p => p.type === "year")?.value);
  const m = Number(parts.find(p => p.type === "month")?.value);
  const d = Number(parts.find(p => p.type === "day")?.value);

  if (!y || !m || !d) throw new Error("Device Hijri not supported");
  return { hYear: y, hMonth: m, hDay: d };
}

function cacheKey(year) {
  return `targets:${year}:adj${CONFIG.api.hijriAdjustment}`;
}

function loadTargetsFromCache(year) {
  try {
    const v = localStorage.getItem(cacheKey(year));
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function saveTargetsToCache(year, targets) {
  localStorage.setItem(cacheKey(year), JSON.stringify(targets));
}

// تحويل (هجري→ميلادي) باستخدام API
async function hToG(hDay, hMonth, hYear) {
  const dd = String(hDay).padStart(2, "0");
  const mm = String(hMonth).padStart(2, "0");
  const yyyy = String(hYear);

  const url = `${CONFIG.api.base}/hToG/${dd}-${mm}-${yyyy}`;
  const res = await abortableFetch(url, CONFIG.api.timeoutMs);
  if (!res.ok) throw new Error("hToG failed");
  const json = await res.json();
  const g = json?.data?.gregorian;

  return {
    gy: Number(g.year),
    gm: Number(g.month.number),
    gd: Number(g.day),
  };
}

// تحويل (ميلادي→هجري) لليوم الحالي
async function gToH_Today() {
  // نقرأ التاريخ الميلادي اليوم بتوقيت الرياض باستخدام Intl timeZone
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;

  const url = `${CONFIG.api.base}/gToH/${d}-${m}-${y}?adjustment=${CONFIG.api.hijriAdjustment}`;
  const res = await abortableFetch(url, CONFIG.api.timeoutMs);
  if (!res.ok) throw new Error("gToH failed");
  const json = await res.json();

  const hijri = json?.data?.hijri;
  return {
    hYear: Number(hijri.year),
    hMonth: Number(hijri.month.number),
    hDay: Number(hijri.day),
  };
}

// Riyadh 00:00 -> UTC ms (Riyadh UTC+3)
function riyadhMidnightToUtcMs(gy, gm, gd) {
  return Date.UTC(gy, gm - 1, gd, 0, 0, 0) - (3 * 60 * 60 * 1000);
}

async function computeTargets(hYear) {
  const cached = loadTargetsFromCache(hYear);
  if (cached) return { targets: cached, source: "cache" };

  const { ramadan, eidFitr, eidAdha } = CONFIG.hijri;

  const gRam = await hToG(ramadan.d, ramadan.m, hYear);
  const gFitr = await hToG(eidFitr.d, eidFitr.m, hYear);
  const gAdha = await hToG(eidAdha.d, eidAdha.m, hYear);
  const gNextRam = await hToG(ramadan.d, ramadan.m, hYear + 1);

  const targets = {
    ramadanStartUtc: riyadhMidnightToUtcMs(gRam.gy, gRam.gm, gRam.gd),
    eidFitrUtc:      riyadhMidnightToUtcMs(gFitr.gy, gFitr.gm, gFitr.gd),
    eidAdhaUtc:      riyadhMidnightToUtcMs(gAdha.gy, gAdha.gm, gAdha.gd),
    nextRamadanUtc:  riyadhMidnightToUtcMs(gNextRam.gy, gNextRam.gm, gNextRam.gd),
  };

  saveTargetsToCache(hYear, targets);
  return { targets, source: "online" };
}

// API أولًا، ثم Cache، ثم جهاز
export async function getDateContext() {
  try {
    const hijri = await gToH_Today();
    const { targets, source: targetSource } = await computeTargets(hijri.hYear);
    return { source: "online", hijri, targets, targetSource };
  } catch {
    // fallback 1: try device hijri
    try {
      const hijri = getHijriFromDevice();
      const cached = loadTargetsFromCache(hijri.hYear);
      if (cached) return { source: "device", hijri, targets: cached, targetSource: "cache" };
      // لا يوجد cache: سنرجع hijri فقط
      return { source: "device", hijri, targets: null, targetSource: "none" };
    } catch {
      return { source: "none", hijri: null, targets: null, targetSource: "none" };
    }
  }
}
