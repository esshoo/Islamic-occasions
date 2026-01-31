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

  // تُستدعى داخل click gesture (زر "دخول")
  async function unlockAndStart(src) {
    unlocked = true;
    setTrack(src);
    ui.bgm.volume = 1;
    await playSafe(); // تشغيل فوري
  }

  // تغيير تراك بدون قطع التشغيل
  async function switchTrackKeepPlaying(src) {
    const wasPlaying = unlocked && !ui.bgm.paused && !ui.bgm.ended;
    setTrack(src);

    if (unlocked && wantsAudio && wasPlaying) {
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
      if (unlocked) playSafe();
      else setUiPlaying(false);
    }
  }

  return { unlockAndStart, switchTrackKeepPlaying, toggle };
}
