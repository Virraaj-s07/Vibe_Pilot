# Vibe Pilot

Vibe Pilot is an autonomous project validation engine designed to prevent developers from building dead-end ideas. It analyzes your concept, generates a technical roadmap, and orchestrates the initial execution environment.

Build for BridgeMind Vibeathon 2026

![Vibe Pilot Interface](docs/vibe-score.png)

## The Problem

Most hackathon projects fail not because of bad code, but because of bad planning. Developers waste hours setting up environments for ideas that haven't been validated against market reality or technical constraints.

Vibe Pilot solves this by acting as a pre-flight checklist. It doesn't just "chat" with you; it aggressively tests your idea against market viability and technical feasibility before a single line of code is written.

## Features

- **Vibe Score Algorithm**: A deterministic 0-100 rating system that evaluates project potential based on complexity, uniqueness, and current trends.
- **Golden Prompt Injection**: Automatically generates high-fidelity system prompts optimized for modern AI coding agents, ensuring the context window isn't wasted on boilerplate.
- **Dynamic Roadmap Generation**: Breaks down high-level ideas into execution-ready sprints that agents can consume without hallucination.
- **Universal Export**: One-click configuration export for VS Code and standard terminal environments.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A modern web browser

## Installation

Ensure you have Node.js 18+ installed. Clone the repository and install dependencies.

```bash
git clone <repo-url>
cd Vibe_Pilot
npm install
```

## Usuage

```bash
npm run dev
```

Open http://localhost:3000 in your browser.
