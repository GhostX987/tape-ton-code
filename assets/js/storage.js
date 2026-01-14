const KEY = "codeplay_progress_v1";

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { xp: 0, done: {} };
    return JSON.parse(raw);
  } catch {
    return { xp: 0, done: {} };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function markDone(id, xpGain = 10) {
  const p = loadProgress();
  if (!p.done[id]) {
    p.done[id] = true;
    p.xp += xpGain;
    saveProgress(p);
  }
  return p;
}
