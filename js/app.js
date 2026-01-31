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

  // رمضان الحالي أو القادم
  if (mode === "ramadan" || mode === "countdown-ramadan") return "كل رمضان وأنتم بخير";

  // بين الفطر والأضحى: القادم الأضحى
  if (mode === "countdown-adha") return "كل عيد أضحى وأنتم بخير";

  return "كل عام وأنتم بخير";
}

function setGateHeadline(mode){
  if (ui.gateHeadline) ui.gateHeadline.textContent = getGateGreetingText(mode);
}

// ---------- Main texts + audio based on mode ----------
function setMainTextsAndAudio(mode, ctx) {
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
    audio.switchTrackKeepPlaying(CONFIG.audio.eidFitr);
    return;
  }

  if (mode === "eid-adha") {
    ui.titleLine.textContent = "عيد الأضحى مبارك 🕋";
    ui.nameLine.textContent = `كل عام وأنت بخير يا ${guestName}`;
    ui.statusLine.textContent = "عيد الأضحى المبارك";
    audio.switchTrackKeepPlaying(CONFIG.audio.eidAdha);
    return;
  }

  if (mode === "ramadan") {
    ui.titleLine.textContent = "رمضان كريم 🌙";
    ui.nameLine.textContent = `كل رمضان وأنت طيب يا ${guestName}`;
    ui.statusLine.textContent = "المتبقي على عيد الفطر:";
    audio.switchTrackKeepPlaying(CONFIG.audio.ramadan);
    return;
  }

  if (mode === "countdown-adha") {
    ui.titleLine.textContent = "تهنئة خاصة ✨";
    ui.nameLine.textContent = `كل رمضان وأنت طيب يا ${guestName}`;
    ui.statusLine.textContent = "المتبقي على عيد الأضحى:";
    audio.switchTrackKeepPlaying(CONFIG.audio.ramadan);
    return;
  }

  if (mode === "countdown-ramadan") {
    ui.titleLine.textContent = "تهنئة خاصة ✨";
    ui.nameLine.textContent = `كل رمضان وأنت طيب يا ${guestName}`;
    ui.statusLine.textContent = "المتبقي على رمضان:";
    audio.switchTrackKeepPlaying(CONFIG.audio.ramadan);
    return;
  }

  ui.titleLine.textContent = "تهنئة";
  ui.nameLine.textContent = `أهلًا يا ${guestName}`;
  ui.statusLine.textContent = "تعذر تحديد المناسبة حاليًا";
}

// ---------- Gate-only refresh (no audio touch) ----------
async function refreshGateOnly(){
  const ctx = await getDateContext();
  const { mode } = computeMode(ctx);
  setGateHeadline(mode);
}

// ---------- Main refresh (updates mode + countdown target + audio) ----------
async function refreshMainMode(){
  const ctx = await getDateContext();
  const { mode, countdownToUtc } = computeMode(ctx);

  // Gate headline can still reflect mode even after entering (optional)
  setGateHeadline(mode);

  countdownTargetUtc = countdownToUtc;
  setMainTextsAndAudio(mode, ctx);

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

// ---------- Enter flow ----------
async function onEnter(){
  const nm = sanitizeName(ui.nameInput.value);
  if (!nm) {
    showError(ui, "اكتب اسمك يا جميل الأول");
    return;
  }

  clearError(ui);
  guestName = nm;

  showMain(ui);

  // ✅ أهم سطرين: افتح وتشغيل الصوت داخل نفس الـ click gesture
  // ثم بعد كده خليه يتحول تلقائيًا حسب المناسبة بدون قطع التشغيل
  await audio.unlockAndStart(CONFIG.audio.ramadan);

  if (!mainStarted) {
    mainStarted = true;

    // تحديث وضع المناسبة مرة فورًا ثم كل دقيقة
    await refreshMainMode();
    setInterval(refreshMainMode, CONFIG.loop.modeEveryMs);

    // تحديث العداد كل ثانية
    refreshCountdown();
    setInterval(refreshCountdown, CONFIG.loop.countdownEveryMs);
  }
}

// ---------- Events ----------
ui.enterBtn.addEventListener("click", () => onEnter());
ui.nameInput.addEventListener("input", () => clearError(ui));
ui.nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") onEnter(); });
ui.audioBtn.addEventListener("click", () => audio.toggle());

// ---------- Boot: update gate greeting immediately ----------
refreshGateOnly();
setInterval(refreshGateOnly, CONFIG.loop.modeEveryMs);
