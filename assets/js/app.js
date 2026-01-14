import { getRoute, onRouteChange } from "./router.js";
import { html, setActiveNav, escapeHtml } from "./ui.js";
import { loadProgress, markDone } from "./storage.js";

const main = document.querySelector("#main");
document.querySelector("#year").textContent = new Date().getFullYear();

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Erreur chargement: ${path}`);
  return res.json();
}

/* ---------------- HOME ---------------- */

function renderHome() {
  const p = loadProgress();
  main.innerHTML = html`
    <section class="grid">
      <div class="card" style="grid-column: span 12">
        <h1 class="h1">Tape ton code</h1>
        <p class="p">
          Une plateforme pour apprendre en 3 modes : Cours, Entraînement guidé,
          et Défis Solo.
        </p>
        <div class="kpi">
          <span class="badge">XP : <b>${p.xp}</b></span>
          <span class="badge"
            >Validés : <b>${Object.keys(p.done).length}</b></span
          >
        </div>
        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
          <a class="btn" href="#/cours">📘 Cours</a>
          <a class="btn" href="#/entrainement">🎮 Entraînement</a>
          <a class="btn" href="#/solo">🧠 Mode Solo</a>
        </div>
      </div>
    </section>
  `;
}

/* ---------------- COURS ---------------- */

async function renderCours() {
  const data = await fetchJson("data/lessons.json");
  const p = loadProgress();

  // Tri propre : track puis level
  const lessons = [...data.lessons].sort((a, b) => {
    if (a.track !== b.track) return a.track.localeCompare(b.track);
    return a.level - b.level;
  });

  const items = lessons
    .map((l) => {
      const done = !!p.done[l.id];
      return html`
        <div class="item">
          <div>
            <div><b>${escapeHtml(l.track)}</b> — ${escapeHtml(l.title)}</div>
            <small
              >Niveau ${l.level} • ${done ? "✅ Terminé" : "⏳ À faire"}</small
            >
          </div>
          <button class="btn" data-open-lesson="${l.id}">Ouvrir</button>
        </div>
      `;
    })
    .join("");

  main.innerHTML = html`
    <section class="card">
      <h2 class="h2">📘 Cours</h2>
      <p class="p">Une notion à la fois. Exemple + explication claire.</p>
      <div class="list">${items}</div>
      <div id="lessonView" style="margin-top:14px;"></div>
    </section>
  `;

  main.querySelectorAll("[data-open-lesson]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-lesson");
      const lesson = lessons.find((x) => x.id === id);
      openLesson(lesson);
    });
  });

  function openLesson(lesson) {
    const view = main.querySelector("#lessonView");
    view.innerHTML = html`
      <div class="card" style="margin-top:14px;">
        <div
          class="item"
          style="border:none; background:transparent; padding:0;"
        >
          <div>
            <div>
              <b>${escapeHtml(lesson.track)}</b> — ${escapeHtml(lesson.title)}
            </div>
            <small>Niveau ${lesson.level}</small>
          </div>
          <button class="btn" id="markLesson">Marquer terminé (+10 XP)</button>
        </div>

        <div style="margin-top:10px;">
          ${lesson.content
            .map((line) => `<p class="p">${escapeHtml(line)}</p>`)
            .join("")}
        </div>

        <div class="card" style="margin-top:12px;">
          <div class="muted" style="margin-bottom:8px;">Exemple</div>
          <pre style="margin:0; white-space:pre-wrap;">
