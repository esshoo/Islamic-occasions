export function updateMoonPhase() {
  const maskB = document.getElementById("maskB");
  if (!maskB) return;

  // Approx moon phase
  const NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14, 0);
  const SYNODIC_MONTH = 29.530588853; // days
  const now = Date.now();

  const days = (now - NEW_MOON_UTC) / 86400000;
  let phase = (days % SYNODIC_MONTH) / SYNODIC_MONTH;
  if (phase < 0) phase += 1;

  const illum = 0.5 * (1 - Math.cos(2 * Math.PI * phase)); // 0..1
  const r = 140;
  const shift = 2 * r * illum;
  const dx = (phase < 0.5) ? shift : -shift;

  maskB.setAttribute("cx", String(450 + dx));
}
