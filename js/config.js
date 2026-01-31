export const CONFIG = {
  tz: "Asia/Riyadh",

  durations: {
    eidFitrDays: 3,
    eidAdhaDays: 4,
  },

  hijri: {
    ramadan: { m: 9, d: 1 },
    eidFitr: { m: 10, d: 1 },
    eidAdha: { m: 12, d: 10 },
  },

  api: {
    base: "https://api.aladhan.com/v1",
    timeoutMs: 4500,
    hijriAdjustment: 0, // +1 أو -1 لو احتجت
  },

  audio: {
    ramadan: "./assets/ramadan.mp3",
    eidFitr: "./assets/eidfitr.mp3",
    eidAdha: "./assets/eidadha.mp3",
  },

  loop: {
    modeEveryMs: 60_000,       // تحديث الحالة كل دقيقة
    countdownEveryMs: 1000,    // العداد كل ثانية
  },
};
