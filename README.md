# ModelAssist

**[modelassist.netlify.app](https://modelassist.netlify.app/)** · [justwaters.github.io/ModelAssist](https://justwaters.github.io/ModelAssist/)

Enter your machine's specs and what you're using it for, and get a list of open local LLMs that will actually run — checked against your RAM/VRAM, disk space, and use case, with the runtime you'll need (Ollama, llama.cpp, LM Studio, MLX) and links to get each model.

## Why

Most "which local model should I run" advice is a blog post that goes stale in a month. This is a small calculator instead: you enter real numbers, it checks real quantized file sizes against them, and it tells you what fits and how well — not just "yes" or "no," but how much headroom you have and roughly how fast it'll run.

## What it checks

- **Fit**: whether a model's quantized file size (plus runtime/context overhead) fits in your available VRAM or RAM, accounting for Apple Silicon's unified memory
- **Disk**: whether you actually have room for the download
- **Use case**: whether the model is any good at what you want to do with it (coding, research, writing, chat, agents, vision), backed by benchmark scores pulled from each model's own Hugging Face card
- **Speed**: a rough tokens/sec estimate when running CPU-only, since decoding is memory-bandwidth-bound

Nothing is submitted anywhere — it's a static page that recalculates in your browser as you type.

## Running it locally

No build step. Clone the repo and serve the directory with anything static, e.g.:

```
python3 -m http.server 8934
```

Then open `http://localhost:8934`.

## Stack

Plain HTML/CSS/JS — `index.html`, `styles.css`, `app.js`, and the model catalog in `data.js`. No framework, no dependencies, no build tooling.
