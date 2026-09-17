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
    sortOptions: document.getElementById("sort-options"),
    usecaseFilters: document.getElementById("usecase-filters"),
    runtimeFilters: document.getElementById("runtime-filters"),
    showTight: document.getElementById("show-tight"),
    resetFilters: document.getElementById("reset-filters"),
    list: document.getElementById("results-list"),
    excludedWrap: document.getElementById("excluded-wrap"),
    excludedSummary: document.getElementById("excluded-summary"),
    excludedList: document.getElementById("excluded-list"),
  };

  const SORT_OPTIONS = [
    { id: "best", label: "Best fit for your machine" },
    { id: "headroom", label: "Most memory headroom" },
    { id: "smallest", label: "Smallest download" },
    { id: "largest", label: "Largest & most capable" },
    { id: "name", label: "Name (A–Z)" },
  ];

  const ALL_RUNTIMES = [...new Set(MODELS.flatMap((m) => m.runtimes))];

  const state = {
    sort: "best",
    selectedTags: new Set(),
    selectedRuntimes: new Set(ALL_RUNTIMES),
  };

  const EXTERNAL_ICON = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4 2H2v8h8V8" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 1.5H10.5V5.5" stroke="currentColor" stroke-width="1.2"/><path d="M10.3 1.7 5.5 6.5" stroke="currentColor" stroke-width="1.2"/></svg>`;

  function buildSortOptions() {
    els.sortOptions.innerHTML = "";
    SORT_OPTIONS.forEach((opt, i) => {
      const label = document.createElement("label");
      label.className = "filter-radio";
      label.innerHTML = `<input type="radio" name="sort" value="${opt.id}" ${i === 0 ? "checked" : ""} /><span>${opt.label}</span>`;
      label.querySelector("input").addEventListener("change", () => {
        state.sort = opt.id;
        render();
      });
      els.sortOptions.appendChild(label);
    });
  }

  function buildUseCaseFilters() {
    els.usecaseFilters.innerHTML = "";
    USE_CASES.forEach((uc) => {
      const label = document.createElement("label");
      label.className = "filter-check";
      label.innerHTML = `<input type="checkbox" value="${uc.id}" /><span>${uc.label}</span>`;
      label.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) state.selectedTags.add(uc.id);
        else state.selectedTags.delete(uc.id);
        render();
      });
      els.usecaseFilters.appendChild(label);
    });
  }

  function buildRuntimeFilters() {
    els.runtimeFilters.innerHTML = "";
    ALL_RUNTIMES.forEach((rt) => {
      const label = document.createElement("label");
      label.className = "filter-check";
      label.innerHTML = `<input type="checkbox" value="${rt}" checked /><span>${rt}</span>`;
      label.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) state.selectedRuntimes.add(rt);
        else state.selectedRuntimes.delete(rt);
        render();
      });
      els.runtimeFilters.appendChild(label);
    });
  }

  function resetFilters() {
    state.sort = "best";
    state.selectedTags = new Set();
    state.selectedRuntimes = new Set(ALL_RUNTIMES);

    els.sortOptions.querySelectorAll("input").forEach((input, i) => {
      input.checked = i === 0;
    });
    els.usecaseFilters.querySelectorAll("input").forEach((input) => {
      input.checked = false;
    });
    els.runtimeFilters.querySelectorAll("input").forEach((input) => {
      input.checked = true;
    });
    els.showTight.checked = true;

    render();
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
    if (state.selectedRuntimes.size > 0 && !model.runtimes.some((r) => state.selectedRuntimes.has(r))) {
      return null; // filtered out by runtime
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
      if (status === "tight" && els.showTight && !els.showTight.checked) {
        return null; // filtered out by fit-comfort setting
      }
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

  function sortFitting(fitting) {
    const sorted = fitting.slice();
    switch (state.sort) {
      case "headroom":
        return sorted.sort((a, b) => a.ratio - b.ratio);
      case "smallest":
        return sorted.sort((a, b) => a.quant.fileGB - b.quant.fileGB);
      case "largest":
        return sorted.sort((a, b) => b.model.paramsB - a.model.paramsB);
      case "name":
        return sorted.sort((a, b) => a.model.name.localeCompare(b.model.name) || a.model.paramsB - b.model.paramsB);
      case "best":
      default:
        return sorted.sort((a, b) => {
          if (a.status !== b.status) return a.status === "good" ? -1 : 1;
          return b.model.paramsB - a.model.paramsB;
        });
    }
  }

  // Very rough: CPU decode speed is bandwidth-bound, not compute-bound, so
  // tokens/sec ≈ (RAM bandwidth ÷ model file size), discounted for real-world overhead.
  const CPU_BANDWIDTH_GBPS = [
    { pattern: /threadripper|epyc|xeon/, gbps: 110 },
    { pattern: /ultra/, gbps: 800 },
    { pattern: /\bmax\b/, gbps: 400 },
    { pattern: /\bpro\b/, gbps: 150 },
  ];
  const CPU_REAL_WORLD_EFFICIENCY = 0.5;

  function cpuBandwidthGBps() {
    const text = (els.cpu.value || "").toLowerCase();
    const tier = CPU_BANDWIDTH_GBPS.find((t) => t.pattern.test(text));
    return tier ? tier.gbps : 50; // generic dual-channel desktop/laptop RAM
  }

  function estimateCpuTokensPerSec(fileGB) {
    const effectiveGBps = cpuBandwidthGBps() * CPU_REAL_WORLD_EFFICIENCY;
    return effectiveGBps / fileGB;
  }

  function speedNote(mode, quant) {
    if (mode === "cpu") {
      const tps = estimateCpuTokensPerSec(quant.fileGB);
      const label = tps >= 10 ? Math.round(tps) : tps.toFixed(1);
      return `CPU only — roughly ${label} tok/s`;
    }
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
            <span class="bench-row__score">${b.score}${b.secondary ? '<sup class="bench-row__flag" title="From another model’s published comparison table, not this model’s own card">†</sup>' : ""}${b.note ? `<span class="bench-row__note">${b.note}</span>` : ""}</span>
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
          <span class="fit-gauge__label">${pct}% of your ${availableLabel} — ${speedNote(mode, quant)}</span>
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

    const sortedFitting = sortFitting(fitting);

    els.list.innerHTML = "";

    if (sortedFitting.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = `<strong>Nothing here fits comfortably yet.</strong> Try loosening a filter, or free up memory — even 8&nbsp;GB opens up a few strong 3B–7B models.`;
      els.list.appendChild(empty);
    } else {
      sortedFitting.forEach((r) => els.list.appendChild(renderModelRow(r)));
    }

    const heading = document.getElementById("results-heading");
    if (sortedFitting.length > 0) {
      heading.textContent = `${sortedFitting.length} model${sortedFitting.length === 1 ? "" : "s"} fit your machine`;
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
    buildSortOptions();
    buildUseCaseFilters();
    buildRuntimeFilters();
    updateGpuField();
    render();

    els.showTight.addEventListener("change", render);
    els.resetFilters.addEventListener("click", resetFilters);

    ["change", "input"].forEach((evt) => {
      [els.os, els.gpu, els.vram, els.ram, els.disk, els.cpu].forEach((el) => {
        el.addEventListener(evt, () => {
          if (el === els.gpu) updateGpuField();
          render();
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
