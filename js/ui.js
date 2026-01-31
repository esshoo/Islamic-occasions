export function bindUI() {
  return {
    gate: document.getElementById("gate"),
    main: document.getElementById("main"),

    gateHeadline: document.getElementById("gateHeadline"),
    nameInput: document.getElementById("nameInput"),
    enterBtn: document.getElementById("enterBtn"),
    err: document.getElementById("err"),

    titleLine: document.getElementById("titleLine"),
    nameLine: document.getElementById("nameLine"),
    statusLine: document.getElementById("statusLine"),
    sourceNote: document.getElementById("sourceNote"),

    dEl: document.getElementById("d"),
    hEl: document.getElementById("h"),
    mEl: document.getElementById("m"),
    sEl: document.getElementById("s"),

    audioBtn: document.getElementById("audioBtn"),
    audioLabel: document.getElementById("audioLabel"),
    bgm: document.getElementById("bgm"),
  };
}

export function sanitizeName(raw) {
  return (raw || "").trim().replace(/\s+/g, " ").slice(0, 40);
}

export function showError(ui, msg) {
  ui.err.textContent = msg;
  ui.err.classList.add("show");
  ui.nameInput.classList.add("shake");
  setTimeout(() => ui.nameInput.classList.remove("shake"), 450);
}

export function clearError(ui) {
  ui.err.classList.remove("show");
}

export function showMain(ui) {
  ui.gate.classList.add("fade-out");
  setTimeout(() => {
    ui.gate.style.display = "none";
    ui.main.style.display = "grid";
    ui.main.classList.add("fade-in");
  }, 260);
}

export function setCountdown(ui, { days, hrs, mins, secs }) {
  ui.dEl.textContent = String(days);
  ui.hEl.textContent = String(hrs);
  ui.mEl.textContent = String(mins);
  ui.sEl.textContent = String(secs);
}

export function msToParts(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(sec / 86400);
  const hrs = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  return { days, hrs, mins, secs };
}
