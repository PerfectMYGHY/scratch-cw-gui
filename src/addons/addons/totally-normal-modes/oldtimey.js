let projectorSound;

export function updateSound(addon, mode) {
  if (addon.tab.editorMode === "editor" && mode === "oldTimey") {
    if (!projectorSound) {
      projectorSound = new Audio(addon.self.getResource("/assets/oldtimey-projector.mp3")) /* rewritten by pull.js */;
      projectorSound.volume = 0.1;
      projectorSound.loop = true;
    }
    projectorSound.play();
  } else if (projectorSound) projectorSound.pause();
}
