import { CONFIG } from "./config.js";
import { bindUI, sanitizeName, showError, clearError, showMain, msToParts, setCountdown } from "./ui.js";
import { createAudioController } from "./audio.js";
import { updateMoonPhase } from "./moon.js";
import { getDateContext } from "./dateService.js";
import { computeMode } from "./stateMachine.js";

const ui = bindUI();
const audio = createAudioController(ui);

let guestName = "";
let countdownTargetUtc = null;
let mainStarted = false;

// ---------- Gate greeting text ----------
function getGateGreetingText(mode){
  if (mode === "eid-fitr") return "كل عيد فطر وأنتم بخير";
  if (mode === "eid-adha") return "كل عيد أضحى وأنتم بخير";

  // Ramadan current/upcoming
  if (mode === "ramadan" || mode === "countdown-ramadan") return "كل رمضان وأنتم بخير";

  // Between Fitr and Adha: upcoming is Adha
  if (mode === "countdown-adha") return "كل عيد أضحى وأنتم بخير";

  return "كل عام وأنتم بخير";
}

function setGateHeadline(mode){
  if (ui.gateHeadline) ui.gateHeadline.textContent = getGateGreetingText(mode);
}

// ---------- Main texts + audio ----------
async function setMainTextsAndAudio(mode, ctx) {
  const sourceMsg = (() => {
    if (ctx.source === "online") return "تم جلب التاريخ أونلاين ✅";
    if (ctx.source === "device") return "لا يوجد إنترنت — تم استخدام تاريخ الجهاز ⚠️";
    return "لا يمكن تحديد التاريخ الآن ❌";
  })();

  if (ui.sourceNote) ui.sourceNote.textContent = sourceMsg;

  if (mode === "eid-fitr") {
    ui.titleLine.textContent = "عيدكم مبارك 🎉";
    ui.nameLine.textContent = `كل عام وأنت بخير يا ${guestName}`;
    ui.statusLine.textContent = "عيد الفطر المبارك";
    await audio.switchTrackKeepPlaying(CONFIG.audio.eidFitr);
    return;
  }

  if (mode === "eid-adha") {
    ui.titleLine.textContent = "عيد الأضحى مبارك 🕋";
    ui.nameLine.textContent = `كل عام وأنت بخير يا ${guestName}`;
    ui.statusLine.textContent = "عيد الأضحى المبارك";
    await audio.switchTrackKeepPlaying(CONFIG.audio.eidAdha);
    return;
  }

  if (mode === "ramadan") {
    ui.titleLine.textContent = "رمضان كريم 🌙";
    ui.nameLine.textContent = `كل رمضان وأنت طيب يا ${guestName}`;
    ui.statusLine.textContent = "المتبقي على عيد الفطر:";
    await audio.switchTrackKeepPlaying(CONFIG.audio.ramadan);
    return;
  }

  if (mode === "countdown-adha") {
    ui.titleLine.textContent = "تهنئة خاصة ✨";
    ui.nameLine.textContent = `كل رمضان وأنت طيب يا ${guestName}`;
    ui.statusLine.textContent = "المتبقي على عيد الأضحى:";
    await audio.switchTrackKeepPlaying(CONFIG.audio.ramadan);
    return;
  }

  if (mode === "countdown-ramadan") {
    ui.titleLine.textContent = "تهنئة خاصة ✨";
    ui.nameLine.textContent = `كل رمضان وأنت طيب يا ${guestName}`;
    ui.statusLine.textContent = "المتبقي على رمضان:";
    await audio.switchTrackKeepPlaying(CONFIG.audio.ramadan);
    return;
  }

  ui.titleLine.textContent = "تهنئة";
  ui.nameLine.textContent = `أهلًا يا ${guestName}`;
  ui.statusLine.textContent = "تعذر تحديد المناسبة حاليًا";
  await audio.switchTrackKeepPlaying(CONFIG.audio.ramadan);
}

// ---------- Gate-only refresh (no audio touch) ----------
async function refreshGateOnly(){
  const ctx = await getDateContext();
  const { mode } = computeMode(ctx);
  setGateHeadline(mode);
}

// ---------- Main refresh ----------
async function refreshMainMode(){
  const ctx = await getDateContext();
  const { mode, countdownToUtc } = computeMode(ctx);

  setGateHeadline(mode);

  countdownTargetUtc = countdownToUtc;
  await setMainTextsAndAudio(mode, ctx);

  if (!countdownTargetUtc) {
    setCountdown(ui, { days: 0, hrs: 0, mins: 0, secs: 0 });

    if (ctx.source === "device" && ctx.targetSource === "none" && ui.sourceNote) {
      ui.sourceNote.textContent =
        "لا يوجد إنترنت ولا توجد تواريخ محفوظة — العدّاد الدقيق سيعمل بعد أول تشغيل أونلاين مرة واحدة.";
    }
  }
}

// ---------- Countdown loop ----------
function refreshCountdown(){
  updateMoonPhase();

  if (!countdownTargetUtc) return;
  const diff = countdownTargetUtc - Date.now();
  setCountdown(ui, msToParts(diff));
}

// ---------- Enter ----------
async function onEnter(){
  const nm = sanitizeName(ui.nameInput.value);
  if (!nm) {
    showError(ui, "اكتب اسمك يا جميل الأول");
    return;
  }

  clearError(ui);
  guestName = nm;

  showMain(ui);

  // ✅ تشغيل الصوت فورًا داخل نفس click gesture
  await audio.unlockAndStart(CONFIG.audio.ramadan);

  if (!mainStarted) {
    mainStarted = true;

    await refreshMainMode();
    setInterval(refreshMainMode, CONFIG.loop.modeEveryMs);

    refreshCountdown();
    setInterval(refreshCountdown, CONFIG.loop.countdownEveryMs);
  }
}

// ---------- Events ----------
ui.enterBtn.addEventListener("click", () => onEnter());
ui.nameInput.addEventListener("input", () => clearError(ui));
ui.nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") onEnter(); });
ui.audioBtn.addEventListener("click", () => audio.toggle());

// ---------- Boot ----------
refreshGateOnly();
setInterval(refreshGateOnly, CONFIG.loop.modeEveryMs);
