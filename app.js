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
    familyFilters: document.getElementById("family-filters"),
    runtimeFilters: document.getElementById("runtime-filters"),
    showTight: document.getElementById("show-tight"),
    disableSystemReserve: document.getElementById("disable-system-reserve"),
    resetFilters: document.getElementById("reset-filters"),
    list: document.getElementById("results-list"),
    excludedWrap: document.getElementById("excluded-wrap"),
    excludedSummary: document.getElementById("excluded-summary"),
    excludedList: document.getElementById("excluded-list"),
    compareTray: document.getElementById("compare-tray"),
    compareTrayItems: document.getElementById("compare-tray-items"),
    compareClear: document.getElementById("compare-clear"),
    compareOpen: document.getElementById("compare-open"),
    compareOverlay: document.getElementById("compare-overlay"),
    compareClose: document.getElementById("compare-close"),
    compareBody: document.getElementById("compare-body"),
    filterPane: document.querySelector(".filter-pane"),
    mobileFilterFab: document.getElementById("mobile-filter-fab"),
    mobileFilterBadge: document.getElementById("mobile-filter-badge"),
    filterSheetBackdrop: document.getElementById("filter-sheet-backdrop"),
    filterSheetDone: document.getElementById("filter-sheet-done"),
  };

  const MAX_COMPARE = 4;

  const SORT_OPTIONS = [
    { id: "best", label: "Best fit for your machine" },
    { id: "headroom", label: "Most memory headroom" },
    { id: "smallest", label: "Smallest download" },
    { id: "largest", label: "Largest & most capable" },
    { id: "name", label: "Name (A–Z)" },
  ];

  const ALL_RUNTIMES = [...new Set(MODELS.flatMap((m) => m.runtimes))];
  const ALL_FAMILIES = [...new Set(MODELS.map((m) => m.family))].sort((a, b) => a.localeCompare(b));

  const state = {
    sort: "best",
    selectedTags: new Set(),
    selectedRuntimes: new Set(ALL_RUNTIMES),
    selectedFamilies: new Set(ALL_FAMILIES),
    compareSet: new Set(),
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

  function buildFamilyFilters() {
    els.familyFilters.innerHTML = "";
    ALL_FAMILIES.forEach((name) => {
      const label = document.createElement("label");
      label.className = "filter-check";
      label.innerHTML = `<input type="checkbox" value="${name}" checked /><span>${name}</span>`;
      label.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) state.selectedFamilies.add(name);
        else state.selectedFamilies.delete(name);
        render();
      });
      els.familyFilters.appendChild(label);
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
    state.selectedFamilies = new Set(ALL_FAMILIES);

    els.sortOptions.querySelectorAll("input").forEach((input, i) => {
      input.checked = i === 0;
    });
    els.usecaseFilters.querySelectorAll("input").forEach((input) => {
      input.checked = false;
    });
    els.familyFilters.querySelectorAll("input").forEach((input) => {
      input.checked = true;
    });
    els.runtimeFilters.querySelectorAll("input").forEach((input) => {
      input.checked = true;
    });
    els.showTight.checked = true;
    els.disableSystemReserve.checked = false;

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
    const reserve = els.disableSystemReserve.checked ? 0 : 4;
    const cpuFallbackGB = Math.max(ram - reserve, 0);

    if (gpu === "apple") {
      return { effectiveGB: Math.max(ram - reserve, 0), mode: "apple-unified", cpuFallbackGB: Math.max(ram - reserve, 0) };
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

  // Pure fit computation — no use-case/runtime/tight-fit filtering. Used by both the
  // filtered results list (via evaluate()) and the compare view, which ignores filters
  // since a model added to compare should always show its real fit.
  function computeFit(model, availability, diskGB) {
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

  // Applies use-case/runtime/tight-fit filters on top of computeFit() — used for the
  // main results list. The compare view calls computeFit() directly, bypassing filters.
  function evaluate(model, availability, diskGB) {
    const selectedTags = pickTags();
    if (selectedTags.size > 0 && !model.tags.some((t) => selectedTags.has(t))) {
      return null; // filtered out by use case
    }
    if (state.selectedRuntimes.size > 0 && !model.runtimes.some((r) => state.selectedRuntimes.has(r))) {
      return null; // filtered out by runtime
    }
    if (state.selectedFamilies.size > 0 && !state.selectedFamilies.has(model.family)) {
      return null; // filtered out by family
    }
    const fit = computeFit(model, availability, diskGB);
    if (fit.status === "tight" && els.showTight && !els.showTight.checked) {
      return null; // filtered out by fit-comfort setting
    }
    return fit;
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

  function formatContext(tokens) {
    if (!tokens) return "—";
    if (tokens % 1024 === 0) return `${tokens / 1024}K tokens`;
    return `${Math.round(tokens / 1000)}K tokens`;
  }

  function renderBenchTable(model) {
    const benchmarks = model.benchmarks || [];
    if (benchmarks.length === 0) return "";
    const selectedTags = pickTags();
    const pills = benchmarks
      .map((b) => {
        const isMatch = selectedTags.size > 0 && selectedTags.has(b.area);
        return `
          <span class="bench-pill${isMatch ? " bench-pill--match" : ""}" title="${b.area}">
            ${b.benchmark} <b>${b.score}</b>${b.secondary ? '<sup class="bench-pill__flag" title="From another model’s published comparison table, not this model’s own card">†</sup>' : ""}${b.note ? `<span class="bench-pill__note">${b.note}</span>` : ""}
          </span>`;
      })
      .join("");
    return `<div class="bench-table">${pills}</div>`;
  }

  function renderModelRow(result) {
    const { model, quant, ratio, status, mode } = result;
    const pct = Math.min(Math.round(ratio * 100), 100);
    const availableLabel = mode === "cpu" || mode === "apple-unified" ? "RAM" : "VRAM";
    const isCompared = state.compareSet.has(model.id);
    const compareDisabled = !isCompared && state.compareSet.size >= MAX_COMPARE;
    const installCmd = model.ollamaTag ? `ollama pull ${model.ollamaTag}` : "";

    const row = document.createElement("article");
    row.className = `model-row model-row--${status}`;

    row.innerHTML = `
      <div class="model-row__accent"></div>
      <div class="model-row__body">
        <div class="model-row__head">
          <h3>${model.name}<span class="params">${model.params}</span></h3>
          <div class="model-row__meta">
            <div class="tags">${model.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
            <label class="compare-toggle">
              <input type="checkbox" data-compare-id="${model.id}" ${isCompared ? "checked" : ""} ${compareDisabled ? "disabled" : ""} />
              <span>Compare</span>
            </label>
          </div>
        </div>
        <p class="model-row__blurb">${model.blurb}</p>
        <div class="model-row__spec">
          <span><span class="spec-label">quant</span>${quant.quant}</span>
          <span><span class="spec-label">file</span>${quant.fileGB.toFixed(1)} GB</span>
          <span><span class="spec-label">needs</span>~${quant.requiredGB.toFixed(1)} GB ${availableLabel}</span>
          <span><span class="spec-label">context</span>${formatContext(model.context)}</span>
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
        ${installCmd ? `
        <div class="install-row">
          <code class="install-cmd">${installCmd}</code>
          <button type="button" class="copy-btn" data-copy="${installCmd}">Copy</button>
        </div>` : ""}
        <div class="links-row">
          <a href="${model.links.github}" target="_blank" rel="noopener">GitHub ${EXTERNAL_ICON}</a>
          <a href="${model.links.huggingface}" target="_blank" rel="noopener">Hugging Face ${EXTERNAL_ICON}</a>
          ${model.links.ollama ? `<a href="${model.links.ollama}" target="_blank" rel="noopener">Ollama library ${EXTERNAL_ICON}</a>` : ""}
        </div>
      </div>
    `;

    row.querySelector("[data-compare-id]").addEventListener("change", (e) => {
      toggleCompare(model.id, e.target.checked);
    });

    const copyBtn = row.querySelector(".copy-btn");
    if (copyBtn) copyBtn.addEventListener("click", () => copyInstallCmd(copyBtn));

    return row;
  }

  function copyInstallCmd(btn) {
    const text = btn.dataset.copy;
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = "Copied";
      btn.classList.add("is-copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("is-copied");
      }, 1500);
    });
  }

  function toggleCompare(id, checked) {
    if (checked) {
      if (state.compareSet.size >= MAX_COMPARE) return;
      state.compareSet.add(id);
    } else {
      state.compareSet.delete(id);
    }
    updateCompareCheckboxes();
    renderCompareTray();
  }

  // Keeps every rendered compare checkbox in sync with state (checked + disabled-at-cap),
  // without a full results re-render — toggling compare shouldn't reshuffle the list.
  function updateCompareCheckboxes() {
    els.list.querySelectorAll("[data-compare-id]").forEach((input) => {
      const id = input.dataset.compareId;
      const checked = state.compareSet.has(id);
      input.checked = checked;
      input.disabled = !checked && state.compareSet.size >= MAX_COMPARE;
    });
  }

  function renderCompareTray() {
    const ids = [...state.compareSet];
    els.compareTray.hidden = ids.length === 0;
    els.mobileFilterFab.classList.toggle("is-above-tray", ids.length > 0);
    if (ids.length === 0) return;

    els.compareTrayItems.innerHTML = ids
      .map((id) => {
        const model = MODELS.find((m) => m.id === id);
        return `
          <span class="compare-chip">
            ${model.name} ${model.params}
            <button type="button" data-remove-id="${id}" aria-label="Remove ${model.name} ${model.params} from comparison">&times;</button>
          </span>`;
      })
      .join("");

    els.compareTrayItems.querySelectorAll("[data-remove-id]").forEach((btn) => {
      btn.addEventListener("click", () => toggleCompare(btn.dataset.removeId, false));
    });

    els.compareOpen.disabled = ids.length < 2;
    els.compareOpen.textContent = ids.length < 2 ? "Select 1 more to compare" : `Compare ${ids.length} models`;
  }

  // Two independent fixed overlays (compare + mobile filter sheet) can each
  // want the body scroll locked. Track how many are open so closing one
  // doesn't unlock scroll while the other is still showing.
  const openOverlays = new Set();
  function lockBodyScroll(id) {
    openOverlays.add(id);
    document.body.style.overflow = "hidden";
  }
  function unlockBodyScroll(id) {
    openOverlays.delete(id);
    if (openOverlays.size === 0) document.body.style.overflow = "";
  }

  function openFilterSheet() {
    els.filterPane.classList.add("is-open");
    els.filterSheetBackdrop.hidden = false;
    lockBodyScroll("filters");
  }
  function closeFilterSheet() {
    els.filterPane.classList.remove("is-open");
    els.filterSheetBackdrop.hidden = true;
    unlockBodyScroll("filters");
  }

  function updateFilterBadge() {
    const activeCount =
      state.selectedTags.size +
      (ALL_FAMILIES.length - state.selectedFamilies.size) +
      (ALL_RUNTIMES.length - state.selectedRuntimes.size) +
      (state.sort !== "best" ? 1 : 0) +
      (els.showTight && !els.showTight.checked ? 1 : 0) +
      (els.disableSystemReserve && els.disableSystemReserve.checked ? 1 : 0);
    els.mobileFilterBadge.hidden = activeCount === 0;
    els.mobileFilterBadge.textContent = activeCount;
  }

  function openCompareOverlay() {
    const availability = computeAvailability();
    const diskGB = parseFloat(els.disk.value) || 0;
    const ids = [...state.compareSet];
    const models = ids.map((id) => MODELS.find((m) => m.id === id));
    const fits = models.map((m) => computeFit(m, availability, diskGB));

    document.getElementById("compare-title").textContent = `Comparing ${models.length} models`;
    els.compareBody.innerHTML = buildCompareTable(models, fits, availability);
    els.compareBody.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => copyInstallCmd(btn));
    });

    els.compareOverlay.hidden = false;
    lockBodyScroll("compare");
  }

  function closeCompareOverlay() {
    els.compareOverlay.hidden = true;
    unlockBodyScroll("compare");
  }

  function buildCompareTable(models, fits, availability) {
    const availableLabel = availability.mode === "cpu" || availability.mode === "apple-unified" ? "RAM" : "VRAM";

    const headerCells = models
      .map((m) => `<th>${m.name}<span class="params">${m.params}</span></th>`)
      .join("");

    const row = (label, cellFn) =>
      `<tr><th scope="row">${label}</th>${models.map((m, i) => `<td>${cellFn(m, fits[i])}</td>`).join("")}</tr>`;

    const fitCell = (m, fit) => {
      if (fit.status === "over") {
        return `<span class="compare-status--over">Doesn't fit</span><div class="compare-sub">needs ~${fit.missingGB.toFixed(1)} GB more ${fit.missingKind === "disk" ? "disk space" : "memory"}</div>`;
      }
      const pct = Math.min(Math.round(fit.ratio * 100), 100);
      const statusClass = fit.status === "good" ? "compare-status--good" : "compare-status--tight";
      return `<span class="${statusClass}">${pct}% of your ${availableLabel}</span><div class="compare-sub">${speedNote(fit.mode, fit.quant)}</div>`;
    };

    const quantCell = (m, fit) =>
      `${fit.quant.quant}<div class="compare-sub">${fit.quant.fileGB.toFixed(1)} GB · needs ~${fit.quant.requiredGB.toFixed(1)} GB</div>`;

    const benchCell = (m) =>
      (m.benchmarks || []).length === 0
        ? "—"
        : m.benchmarks.map((b) => `<span class="compare-bench">${b.benchmark} <b>${b.score}</b>${b.secondary ? "†" : ""}</span>`).join("");

    const installCell = (m) =>
      m.ollamaTag
        ? `<code class="install-cmd">ollama pull ${m.ollamaTag}</code><button type="button" class="copy-btn" data-copy="ollama pull ${m.ollamaTag}" style="margin-top:6px;">Copy</button>`
        : "—";

    const linksCell = (m) =>
      `<div class="compare-links">
        <a href="${m.links.github}" target="_blank" rel="noopener">GitHub ${EXTERNAL_ICON}</a>
        <a href="${m.links.huggingface}" target="_blank" rel="noopener">Hugging Face ${EXTERNAL_ICON}</a>
        ${m.links.ollama ? `<a href="${m.links.ollama}" target="_blank" rel="noopener">Ollama library ${EXTERNAL_ICON}</a>` : ""}
      </div>`;

    return `
      <table class="compare-table">
        <thead><tr><th></th>${headerCells}</tr></thead>
        <tbody>
          ${row("Tags", (m) => m.tags.join(", "))}
          ${row("Context", (m) => formatContext(m.context))}
          ${row("Default quant", (m, fit) => quantCell(m, fit))}
          ${row("Fits your machine", (m, fit) => fitCell(m, fit))}
          ${row("Benchmarks", (m) => benchCell(m))}
          ${row("Runtimes", (m) => m.runtimes.join(", "))}
          ${row("Install", (m) => installCell(m))}
          ${row("Links", (m) => linksCell(m))}
        </tbody>
      </table>
    `;
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

    updateFilterBadge();
  }

  function init() {
    buildSortOptions();
    buildUseCaseFilters();
    buildFamilyFilters();
    buildRuntimeFilters();
    updateGpuField();
    render();

    els.showTight.addEventListener("change", render);
    els.disableSystemReserve.addEventListener("change", render);
    els.resetFilters.addEventListener("click", resetFilters);

    els.compareClear.addEventListener("click", () => {
      state.compareSet.clear();
      updateCompareCheckboxes();
      renderCompareTray();
    });
    els.compareOpen.addEventListener("click", () => {
      if (state.compareSet.size >= 2) openCompareOverlay();
    });
    els.compareClose.addEventListener("click", closeCompareOverlay);
    els.compareOverlay.addEventListener("click", (e) => {
      if (e.target === els.compareOverlay) closeCompareOverlay();
    });

    els.mobileFilterFab.addEventListener("click", openFilterSheet);
    els.filterSheetDone.addEventListener("click", closeFilterSheet);
    els.filterSheetBackdrop.addEventListener("click", closeFilterSheet);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!els.compareOverlay.hidden) closeCompareOverlay();
      if (els.filterPane.classList.contains("is-open")) closeFilterSheet();
    });

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
