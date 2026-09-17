// Curated catalog of local-runnable open models.
// Sizes are approximate (GGUF quantization) — real usage varies with context length and runtime.
// requiredGB = file size + typical runtime/context overhead at default context length.
//
// benchmarks[]: pulled from each model's own Hugging Face model card where available.
// Entries flagged `secondary: true` come from another model's published comparison table
// (chiefly Microsoft's Phi-3.5/Phi-4 cards), not the model's own card — treat as directional.
// Some cards (gated repos, or cards that link to an external blog instead of a table) had
// no extractable numbers, so those models carry an empty benchmarks array rather than a guess.

const MODELS = [
  {
    id: "llama32-1b",
    name: "Llama 3.2",
    params: "1B",
    paramsB: 1,
    benchmarks: [],
    blurb: "Fast and small. Good for quick edits and simple chat, not deep reasoning.",
    tags: ["writing", "chat", "general"],
    quants: [
      { quant: "Q8_0", fileGB: 1.3, requiredGB: 2.0 },
      { quant: "Q4_K_M", fileGB: 0.8, requiredGB: 1.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "MLX"],
    links: {
      github: "https://github.com/meta-llama/llama-models",
      huggingface: "https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct",
      ollama: "https://ollama.com/library/llama3.2",
    },
  },
  {
    id: "llama32-3b",
    name: "Llama 3.2",
    params: "3B",
    paramsB: 3,
    benchmarks: [],
    blurb: "A step up in coherence over the 1B — still light enough for laptops.",
    tags: ["writing", "chat", "general"],
    quants: [
      { quant: "Q8_0", fileGB: 3.4, requiredGB: 4.5 },
      { quant: "Q4_K_M", fileGB: 2.0, requiredGB: 3.0 },
    ],
    runtimes: ["Ollama", "llama.cpp", "MLX"],
    links: {
      github: "https://github.com/meta-llama/llama-models",
      huggingface: "https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct",
      ollama: "https://ollama.com/library/llama3.2",
    },
  },
  {
    id: "llama31-8b",
    name: "Llama 3.1",
    params: "8B",
    paramsB: 8,
    benchmarks: [
      { area: "research", benchmark: "MMLU", score: "69.4", note: "5-shot" },
      { area: "coding", benchmark: "HumanEval", score: "72.6", note: "pass@1" },
      { area: "writing", benchmark: "IFEval", score: "80.4", note: "" },
    ],
    blurb: "Solid general-purpose model — the reasonable default for chat and writing.",
    tags: ["writing", "chat", "general", "research"],
    quants: [
      { quant: "Q8_0", fileGB: 8.5, requiredGB: 10.5 },
      { quant: "Q4_K_M", fileGB: 4.7, requiredGB: 6.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio", "MLX"],
    links: {
      github: "https://github.com/meta-llama/llama-models",
      huggingface: "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct",
      ollama: "https://ollama.com/library/llama3.1",
    },
  },
  {
    id: "qwen25-7b",
    name: "Qwen2.5",
    params: "7B",
    paramsB: 7,
    benchmarks: [],
    blurb: "Strong all-rounder with long context — a good research and writing default.",
    tags: ["writing", "research", "general", "chat"],
    quants: [
      { quant: "Q8_0", fileGB: 8.1, requiredGB: 10.0 },
      { quant: "Q4_K_M", fileGB: 4.7, requiredGB: 6.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio", "MLX"],
    links: {
      github: "https://github.com/QwenLM/Qwen2.5",
      huggingface: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5",
    },
  },
  {
    id: "qwen25-coder-7b",
    name: "Qwen2.5 Coder",
    params: "7B",
    paramsB: 7,
    benchmarks: [],
    blurb: "Purpose-built for code completion and refactors at laptop-friendly size.",
    tags: ["coding", "agents"],
    quants: [
      { quant: "Q8_0", fileGB: 8.1, requiredGB: 10.0 },
      { quant: "Q4_K_M", fileGB: 4.7, requiredGB: 6.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/QwenLM/Qwen2.5-Coder",
      huggingface: "https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5-coder",
    },
  },
  {
    id: "qwen25-coder-14b",
    name: "Qwen2.5 Coder",
    params: "14B",
    paramsB: 14,
    benchmarks: [],
    blurb: "Noticeably better at multi-file reasoning than the 7B, still runs on one GPU.",
    tags: ["coding", "agents"],
    quants: [
      { quant: "Q8_0", fileGB: 15.7, requiredGB: 18.5 },
      { quant: "Q4_K_M", fileGB: 9.0, requiredGB: 11.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/QwenLM/Qwen2.5-Coder",
      huggingface: "https://huggingface.co/Qwen/Qwen2.5-Coder-14B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5-coder",
    },
  },
  {
    id: "qwen25-coder-32b",
    name: "Qwen2.5 Coder",
    params: "32B",
    paramsB: 32,
    benchmarks: [],
    blurb: "Near frontier-level coding quality — needs a real workstation GPU or a lot of RAM.",
    tags: ["coding", "agents"],
    quants: [
      { quant: "Q5_K_M", fileGB: 23.0, requiredGB: 26.5 },
      { quant: "Q4_K_M", fileGB: 19.8, requiredGB: 23.0 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/QwenLM/Qwen2.5-Coder",
      huggingface: "https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5-coder",
    },
  },
  {
    id: "qwen25-14b",
    name: "Qwen2.5",
    params: "14B",
    paramsB: 14,
    benchmarks: [
      { area: "research", benchmark: "MMLU", score: "79.9", note: "", secondary: true },
      { area: "coding", benchmark: "HumanEval", score: "72.1", note: "", secondary: true },
    ],
    blurb: "More headroom for longer research documents and multi-step reasoning.",
    tags: ["research", "writing", "general"],
    quants: [
      { quant: "Q8_0", fileGB: 15.7, requiredGB: 18.5 },
      { quant: "Q4_K_M", fileGB: 9.0, requiredGB: 11.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/QwenLM/Qwen2.5",
      huggingface: "https://huggingface.co/Qwen/Qwen2.5-14B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5",
    },
  },
  {
    id: "qwen25-32b",
    name: "Qwen2.5",
    params: "32B",
    paramsB: 32,
    benchmarks: [],
    blurb: "One of the strongest models you can still self-host on a single high-VRAM GPU.",
    tags: ["research", "writing"],
    quants: [
      { quant: "Q4_K_M", fileGB: 19.8, requiredGB: 23.0 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/QwenLM/Qwen2.5",
      huggingface: "https://huggingface.co/Qwen/Qwen2.5-32B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5",
    },
  },
  {
    id: "qwen25-72b",
    name: "Qwen2.5",
    params: "72B",
    paramsB: 72,
    benchmarks: [
      { area: "research", benchmark: "MMLU", score: "85.3", note: "", secondary: true },
      { area: "coding", benchmark: "HumanEval", score: "80.4", note: "", secondary: true },
    ],
    blurb: "Flagship-class quality. Realistically needs multi-GPU or a large unified-memory Mac.",
    tags: ["research", "writing"],
    quants: [
      { quant: "Q4_K_M", fileGB: 47.4, requiredGB: 52.0 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/QwenLM/Qwen2.5",
      huggingface: "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5",
    },
  },
  {
    id: "deepseek-r1-qwen-7b",
    name: "DeepSeek-R1 Distill (Qwen)",
    params: "7B",
    paramsB: 7,
    benchmarks: [
      { area: "research", benchmark: "GPQA Diamond", score: "49.1", note: "pass@1" },
      { area: "coding", benchmark: "LiveCodeBench", score: "37.6", note: "pass@1" },
    ],
    blurb: "Shows its reasoning step by step — good for math and logic-heavy questions.",
    tags: ["research", "coding"],
    quants: [
      { quant: "Q4_K_M", fileGB: 4.7, requiredGB: 6.5 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/deepseek-ai/DeepSeek-R1",
      huggingface: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
      ollama: "https://ollama.com/library/deepseek-r1",
    },
  },
  {
    id: "deepseek-r1-qwen-14b",
    name: "DeepSeek-R1 Distill (Qwen)",
    params: "14B",
    paramsB: 14,
    benchmarks: [
      { area: "research", benchmark: "GPQA Diamond", score: "59.1", note: "pass@1" },
      { area: "coding", benchmark: "LiveCodeBench", score: "53.1", note: "pass@1" },
    ],
    blurb: "Better reasoning depth than the 7B distill, still fits on a single mid-range GPU.",
    tags: ["research", "coding"],
    quants: [
      { quant: "Q4_K_M", fileGB: 9.0, requiredGB: 11.5 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/deepseek-ai/DeepSeek-R1",
      huggingface: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
      ollama: "https://ollama.com/library/deepseek-r1",
    },
  },
  {
    id: "deepseek-r1-llama-8b",
    name: "DeepSeek-R1 Distill (Llama)",
    params: "8B",
    paramsB: 8,
    benchmarks: [
      { area: "research", benchmark: "GPQA Diamond", score: "49.0", note: "pass@1" },
      { area: "coding", benchmark: "LiveCodeBench", score: "39.6", note: "pass@1" },
    ],
    blurb: "Reasoning-tuned distillation of Llama 3.1 — a lighter alternative to the Qwen distill.",
    tags: ["research", "coding"],
    quants: [
      { quant: "Q4_K_M", fileGB: 4.9, requiredGB: 6.5 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/deepseek-ai/DeepSeek-R1",
      huggingface: "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
      ollama: "https://ollama.com/library/deepseek-r1",
    },
  },
  {
    id: "mistral-7b",
    name: "Mistral",
    params: "7B",
    paramsB: 7,
    benchmarks: [
      { area: "writing", benchmark: "MMLU", score: "60.3", note: "5-shot", secondary: true },
      { area: "chat", benchmark: "Arena-Hard", score: "18.1", note: "", secondary: true },
    ],
    blurb: "Dependable, well-rounded writing model with a permissive license.",
    tags: ["writing", "chat", "general"],
    quants: [
      { quant: "Q4_K_M", fileGB: 4.4, requiredGB: 6.0 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/mistralai/mistral-inference",
      huggingface: "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3",
      ollama: "https://ollama.com/library/mistral",
    },
  },
  {
    id: "mistral-nemo-12b",
    name: "Mistral Nemo",
    params: "12B",
    paramsB: 12,
    benchmarks: [
      { area: "writing", benchmark: "MMLU", score: "68.0", note: "5-shot" },
      { area: "writing", benchmark: "Arena-Hard", score: "39.4", note: "", secondary: true },
    ],
    blurb: "Large context window and reliable function-calling — a good fit for agent workflows.",
    tags: ["agents", "writing", "general"],
    quants: [
      { quant: "Q4_K_M", fileGB: 7.1, requiredGB: 9.0 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/mistralai/mistral-inference",
      huggingface: "https://huggingface.co/mistralai/Mistral-Nemo-Instruct-2407",
      ollama: "https://ollama.com/library/mistral-nemo",
    },
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral",
    params: "8x7B",
    paramsB: 47,
    benchmarks: [],
    blurb: "Mixture-of-experts model — needs all experts in memory even though fewer are active per token.",
    tags: ["research", "writing"],
    quants: [
      { quant: "Q4_K_M", fileGB: 26.4, requiredGB: 30.0 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/mistralai/mistral-inference",
      huggingface: "https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1",
      ollama: "https://ollama.com/library/mixtral",
    },
  },
  {
    id: "phi35-mini",
    name: "Phi-3.5 Mini",
    params: "3.8B",
    paramsB: 3.8,
    benchmarks: [
      { area: "coding", benchmark: "HumanEval", score: "62.8", note: "0-shot" },
      { area: "writing", benchmark: "MMLU", score: "69.0", note: "5-shot" },
    ],
    blurb: "Punches above its size on coding and reasoning benchmarks for its weight class.",
    tags: ["coding", "writing", "general"],
    quants: [
      { quant: "Q4_K_M", fileGB: 2.2, requiredGB: 3.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "MLX"],
    links: {
      github: "https://github.com/microsoft/Phi-3CookBook",
      huggingface: "https://huggingface.co/microsoft/Phi-3.5-mini-instruct",
      ollama: "https://ollama.com/library/phi3.5",
    },
  },
  {
    id: "phi4-14b",
    name: "Phi-4",
    params: "14B",
    paramsB: 14,
    benchmarks: [
      { area: "research", benchmark: "MMLU", score: "84.8", note: "" },
      { area: "research", benchmark: "GPQA", score: "56.1", note: "" },
      { area: "coding", benchmark: "HumanEval", score: "82.6", note: "" },
    ],
    blurb: "Trained heavily on synthetic reasoning data — strong at math and structured problems.",
    tags: ["research", "coding"],
    quants: [
      { quant: "Q4_K_M", fileGB: 9.1, requiredGB: 11.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/microsoft/Phi-3CookBook",
      huggingface: "https://huggingface.co/microsoft/phi-4",
      ollama: "https://ollama.com/library/phi4",
    },
  },
  {
    id: "gemma2-9b",
    name: "Gemma 2",
    params: "9B",
    paramsB: 9,
    benchmarks: [
      { area: "writing", benchmark: "MMLU", score: "71.3", note: "5-shot", secondary: true },
      { area: "chat", benchmark: "Arena-Hard", score: "42", note: "", secondary: true },
    ],
    blurb: "Well-tuned for natural conversation and everyday writing tasks.",
    tags: ["writing", "chat", "general"],
    quants: [
      { quant: "Q4_K_M", fileGB: 5.4, requiredGB: 7.0 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/google-deepmind/gemma",
      huggingface: "https://huggingface.co/google/gemma-2-9b-it",
      ollama: "https://ollama.com/library/gemma2",
    },
  },
  {
    id: "gemma2-27b",
    name: "Gemma 2",
    params: "27B",
    paramsB: 27,
    benchmarks: [],
    blurb: "The larger Gemma 2 tier — better nuance for long-form writing and analysis.",
    tags: ["writing", "research"],
    quants: [
      { quant: "Q4_K_M", fileGB: 16.0, requiredGB: 19.0 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/google-deepmind/gemma",
      huggingface: "https://huggingface.co/google/gemma-2-27b-it",
      ollama: "https://ollama.com/library/gemma2",
    },
  },
  {
    id: "codellama-13b",
    name: "Code Llama",
    params: "13B",
    paramsB: 13,
    benchmarks: [],
    blurb: "Meta's dedicated code model — a reliable, older-generation coding baseline.",
    tags: ["coding"],
    quants: [
      { quant: "Q4_K_M", fileGB: 7.4, requiredGB: 9.5 },
    ],
    runtimes: ["Ollama", "llama.cpp", "LM Studio"],
    links: {
      github: "https://github.com/meta-llama/codellama",
      huggingface: "https://huggingface.co/meta-llama/CodeLlama-13b-Instruct-hf",
      ollama: "https://ollama.com/library/codellama",
    },
  },
  {
    id: "starcoder2-15b",
    name: "StarCoder2",
    params: "15B",
    paramsB: 15,
    benchmarks: [
      { area: "coding", benchmark: "HumanEval", score: "46.3", note: "pass@1" },
    ],
    blurb: "Trained on The Stack v2 — broad language coverage across many programming languages.",
    tags: ["coding"],
    quants: [
      { quant: "Q4_K_M", fileGB: 9.1, requiredGB: 11.5 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/bigcode-project/starcoder2",
      huggingface: "https://huggingface.co/bigcode/starcoder2-15b",
      ollama: "https://ollama.com/library/starcoder2",
    },
  },
  {
    id: "llava-16-7b",
    name: "LLaVA 1.6",
    params: "7B",
    paramsB: 7,
    benchmarks: [],
    blurb: "Reads images alongside text — screenshots, diagrams, photos.",
    tags: ["vision", "general"],
    quants: [
      { quant: "Q4_K_M", fileGB: 4.7, requiredGB: 6.5 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/haotian-liu/LLaVA",
      huggingface: "https://huggingface.co/liuhaotian/llava-v1.6-mistral-7b",
      ollama: "https://ollama.com/library/llava",
    },
  },
  {
    id: "qwen2-vl-7b",
    name: "Qwen2-VL",
    params: "7B",
    paramsB: 7,
    benchmarks: [
      { area: "vision", benchmark: "MMMU", score: "54.1", note: "val" },
      { area: "vision", benchmark: "DocVQA", score: "94.5", note: "test" },
    ],
    blurb: "Strong document and chart understanding in addition to general image Q&A.",
    tags: ["vision", "research"],
    quants: [
      { quant: "Q4_K_M", fileGB: 5.0, requiredGB: 7.0 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/QwenLM/Qwen2-VL",
      huggingface: "https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct",
      ollama: "https://ollama.com/library/qwen2.5vl",
    },
  },
  {
    id: "command-r-35b",
    name: "Command R",
    params: "35B",
    paramsB: 35,
    benchmarks: [],
    blurb: "Built for retrieval-augmented generation and tool use with citation support.",
    tags: ["agents", "research"],
    quants: [
      { quant: "Q4_K_M", fileGB: 20.0, requiredGB: 23.5 },
    ],
    runtimes: ["Ollama", "llama.cpp"],
    links: {
      github: "https://github.com/cohere-ai/cohere-toolkit",
      huggingface: "https://huggingface.co/CohereForAI/c4ai-command-r-v01",
      ollama: "https://ollama.com/library/command-r",
    },
  },
];

const USE_CASES = [
  { id: "coding", label: "Coding" },
  { id: "research", label: "Research & analysis" },
  { id: "writing", label: "Writing" },
  { id: "chat", label: "General chat" },
  { id: "agents", label: "Agents & tool use" },
  { id: "vision", label: "Vision & images" },
];