${escapeHtml(lesson.example)}</pre
          >
        </div>
      </div>
    `;

    view.querySelector("#markLesson").addEventListener("click", () => {
      const prog = markDone(lesson.id, 10);
      alert(`✅ Terminé ! XP total : ${prog.xp}`);
      renderCours();
    });
  }
}

/* ---------------- EXERCICES ---------------- */

function normalize(str) {
  return String(str).replace(/\r\n/g, "\n").trim();
}

async function renderEntrainement() {
  const data = await fetchJson("data/exercises.json");
  const p = loadProgress();

  const items = data.exercises
    .map((ex) => {
      const done = !!p.done[ex.id];
      return html`
        <div class="item">
          <div>
            <div><b>${escapeHtml(ex.track)}</b> — ${escapeHtml(ex.title)}</div>
            <small
              >${escapeHtml(ex.type)} •
              ${done ? "✅ Validé" : "⏳ À faire"}</small
            >
          </div>
          <button class="btn" data-open-ex="${ex.id}">Ouvrir</button>
        </div>
      `;
    })
    .join("");

  main.innerHTML = html`
    <section class="card">
      <h2 class="h2">🎮 Entraînement</h2>
      <p class="p">Exercices guidés : quiz, compléter, ordre, bug-fix…</p>
      <div class="list">${items}</div>
      <div id="exerciseView" style="margin-top:14px;"></div>
    </section>
  `;

  main.querySelectorAll("[data-open-ex]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-ex");
      const ex = data.exercises.find((x) => x.id === id);
      openExercise(ex);
    });
  });

  function openExercise(ex) {
    const view = main.querySelector("#exerciseView");
    const done = !!p.done[ex.id];

    if (ex.type === "quiz") {
      view.innerHTML = html`
        <div class="card" style="margin-top:14px;">
          <div
            class="item"
            style="border:none; background:transparent; padding:0;"
          >
            <div>
              <div>
                <b>${escapeHtml(ex.track)}</b> — ${escapeHtml(ex.title)}
              </div>
              <small>${done ? "✅ Déjà validé" : "⏳ Pas encore validé"}</small>
            </div>
          </div>

          <p class="p" style="margin-top:10px;">${escapeHtml(ex.prompt)}</p>
          <div class="card">
            <div class="muted" style="margin-bottom:8px;">Code</div>
            <pre style="margin:0; white-space:pre-wrap;">
${escapeHtml(ex.snippet)}</pre
            >
          </div>

          <div class="list" style="margin-top:12px;">
            ${ex.choices
              .map(
                (c, idx) => html`
                  <label class="item" style="cursor:pointer;">
                    <span>${escapeHtml(c)}</span>
                    <input type="radio" name="q" value="${idx}" />
                  </label>
                `
              )
              .join("")}
          </div>

          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="check">Vérifier</button>
          </div>

          <div id="feedback" class="p" style="margin-top:10px;"></div>
        </div>
      `;

      view.querySelector("#check").addEventListener("click", () => {
        const selected = view.querySelector("input[name='q']:checked");
        const fb = view.querySelector("#feedback");
        if (!selected) {
          fb.textContent = "Choisis une réponse.";
          return;
        }
        const idx = Number(selected.value);
        if (idx === ex.answerIndex) {
          const prog = markDone(ex.id, 15);
          fb.textContent = `✅ Correct ! ${ex.explain} (+15 XP, total ${prog.xp})`;
        } else {
          fb.textContent = "❌ Pas exactement. Relis le code et réessaie.";
        }
      });
      return;
    }

    if (ex.type === "fill") {
      view.innerHTML = html`
        <div class="card" style="margin-top:14px;">
          <div
            class="item"
            style="border:none; background:transparent; padding:0;"
          >
            <div>
              <div>
                <b>${escapeHtml(ex.track)}</b> — ${escapeHtml(ex.title)}
              </div>
              <small>${done ? "✅ Déjà validé" : "⏳ Pas encore validé"}</small>
            </div>
          </div>

          <p class="p" style="margin-top:10px;">${escapeHtml(ex.prompt)}</p>
          <div class="card">
            <div class="muted" style="margin-bottom:8px;">Code</div>
            <pre style="margin:0; white-space:pre-wrap;">
