(() => {
  const BODY_KG = 70;
  const STORE_KEY = "demi_fittrack_v1";

  const walkingTempos = [
    { label: "Slow", met: 2.5, description: "~3 km/h stroll" },
    { label: "Easy", met: 3.0, description: "~4 km/h casual" },
    { label: "Moderate", met: 3.5, description: "~5 km/h" },
    { label: "Brisk", met: 4.3, description: "~6 km/h" },
    { label: "Power", met: 5.0, description: "~7 km/h power walk" },
  ];

  const runningTempos = [
    { label: "Easy jog", met: 7.0, description: "~7–8 km/h" },
    { label: "Moderate", met: 8.5, description: "~9–10 km/h" },
    { label: "Fast", met: 10.0, description: "~11–12 km/h" },
    { label: "Hard", met: 11.5, description: "~13+ km/h" },
  ];

  const exercises = [
    "Walking", "Running", "Bench Press", "Squat", "Deadlift", "Pull-ups",
    "Shoulder Press", "Rows", "Lunges", "Push-ups", "Biceps Curl",
    "Triceps Extension", "Plank", "Burpees", "Cycling", "Jump Rope",
  ].sort((a, b) => a.localeCompare(b));

  const strengthMet = {
    "Bench Press": 5, Squat: 6, Deadlift: 6.5, "Pull-ups": 5.5,
    "Shoulder Press": 5, Rows: 5, Lunges: 5.5, "Push-ups": 4.5,
    "Biceps Curl": 3.5, "Triceps Extension": 3.5, Plank: 3, Burpees: 8,
    Cycling: 6.5, "Jump Rope": 8.5,
  };

  const foods = [
    { name: "Banana", cal: 105, unit: "piece", countable: true },
    { name: "Apple", cal: 95, unit: "piece", countable: true },
    { name: "Orange", cal: 62, unit: "piece", countable: true },
    { name: "Egg", cal: 70, unit: "egg", countable: true },
    { name: "Bread", cal: 80, unit: "slice", countable: true },
    { name: "Chicken breast", cal: 165, unit: "serving", countable: false },
    { name: "Rice", cal: 206, unit: "cup", countable: false },
    { name: "Pasta", cal: 220, unit: "cup", countable: false },
    { name: "Salad", cal: 150, unit: "bowl", countable: false },
    { name: "Pizza", cal: 285, unit: "slice", countable: true },
    { name: "Burger", cal: 540, unit: "piece", countable: true },
    { name: "Yogurt", cal: 100, unit: "cup", countable: false },
    { name: "Milk", cal: 120, unit: "cup", countable: false },
    { name: "Protein shake", cal: 160, unit: "serving", countable: false },
    { name: "Oatmeal", cal: 150, unit: "cup", countable: false },
    { name: "Salmon", cal: 208, unit: "serving", countable: false },
    { name: "Potato", cal: 160, unit: "piece", countable: true },
    { name: "Avocado", cal: 240, unit: "piece", countable: true },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const state = load() || { workouts: [], meals: [] };
  let tab = "log";
  let quantity = 1;

  const $ = (sel) => document.querySelector(sel);
  const screen = $("#screen");
  const splash = $("#splash");
  const app = $("#app");
  const audio = $("#startupAudio");

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); }
    catch { return null; }
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function isCardio(name) {
    const n = (name || "").toLowerCase();
    return n === "walking" || n === "running";
  }

  function temposFor(name) {
    const n = (name || "").toLowerCase();
    if (n === "walking") return walkingTempos;
    if (n === "running") return runningTempos;
    return [];
  }

  function estimateStrength(name, sets, reps, kg) {
    if (!name || sets <= 0 || reps <= 0 || kg < 0) return 0;
    const met = strengthMet[name] || 4.5;
    const minutes = (sets * reps * 3 + Math.max(0, sets - 1) * 40) / 60;
    const hours = minutes / 60;
    return Math.max(1, Math.round(met * BODY_KG * hours + sets * reps * kg * 0.012));
  }

  function estimateCardio(name, minutes, tempoLabel) {
    if (!name || minutes <= 0) return 0;
    const tempo = temposFor(name).find((t) => t.label === tempoLabel);
    const met = tempo ? tempo.met : (name.toLowerCase() === "running" ? 8.5 : 3.5);
    return Math.max(1, Math.round(met * BODY_KG * (minutes / 60)));
  }

  function suggestExercises(q) {
    const query = (q || "").trim().toLowerCase();
    if (!query) return [];
    const priority = ["Walking", "Running"].filter((e) => e.toLowerCase().startsWith(query));
    const rest = exercises.filter((e) => e.toLowerCase().includes(query));
    return [...new Set([...priority, ...rest])].slice(0, 8);
  }

  function searchFoods(q) {
    const query = (q || "").trim().toLowerCase();
    if (!query) return [];
    return foods.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 12);
  }

  function render() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    if (tab === "log") renderLog();
    if (tab === "meals") renderMeals();
    if (tab === "history") renderHistory();
    if (tab === "progress") renderProgress();
  }

  function renderLog() {
    screen.innerHTML = `
      <section class="card">
        <h2>Add workout</h2>
        <div class="row-2">
          <button type="button" class="chip" data-pick="Walking">Walking</button>
          <button type="button" class="chip" data-pick="Running">Running</button>
        </div>
        <label>Exercise
          <input id="exercise" placeholder="Walking, Running, Bench Press…" autocomplete="off" />
        </label>
        <div id="exSuggestions" class="suggestions hidden"></div>
        <div id="strengthFields" class="row">
          <label>Sets<input id="sets" type="number" min="1" value="3" /></label>
          <label>Reps<input id="reps" type="number" min="1" value="10" /></label>
          <label>Kg<input id="kg" type="number" min="0" step="0.5" value="20" /></label>
        </div>
        <div id="cardioFields" class="hidden">
          <label>Duration (minutes)
            <input id="duration" type="number" min="1" value="30" />
          </label>
          <div id="tempoList" class="list" style="margin-top:0.5rem"></div>
        </div>
        <div class="estimate" id="estimate">Est. calories: enter details</div>
        <button class="btn primary" id="saveWorkout">Save workout</button>
      </section>
    `;

    const exerciseInput = $("#exercise");
    const strengthFields = $("#strengthFields");
    const cardioFields = $("#cardioFields");
    const tempoList = $("#tempoList");
    const estimate = $("#estimate");
    const suggestions = $("#exSuggestions");
    let selectedTempo = "";

    function syncMode() {
      const name = exerciseInput.value.trim();
      const cardio = isCardio(name);
      strengthFields.classList.toggle("hidden", cardio);
      cardioFields.classList.toggle("hidden", !cardio);
      document.querySelectorAll("[data-pick]").forEach((c) => {
        c.classList.toggle("active", c.dataset.pick.toLowerCase() === name.toLowerCase());
      });
      if (cardio) {
        const tempos = temposFor(name);
        if (!tempos.some((t) => t.label === selectedTempo)) {
          selectedTempo = tempos[0]?.label || "";
        }
        tempoList.innerHTML = tempos.map((t) => `
          <button type="button" class="chip ${selectedTempo === t.label ? "active" : ""}" data-tempo="${t.label}">
            <strong>${t.label}</strong><br/><span class="meta">${t.description}</span>
          </button>
        `).join("");
        tempoList.querySelectorAll("[data-tempo]").forEach((btn) => {
          btn.addEventListener("click", () => {
            selectedTempo = btn.dataset.tempo;
            syncMode();
            updateEstimate();
          });
        });
      }
      updateEstimate();
    }

    function updateEstimate() {
      const name = exerciseInput.value.trim();
      let kcal = 0;
      if (isCardio(name)) {
        kcal = estimateCardio(name, Number($("#duration").value), selectedTempo);
      } else {
        kcal = estimateStrength(
          name,
          Number($("#sets").value),
          Number($("#reps").value),
          Number($("#kg").value)
        );
      }
      estimate.textContent = kcal > 0
        ? `Est. calories: ~${kcal} kcal`
        : "Est. calories: enter details";
    }

    function setExercise(name) {
      exerciseInput.value = name;
      suggestions.classList.add("hidden");
      syncMode();
    }

    document.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => setExercise(btn.dataset.pick));
    });

    exerciseInput.addEventListener("input", () => {
      const q = exerciseInput.value;
      const matches = suggestExercises(q);
      if (q.length === 1 && matches.length) {
        setExercise(matches[0]);
        exerciseInput.setSelectionRange(1, matches[0].length);
        return;
      }
      if (matches.length && q.trim()) {
        suggestions.classList.remove("hidden");
        suggestions.innerHTML = matches.map((m) =>
          `<button type="button" data-s="${m}">${m}</button>`
        ).join("");
        suggestions.querySelectorAll("button").forEach((b) => {
          b.addEventListener("click", () => setExercise(b.dataset.s));
        });
      } else {
        suggestions.classList.add("hidden");
      }
      syncMode();
    });

    ["sets", "reps", "kg", "duration"].forEach((id) => {
      screen.addEventListener("input", (e) => {
        if (e.target.id === id) updateEstimate();
      });
    });

    $("#saveWorkout").addEventListener("click", () => {
      const name = exerciseInput.value.trim();
      if (!name) return toast("Enter an exercise");
      let entry;
      if (isCardio(name)) {
        const minutes = Number($("#duration").value);
        if (minutes <= 0 || !selectedTempo) return toast("Set duration and tempo");
        const kcal = estimateCardio(name, minutes, selectedTempo);
        entry = {
          id: uid(),
          exercise: name,
          isCardio: true,
          durationMinutes: minutes,
          tempo: selectedTempo,
          caloriesBurned: kcal,
          createdAt: Date.now(),
        };
      } else {
        const sets = Number($("#sets").value);
        const reps = Number($("#reps").value);
        const kg = Number($("#kg").value);
        if (sets <= 0 || reps <= 0 || kg < 0) return toast("Enter valid sets/reps/kg");
        const kcal = estimateStrength(name, sets, reps, kg);
        entry = {
          id: uid(),
          exercise: name,
          isCardio: false,
          sets, reps, weightKg: kg,
          caloriesBurned: kcal,
          createdAt: Date.now(),
        };
      }
      state.workouts.unshift(entry);
      save();
      toast(`Saved · ~${entry.caloriesBurned} kcal`);
      tab = "history";
      render();
    });

    syncMode();
  }

  function renderMeals() {
    screen.innerHTML = `
      <section class="card">
        <h2>Search foods</h2>
        <label>Food
          <input id="foodQuery" placeholder="banana, chicken, pizza…" />
        </label>
        <div>
          <div class="meta" style="margin-bottom:0.4rem">Amount</div>
          <div class="stepper">
            <button class="btn ghost" id="qtyMinus">−</button>
            <div style="text-align:center">
              <div class="qty" id="qtyVal">${quantity}</div>
              <div class="meta">pieces / servings</div>
            </div>
            <button class="btn ghost" id="qtyPlus">+</button>
          </div>
        </div>
        <div id="foodResults" class="list"></div>
      </section>
      <section class="card">
        <h2>Logged meals</h2>
        <div id="mealList" class="list"></div>
      </section>
    `;

    const results = $("#foodResults");
    const mealList = $("#mealList");
    const queryInput = $("#foodQuery");

    function paintQuantity() {
      $("#qtyVal").textContent = String(quantity);
      paintResults(queryInput.value);
    }

    function paintResults(q) {
      const matches = searchFoods(q);
      if (!q.trim()) {
        results.innerHTML = `<p class="meta">Type a food name</p>`;
        return;
      }
      if (!matches.length) {
        results.innerHTML = `<p class="meta">No matches</p>`;
        return;
      }
      results.innerHTML = matches.map((f) => {
        const total = f.cal * quantity;
        const unit = quantity === 1 ? f.unit : `${f.unit}s`;
        return `
          <div class="item">
            <div>
              <strong>${f.name}</strong>
              <div class="meta">${total} kcal · ${quantity} ${unit}</div>
            </div>
            <button data-food="${f.name}" data-cal="${f.cal}" data-unit="${f.unit}">Save</button>
          </div>
        `;
      }).join("");
      results.querySelectorAll("[data-food]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const cal = Number(btn.dataset.cal) * quantity;
          state.meals.unshift({
            id: uid(),
            name: btn.dataset.food,
            calories: cal,
            servingInfo: `${quantity} ${btn.dataset.unit}${quantity > 1 ? "s" : ""}`,
            createdAt: Date.now(),
          });
          save();
          toast(`Saved ${btn.dataset.food} · ${cal} kcal`);
          paintMeals();
        });
      });
    }

    function paintMeals() {
      if (!state.meals.length) {
        mealList.innerHTML = `<p class="meta">No meals yet</p>`;
        return;
      }
      mealList.innerHTML = state.meals.map((m) => `
        <div class="item">
          <div>
            <strong>${m.name}</strong>
            <div class="meta">${m.calories} kcal · ${m.servingInfo}</div>
          </div>
          <button data-del="${m.id}">Delete</button>
        </div>
      `).join("");
      mealList.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.meals = state.meals.filter((m) => m.id !== btn.dataset.del);
          save();
          paintMeals();
        });
      });
    }

    $("#qtyMinus").addEventListener("click", () => {
      quantity = Math.max(1, quantity - 1);
      paintQuantity();
    });
    $("#qtyPlus").addEventListener("click", () => {
      quantity = Math.min(99, quantity + 1);
      paintQuantity();
    });
    queryInput.addEventListener("input", () => paintResults(queryInput.value));
    paintResults("");
    paintMeals();
  }

  function renderHistory() {
    const fmt = (ts) => new Date(ts).toLocaleString();
    screen.innerHTML = `
      <section class="card">
        <h2>Workouts</h2>
        <div class="list">
          ${state.workouts.length ? state.workouts.map((w) => `
            <div class="item">
              <div>
                <strong>${w.exercise}</strong>
                <div class="meta">
                  ${w.isCardio
                    ? `${w.durationMinutes} min · ${w.tempo}`
                    : `${w.sets} sets × ${w.reps} reps · ${w.weightKg} kg`}
                </div>
                <div class="meta">~${w.caloriesBurned} kcal · ${fmt(w.createdAt)}</div>
              </div>
              <button data-delw="${w.id}">Delete</button>
            </div>
          `).join("") : `<p class="meta">No workouts yet</p>`}
        </div>
      </section>
      <section class="card">
        <h2>Meals</h2>
        <div class="list">
          ${state.meals.length ? state.meals.map((m) => `
            <div class="item">
              <div>
                <strong>${m.name}</strong>
                <div class="meta">${m.calories} kcal · ${m.servingInfo}</div>
                <div class="meta">${fmt(m.createdAt)}</div>
              </div>
              <button data-delm="${m.id}">Delete</button>
            </div>
          `).join("") : `<p class="meta">No meals yet</p>`}
        </div>
      </section>
    `;
    screen.querySelectorAll("[data-delw]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.workouts = state.workouts.filter((w) => w.id !== btn.dataset.delw);
        save();
        renderHistory();
      });
    });
    screen.querySelectorAll("[data-delm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.meals = state.meals.filter((m) => m.id !== btn.dataset.delm);
        save();
        renderHistory();
      });
    });
  }

  function renderProgress() {
    const burned = state.workouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
    const eaten = state.meals.reduce((s, m) => s + (m.calories || 0), 0);
    screen.innerHTML = `
      <div class="stat"><span>Calories burned</span><strong>~${burned} kcal</strong></div>
      <div class="stat"><span>Calories eaten</span><strong>~${eaten} kcal</strong></div>
      <div class="stat"><span>Net (eaten − burned)</span><strong>~${eaten - burned} kcal</strong></div>
      <div class="stat"><span>Workouts</span><strong>${state.workouts.length}</strong></div>
      <div class="stat"><span>Meals</span><strong>${state.meals.length}</strong></div>
    `;
  }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      tab = btn.dataset.tab;
      render();
    });
  });

  $("#enterBtn").addEventListener("click", async () => {
    try {
      audio.currentTime = 0;
      await audio.play();
    } catch (_) {
      // iPhone may still block; ignore
    }
    splash.classList.add("hidden");
    app.classList.remove("hidden");
    render();
  });
})();
