// Ordered list of difficulty factors the driver can rank (1 = hardest, N = easiest)
let preferenceOrder = [
  "distance",
  "weight",
  "stairs",
  "traffic",
  "parking",
];

function loadPreferenceOrder() {
  const stored = localStorage.getItem("driverPreferenceOrder");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === preferenceOrder.length) {
        preferenceOrder = parsed;
      }
    } catch {
      // ignore parse errors and keep default
    }
  }
}

function renderPreferenceList() {
  loadPreferenceOrder();
  const container = document.getElementById("prefList");
  if (!container) return;

  const labels = {
    distance: "Long Distance (>15km)",
    weight: "Heavy Packages (>20kg)",
    stairs: "Climbing Stairs (>3 floors)",
    traffic: "Heavy Traffic",
    parking: "No / Difficult Parking",
  };

  const subs = {
    distance: "How stressful are long routes for you?",
    weight: "Handling heavy loads compared to other tasks.",
    stairs: "Multiple floors without good elevator access.",
    traffic: "Dense city traffic and congestion.",
    parking: "Searching for a parking spot or walking far.",
  };

  container.innerHTML = "";

  preferenceOrder.forEach((key, idx) => {
    const row = document.createElement("div");
    row.className = "pref-row";
    row.dataset.key = key;

    const main = document.createElement("div");
    main.className = "pref-main";

    const title = document.createElement("div");
    title.className = "pref-title";
    title.textContent = labels[key] || key;

    const subtitle = document.createElement("div");
    subtitle.className = "pref-sub";
    subtitle.textContent = subs[key] || "";

    const badge = document.createElement("span");
    badge.className = "pref-rank-badge";
    badge.textContent = `Rank ${idx + 1} (1 = hardest)`;

    main.appendChild(title);
    main.appendChild(subtitle);

    const controls = document.createElement("div");
    controls.className = "pref-controls";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "pref-move-btn";
    upBtn.textContent = "↑";
    upBtn.onclick = function () {
      movePreference(key, -1);
    };

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "pref-move-btn";
    downBtn.textContent = "↓";
    downBtn.onclick = function () {
      movePreference(key, 1);
    };

    controls.appendChild(badge);
    controls.appendChild(upBtn);
    controls.appendChild(downBtn);

    row.appendChild(main);
    row.appendChild(controls);
    container.appendChild(row);
  });
}

function movePreference(key, delta) {
  const index = preferenceOrder.indexOf(key);
  if (index === -1) return;

  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= preferenceOrder.length) return;

  const temp = preferenceOrder[newIndex];
  preferenceOrder[newIndex] = key;
  preferenceOrder[index] = temp;

  renderPreferenceList();
}

function savePreference() {
  localStorage.setItem(
    "driverPreferenceOrder",
    JSON.stringify(preferenceOrder)
  );
  alert(
    "Preference ranking saved. The system will treat the top‑ranked factors as hardest for you, but still keep total monthly points fair."
  );
}

function showExplanation() {
  const stored = localStorage.getItem("difficultyContext");
  const base = Number(localStorage.getItem("basePoints")) || 0;
  const context = stored ? JSON.parse(stored) : null;

  loadPreferenceOrder();

  // Use top 2 factors as strongest preferences
  const hardest = preferenceOrder[0];
  const secondHardest = preferenceOrder[1];

  let adjustment = 0;

  if (context) {
    const factorIsHeavy = (factor) => {
      switch (factor) {
        case "stairs":
          return context.stairs > 30;
        case "traffic":
          return context.traffic === "high";
        case "parking":
          return context.parking === "difficult" || context.parking === "none";
        case "weight":
          return context.weight > 20;
        case "distance":
          return context.distance > 15;
        default:
          return false;
      }
    };

    if (factorIsHeavy(hardest)) {
      adjustment += 3;
    }
    if (factorIsHeavy(secondHardest)) {
      adjustment += 2;
    }
  }

  // Cap preference impact to keep it a small share of total difficulty
  if (adjustment > base * 0.25) {
    adjustment = Math.round(base * 0.25);
  }

  const final = base + adjustment;

  document.getElementById("assignText").innerText =
    "Final Points Assigned: " + final;

  alert(
    `Base AI difficulty points for this route: ${base}\n` +
      `Your difficulty ranking (hardest → easiest): ${preferenceOrder.join(
        " > "
      )}\n` +
      `Preference‑based soft adjustment: +${adjustment}\n` +
      `Final points counted for fairness: ${final}\n\n` +
      `Explanation:\n` +
      `• The base points come from the trained model (distance, stairs, building type, elevator, parking, traffic).\n` +
      `• Your ranking tells the backend which kinds of routes to avoid giving you too often.\n` +
      `• The adjustment is capped so that even with preferences, monthly totals stay balanced across drivers.`
  );
}

// Initial render
renderPreferenceList();