${escapeHtml(ex.snippet)}</pre
            >
          </div>

          <div class="item" style="margin-top:12px;">
            <div>
              <div><b>Ta réponse</b></div>
              <small>Écris exactement ce qui manque (ex: ===)</small>
            </div>
            <input
              id="fillInput"
              style="padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06); color: inherit; width: 180px;"
            />
          </div>

          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="checkFill">Vérifier</button>
          </div>

          <div id="feedback" class="p" style="margin-top:10px;"></div>
        </div>
      `;

      view.querySelector("#checkFill").addEventListener("click", () => {
        const val = normalize(view.querySelector("#fillInput").value);
        const fb = view.querySelector("#feedback");
        const ok = val === normalize(ex.blanks[0]);
        if (ok) {
          const prog = markDone(ex.id, 12);
          fb.textContent = `✅ Correct ! ${ex.explain} (+12 XP, total ${prog.xp})`;
        } else {
          fb.textContent =
            "❌ Non. Indice : pour comparer strictement, on utilise 3 signes.";
        }
      });
      return;
    }

    if (ex.type === "order") {
      // UI simple: l’utilisateur saisit une suite de numéros (ex: 3 4 1 2...)
      const numbered = ex.lines
        .map((line, i) => `(${i + 1}) ${line}`)
        .join("\n");

      view.innerHTML = html`
        <div class="card" style="margin-top:14px;">
          <div
            class="item"
            style="border:none; background:transparent; padding:0;"
          >
            <div>
              <div>
                <b>${escapeHtml(ex.track)}</b> — ${escapeHtml(ex.title)}
              </div>
              <small>${done ? "✅ Déjà validé" : "⏳ Pas encore validé"}</small>
            </div>
          </div>

          <p class="p" style="margin-top:10px;">${escapeHtml(ex.prompt)}</p>

          <div class="card">
            <div class="muted" style="margin-bottom:8px;">Lignes</div>
            <pre style="margin:0; white-space:pre-wrap;">
${escapeHtml(numbered)}</pre
            >
          </div>

          <div class="item" style="margin-top:12px;">
            <div>
              <div><b>Ton ordre</b></div>
              <small>Ex: 3 4 5 1 6 2</small>
            </div>
            <input
              id="orderInput"
              style="padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06); color: inherit; width: 220px;"
            />
          </div>

          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="checkOrder">Vérifier</button>
          </div>

          <div id="feedback" class="p" style="margin-top:10px;"></div>
        </div>
      `;

      view.querySelector("#checkOrder").addEventListener("click", () => {
        const fb = view.querySelector("#feedback");
        const raw = view.querySelector("#orderInput").value.trim();
        if (!raw) {
          fb.textContent = "Écris un ordre (ex: 3 4 5 1 6 2).";
          return;
        }
        const nums = raw.split(/\s+/).map((n) => Number(n) - 1);
        const ok =
          nums.length === ex.answerOrder.length &&
          nums.every((v, i) => v === ex.answerOrder[i]);

        if (ok) {
          const prog = markDone(ex.id, 14);
          fb.textContent = `✅ Parfait ! ${ex.explain} (+14 XP, total ${prog.xp})`;
        } else {
          fb.textContent =
            "❌ Pas encore. Indice : doctype d'abord, puis <html>, puis <head>.";
        }
      });
      return;
    }

    if (ex.type === "bugfix") {
      view.innerHTML = html`
        <div class="card" style="margin-top:14px;">
          <div
            class="item"
            style="border:none; background:transparent; padding:0;"
          >
            <div>
              <div>
                <b>${escapeHtml(ex.track)}</b> — ${escapeHtml(ex.title)}
              </div>
              <small>${done ? "✅ Déjà validé" : "⏳ Pas encore validé"}</small>
            </div>
          </div>

          <p class="p" style="margin-top:10px;">${escapeHtml(ex.prompt)}</p>

          <div class="card" style="margin-top:10px;">
            <div class="muted" style="margin-bottom:8px;">Code à corriger</div>
            <textarea
              id="bugEditor"
              style="width:100%; min-height:140px; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06); color: inherit;"
            >
