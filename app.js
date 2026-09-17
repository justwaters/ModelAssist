(function () {
  const els = {
    os: document.getElementById("os"),
    gpu: document.getElementById("gpu"),
    vram: document.getElementById("vram"),
    vramField: document.getElementById("vram-field"),
    ram: document.getElementById("ram"),
    disk: document.getElementById("disk"),
    cpu: document.getElementById("cpu"),
    npuNote: document.getElementById("npu-note"),
    chips: document.getElementById("usecase-chips"),
    count: document.getElementById("results-count") || document.getElementById("results-heading"),
    list: document.getElementById("results-list"),
    excludedWrap: document.getElementById("excluded-wrap"),
    excludedSummary: document.getElementById("excluded-summary"),
    excludedList: document.getElementById("excluded-list"),
  };

  const state = {
    selectedTags: new Set(),
  };

  const EXTERNAL_ICON = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4 2H2v8h8V8" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 1.5H10.5V5.5" stroke="currentColor" stroke-width="1.2"/><path d="M10.3 1.7 5.5 6.5" stroke="currentColor" stroke-width="1.2"/></svg>`;

  function buildChips() {
    els.chips.innerHTML = "";
    USE_CASES.forEach((uc) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = uc.label;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        if (state.selectedTags.has(uc.id)) {
          state.selectedTags.delete(uc.id);
          btn.setAttribute("aria-pressed", "false");
        } else {
          state.selectedTags.add(uc.id);
          btn.setAttribute("aria-pressed", "true");
        }
        render();
      });
      els.chips.appendChild(btn);
    });
  }

  function updateGpuField() {
    const gpu = els.gpu.value;
    if (gpu === "apple" || gpu === "none") {
      els.vramField.setAttribute("data-disabled", "true");
      els.vramField.querySelector("input").disabled = true;
    } else {
      els.vramField.removeAttribute("data-disabled");
      els.vramField.querySelector("input").disabled = false;
    }

    if (gpu === "apple") {
      els.npuNote.textContent =
        "Apple Silicon shares memory between CPU and GPU. We treat your system RAM (minus ~4 GB reserved for macOS) as available to the model.";
    } else if (gpu === "none") {
      els.npuNote.textContent =
        "Without a dedicated GPU, models run on your CPU using system RAM. It works, but expect noticeably slower generation than on a GPU.";
    } else {
      els.npuNote.textContent =
        "We check VRAM first for GPU speed, and fall back to system RAM (slower) for anything that doesn't fit in VRAM.";
    }
  }

  // Returns { effectiveGB, mode: 'gpu' | 'apple-unified' | 'cpu', cpuFallbackGB }
  function computeAvailability() {
    const gpu = els.gpu.value;
    const ram = parseFloat(els.ram.value) || 0;
    const vram = parseFloat(els.vram.value) || 0;
    const cpuFallbackGB = Math.max(ram - 4, 0);

    if (gpu === "apple") {
      return { effectiveGB: Math.max(ram - 4, 0), mode: "apple-unified", cpuFallbackGB: Math.max(ram - 4, 0) };
    }
    if (gpu === "none") {
      return { effectiveGB: cpuFallbackGB, mode: "cpu", cpuFallbackGB };
    }
    // dedicated GPU vendor selected
    return { effectiveGB: vram, mode: "gpu", cpuFallbackGB };
  }

  function pickTags() {
    return state.selectedTags;
  }

  function evaluate(model, availability, diskGB) {
    const selectedTags = pickTags();
    if (selectedTags.size > 0 && !model.tags.some((t) => selectedTags.has(t))) {
      return null; // filtered out by use case
    }

    // Try quants from largest file to smallest; pick the biggest one that fits.
    const sorted = [...model.quants].sort((a, b) => b.fileGB - a.fileGB);
    let best = null;

    for (const q of sorted) {
      const fitsMemory = q.requiredGB <= availability.effectiveGB;
      const fitsDisk = q.fileGB <= diskGB;
      if (fitsMemory && fitsDisk) {
        best = q;
        break;
      }
    }

    if (best) {
      const ratio = best.requiredGB / availability.effectiveGB;
      const status = ratio <= 0.75 ? "good" : "tight";
      return {
        model,
        quant: best,
        ratio,
        status,
        mode: availability.mode,
        missingGB: 0,
      };
    }

    // Nothing fit — report how far off the smallest quant is, for the excluded list.
    const smallest = sorted[sorted.length - 1];
    const memGap = Math.max(smallest.requiredGB - availability.effectiveGB, 0);
    const diskGap = Math.max(smallest.fileGB - diskGB, 0);
    return {
      model,
      quant: smallest,
      ratio: smallest.requiredGB / Math.max(availability.effectiveGB, 0.001),
      status: "over",
      mode: availability.mode,
      missingGB: memGap > 0 ? memGap : diskGap,
      missingKind: memGap > 0 ? "memory" : "disk",
    };
  }

  function speedNote(mode) {
    if (mode === "cpu") return "CPU only — expect slower generation";
    if (mode === "apple-unified") return "runs on Apple Silicon GPU";
    return "runs on GPU";
  }

  function renderBenchTable(model) {
    const benchmarks = model.benchmarks || [];
    if (benchmarks.length === 0) return "";
    const selectedTags = pickTags();
    const rows = benchmarks
      .map((b) => {
        const isMatch = selectedTags.size > 0 && selectedTags.has(b.area);
        return `
          <div class="bench-row${isMatch ? " bench-row--match" : ""}">
            <span class="bench-row__area">${b.area}</span>
            <span class="bench-row__name">${b.benchmark}</span>
            <span class="bench-row__score">${b.score}${b.note ? `<span class="bench-row__note">${b.note}</span>` : ""}</span>
          </div>`;
      })
      .join("");
    return `<div class="bench-table">${rows}</div>`;
  }

  function renderModelRow(result) {
    const { model, quant, ratio, status, mode } = result;
    const pct = Math.min(Math.round(ratio * 100), 100);
    const availableLabel = mode === "cpu" || mode === "apple-unified" ? "RAM" : "VRAM";

    const row = document.createElement("article");
    row.className = `model-row model-row--${status}`;

    row.innerHTML = `
      <div class="model-row__accent"></div>
      <div class="model-row__body">
        <div class="model-row__head">
          <h3>${model.name}<span class="params">${model.params}</span></h3>
          <div class="tags">${model.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        </div>
        <p class="model-row__blurb">${model.blurb}</p>
        <div class="model-row__spec">
          <span><span class="spec-label">quant</span>${quant.quant}</span>
          <span><span class="spec-label">file</span>${quant.fileGB.toFixed(1)} GB</span>
          <span><span class="spec-label">needs</span>~${quant.requiredGB.toFixed(1)} GB ${availableLabel}</span>
        </div>
        ${renderBenchTable(model)}
        <div class="fit-gauge">
          <div class="fit-gauge__track"><div class="fit-gauge__fill" style="width:${pct}%"></div></div>
          <span class="fit-gauge__label">${pct}% of your ${availableLabel} — ${speedNote(mode)}</span>
        </div>
        <div class="runtime-row">
          <span class="runtime-label">Run it with</span>
          ${model.runtimes.map((r) => `<span class="pill">${r}</span>`).join("")}
        </div>
        <div class="links-row">
          <a href="${model.links.github}" target="_blank" rel="noopener">GitHub ${EXTERNAL_ICON}</a>
          <a href="${model.links.huggingface}" target="_blank" rel="noopener">Hugging Face ${EXTERNAL_ICON}</a>
          <a href="${model.links.ollama}" target="_blank" rel="noopener">Ollama library ${EXTERNAL_ICON}</a>
        </div>
      </div>
    `;
    return row;
  }

  function renderExcludedRow(result) {
    const { model, quant, missingGB, missingKind } = result;
    const row = document.createElement("div");
    row.className = "excluded-row";
    const unit = missingKind === "disk" ? "disk space" : "memory";
    row.innerHTML = `
      <span class="name">${model.name} ${model.params} <span style="font-family:var(--font-mono)">(${quant.quant})</span></span>
      <span class="need">needs ~${missingGB.toFixed(1)} GB more ${unit}</span>
    `;
    return row;
  }

  function render() {
    const availability = computeAvailability();
    const diskGB = parseFloat(els.disk.value) || 0;

    const fitting = [];
    const excluded = [];

    MODELS.forEach((model) => {
      const result = evaluate(model, availability, diskGB);
      if (!result) return;
      if (result.status === "over") {
        excluded.push(result);
      } else {
        fitting.push(result);
      }
    });

    fitting.sort((a, b) => {
      if (a.status !== b.status) return a.status === "good" ? -1 : 1;
      return b.model.paramsB - a.model.paramsB;
    });

    els.list.innerHTML = "";

    if (fitting.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `<strong>Nothing here fits comfortably yet.</strong> Try a smaller use case, or free up memory — even 8&nbsp;GB opens up a few strong 3B–7B models.`;
      els.list.appendChild(empty);
    } else {
      fitting.forEach((r) => els.list.appendChild(renderModelRow(r)));
    }

    const heading = document.getElementById("results-heading");
    if (fitting.length > 0) {
      heading.textContent = `${fitting.length} model${fitting.length === 1 ? "" : "s"} fit your machine`;
    } else {
      heading.textContent = "No models fit yet";
    }

    if (excluded.length > 0) {
      excluded.sort((a, b) => a.missingGB - b.missingGB);
      els.excludedWrap.hidden = false;
      els.excludedSummary.textContent = `${excluded.length} more model${excluded.length === 1 ? "" : "s"} need more headroom`;
      els.excludedList.innerHTML = "";
      excluded.forEach((r) => els.excludedList.appendChild(renderExcludedRow(r)));
    } else {
      els.excludedWrap.hidden = true;
    }
  }

  function init() {
    buildChips();
    updateGpuField();
    render();

    ["change", "input"].forEach((evt) => {
      [els.os, els.gpu, els.vram, els.ram, els.disk].forEach((el) => {
        el.addEventListener(evt, () => {
          if (el === els.gpu) updateGpuField();
          render();
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
