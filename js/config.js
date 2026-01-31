export const CONFIG = {
  tz: "Asia/Riyadh",

  durations: {
    eidFitrDays: 3,
    eidAdhaDays: 4,
  },

  hijri: {
    ramadan: { m: 9, d: 1 },
    eidFitr: { m: 10, d: 1 },     // 1 Shawwal
    eidAdha: { m: 12, d: 10 },    // 10 Dhul Hijjah
  },

  // Online conversion API (AlAdhan)
  // Docs/overview: base url https://api.aladhan.com/v1 :contentReference[oaicite:5]{index=5}
  api: {
    base: "https://api.aladhan.com/v1",
    timeoutMs: 4500,
    hijriAdjustment: 0, // لو احتجت +1 أو -1 للسعودية
  },

  audio: {
    ramadan: "./assets/ramadan.mp3",
    eidFitr: "./assets/eidfitr.mp3",
    eidAdha: "./assets/eidadha.mp3",
  },

  loop: {
    // تحديث حالة المناسبة (يحتاج نت): كل دقيقة
    modeEveryMs: 60_000,
    // تحديث العداد: كل ثانية محليًا
    countdownEveryMs: 1000,
  },
};