${escapeHtml(ex.snippet)}</textarea
            >
          </div>

          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="checkBug">Vérifier</button>
          </div>

          <div id="feedback" class="p" style="margin-top:10px;"></div>
        </div>
      `;

      view.querySelector("#checkBug").addEventListener("click", () => {
        const fb = view.querySelector("#feedback");
        const code = view.querySelector("#bugEditor").value;

        const mustIncludeOk = (ex.mustInclude || []).every((x) =>
          code.includes(x)
        );
        const mustNotIncludeOk = (ex.mustNotInclude || []).every(
          (x) => !code.includes(x)
        );

        if (mustIncludeOk && mustNotIncludeOk) {
          const prog = markDone(ex.id, 16);
          fb.textContent = `✅ Bien vu ! ${ex.explain} (+16 XP, total ${prog.xp})`;
        } else {
          fb.textContent =
            "❌ Pas encore. Indice : relis le nom exact de la propriété.";
        }
      });
      return;
    }

    view.innerHTML = `<div class="card" style="margin-top:14px;"><p class="p">Type d’exercice inconnu.</p></div>`;
  }
}

/* ---------------- MODE SOLO + TESTS ---------------- */

const SOLO_CHALLENGES = [
  {
    id: "solo-html-01",
    track: "HTML",
    title: "Créer un titre et un paragraphe",
    prompt: "Écris du HTML qui contient un <h1> et un <p>.",
    starter: "<!-- Écris ici -->\n",
    validate: (code) => {
      const c = normalize(code).toLowerCase();
      const hasH1 = /<h1\b[^>]*>[\s\S]*<\/h1>/.test(c);
      const hasP = /<p\b[^>]*>[\s\S]*<\/p>/.test(c);
      if (!hasH1) return { ok: false, msg: "Il manque un <h1>…</h1>." };
      if (!hasP) return { ok: false, msg: "Il manque un <p>…</p>." };
      return { ok: true, msg: "Nickel : tu as un titre et un paragraphe." };
    },
    xp: 25,
  },
  {
    id: "solo-css-01",
    track: "CSS",
    title: "Styliser un bouton",
    prompt: "Écris du CSS qui donne au bouton une padding et un border-radius.",
    starter: "button {\n  \n}\n",
    validate: (code) => {
      const c = normalize(code).toLowerCase();
      const hasPadding = /padding\s*:\s*[^;]+;/.test(c);
      const hasRadius = /border-radius\s*:\s*[^;]+;/.test(c);
      if (!hasPadding)
        return { ok: false, msg: "Ajoute une propriété padding: ...;" };
      if (!hasRadius)
        return { ok: false, msg: "Ajoute une propriété border-radius: ...;" };
      return { ok: true, msg: "Parfait : padding + border-radius détectés." };
    },
    xp: 25,
  },
  {
    id: "solo-js-01",
    track: "JavaScript",
    title: "Fonction add(a, b)",
    prompt: "Écris une fonction add(a, b) qui retourne a + b.",
    starter: "function add(a, b) {\n  // ton code\n}\n",
    validate: (code) => {
      // ⚠️ Exécution locale : pour un site public, on renforcera la sandbox plus tard.
      try {
        const fn = new Function(
          `${code}\nreturn typeof add === 'function' ? add : null;`
        );
        const add = fn();
        if (!add)
          return { ok: false, msg: "Je ne trouve pas de fonction add(a, b)." };
        const r1 = add(2, 3);
        const r2 = add(-1, 5);
        if (r1 !== 5 || r2 !== 4)
          return {
            ok: false,
            msg: "La fonction ne retourne pas le bon résultat.",
          };
        return { ok: true, msg: "Bravo : tests validés (2+3=5, -1+5=4)." };
      } catch (e) {
        return { ok: false, msg: `Erreur JS : ${e.message}` };
      }
    },
    xp: 30,
  },
];

function renderSolo() {
  const p = loadProgress();

  const items = SOLO_CHALLENGES.map((ch) => {
    const done = !!p.done[ch.id];
    return html`
      <div class="item">
        <div>
          <div><b>${escapeHtml(ch.track)}</b> — ${escapeHtml(ch.title)}</div>
          <small>${done ? "✅ Validé" : "⏳ À faire"} • +${ch.xp} XP</small>
        </div>
        <button class="btn" data-open-solo="${ch.id}">Ouvrir</button>
      </div>
    `;
  }).join("");

  main.innerHTML = html`
    <section class="card">
      <h2 class="h2">🧠 Mode Solo</h2>
      <p class="p">
        Ici, tu as un objectif. Tu écris du code, et le site teste
        automatiquement.
      </p>
      <div class="list">${items}</div>
      <div id="soloView" style="margin-top:14px;"></div>
    </section>
  `;

  main.querySelectorAll("[data-open-solo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-solo");
      const ch = SOLO_CHALLENGES.find((x) => x.id === id);
      openSolo(ch);
    });
  });

  function openSolo(ch) {
    const view = main.querySelector("#soloView");
    const already = !!loadProgress().done[ch.id];

    view.innerHTML = html`
      <div class="card" style="margin-top:14px;">
        <div
          class="item"
          style="border:none; background:transparent; padding:0;"
        >
          <div>
            <div><b>${escapeHtml(ch.track)}</b> — ${escapeHtml(ch.title)}</div>
            <small
              >${already ? "✅ Déjà validé" : "⏳ Pas encore validé"} •
              +${ch.xp} XP</small
            >
          </div>
        </div>

        <p class="p" style="margin-top:10px;">${escapeHtml(ch.prompt)}</p>

        <div class="card">
          <div class="muted" style="margin-bottom:8px;">Ton code</div>
          <textarea
            id="soloEditor"
            style="width:100%; min-height:180px; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06); color: inherit;"
          >
