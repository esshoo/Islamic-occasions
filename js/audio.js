export function createAudioController(ui) {
  let wantsAudio = true;
  let unlocked = false;

  function setUiPlaying(isPlaying) {
    if (isPlaying) {
      ui.audioBtn.classList.remove("muted");
      ui.audioLabel.textContent = "الصوت يعمل";
    } else {
      ui.audioBtn.classList.add("muted");
      ui.audioLabel.textContent = "الصوت متوقف";
    }
  }

  async function playSafe() {
    if (!wantsAudio) {
      setUiPlaying(false);
      return false;
    }
    try {
      await ui.bgm.play();
      setUiPlaying(true);
      return true;
    } catch {
      setUiPlaying(false);
      return false;
    }
  }

  function setTrack(src) {
    if (ui.bgm.getAttribute("src") === src) return;
    ui.bgm.setAttribute("src", src);
    ui.bgm.load();
  }

  // ✅ تُستدعى داخل click gesture (زر "دخول") لتفكيك سياسة المتصفح
  async function unlockAndStart(src) {
    unlocked = true;
    setTrack(src);
    ui.bgm.volume = 1;
    // محاولة تشغيل مباشرة داخل نفس الـ gesture
    await playSafe();
  }

  // ✅ تغيير تراك بدون قطع التشغيل: لو كان شغال نخليه يفضل شغال
  async function switchTrackKeepPlaying(src) {
    const wasPlaying = unlocked && !ui.bgm.paused && !ui.bgm.ended;
    setTrack(src);

    // لو كان شغال أو المستخدم فاتح الصوت: شغّله تاني بعد load
    if (unlocked && wantsAudio && wasPlaying) {
      // microtask لتجنب سباق load
      await new Promise(r => setTimeout(r, 0));
      await playSafe();
    }
  }

  function toggle() {
    wantsAudio = !wantsAudio;
    if (!wantsAudio) {
      ui.bgm.pause();
      setUiPlaying(false);
    } else {
      // لو unlocked نقدر نشغله فورًا
      if (unlocked) playSafe();
      else setUiPlaying(false);
    }
  }

  return { unlockAndStart, switchTrackKeepPlaying, toggle };
}