${escapeHtml(ch.starter)}</textarea
          >
        </div>

        <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" id="runSolo">Valider</button>
        </div>

        <div id="soloFeedback" class="p" style="margin-top:10px;"></div>
      </div>
    `;

    view.querySelector("#runSolo").addEventListener("click", () => {
      const fb = view.querySelector("#soloFeedback");
      const code = view.querySelector("#soloEditor").value;

      const result = ch.validate(code);
      if (result.ok) {
        const prog = markDone(ch.id, ch.xp);
        fb.textContent = `✅ Réussi ! ${result.msg} (+${ch.xp} XP, total ${prog.xp})`;
      } else {
        fb.textContent = `❌ ${result.msg}`;
      }
    });
  }
}

/* ---------------- PROFIL ---------------- */

function renderProfil() {
  const p = loadProgress();
  main.innerHTML = html`
    <section class="card">
      <h2 class="h2">👤 Profil</h2>
      <p class="p">Progression sauvegardée dans ton navigateur.</p>
      <div class="kpi">
        <span class="badge">XP : <b>${p.xp}</b></span>
        <span class="badge"
          >Validés : <b>${Object.keys(p.done).length}</b></span
        >
      </div>

      <div style="margin-top:12px;">
        <button class="btn" id="reset">Réinitialiser progression</button>
      </div>
    </section>
  `;

  main.querySelector("#reset").addEventListener("click", () => {
    localStorage.removeItem("codeplay_progress_v1");
    alert("Progression réinitialisée.");
    location.hash = "#/";
  });
}

/* ---------------- ROUTING ---------------- */

async function render() {
  const route = getRoute();
  setActiveNav("#" + route);

  try {
    if (route === "/") return renderHome();
    if (route === "/cours") return await renderCours();
    if (route === "/entrainement") return await renderEntrainement();
    if (route === "/solo") return renderSolo();
    if (route === "/profil") return renderProfil();

    main.innerHTML = `<section class="card"><h2 class="h2">Page introuvable</h2><p class="p">Retour à l'accueil.</p><a class="btn" href="#/">Accueil</a></section>`;
  } catch (e) {
    main.innerHTML = `<section class="card"><h2 class="h2">Erreur</h2><p class="p">${escapeHtml(
      e.message
    )}</p></section>`;
  }
}

onRouteChange(render);
