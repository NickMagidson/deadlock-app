# Vercel Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate Vercel-compatible server and static deployment output for the TanStack Start application.

**Architecture:** Let Nitro detect the Vercel environment instead of pinning its standalone `node-server` preset. Declare the TanStack Start framework explicitly so Vercel supplies the corresponding build and output handling; retain local development and standard Node builds.

**Tech Stack:** TanStack Start, Vite, Nitro, Vercel.

**Spec:** User request in this chat: correct Vercel output configuration and deploy.

## Global Constraints

- Keep server functions and SSR routes deployable; do not convert the application to a static-only site.
- Use `npm run build` as the deployment build command.
- Do not configure Vercel to serve `.output/public` as the complete application output.

## Review Focus

- Vercel build environment selects Nitro's `vercel` preset rather than the pinned standalone Node preset.
- Static client assets and SSR/server-function output are both present in the Vercel build artifact.
- Local tests and TypeScript checks continue to pass without deployment-only variables.

### Task 1: Configure Vercel-aware Nitro deployment

**Files:**
- Create: `vercel.json`
- Modify: `vite.config.ts:10`
- Modify: `README.md:47-57`

**Interfaces:**
- Consumes: Vercel's `tanstack-start` framework detection and Nitro's automatic Vercel preset detection.
- Produces: A deployment configuration that Vercel can build without an Output Directory override.

- [ ] **Step 1: Remove the pinned `node-server` preset from `vite.config.ts`**

Keep `compatibilityDate: '2026-11-18'` in the `nitro()` plugin options so Nitro can select the Vercel preset when Vercel builds the project.

- [ ] **Step 2: Add `vercel.json`**

Set the schema URL to `https://openapi.vercel.sh/vercel.json` and the framework to `tanstack-start`.

- [ ] **Step 3: Update production documentation**

Explain Vercel's framework detection, `npm run build`, and that Output Directory must remain unset; preserve the separate generic Node hosting instructions.

- [ ] **Step 4: Verify the deployment artifact**

Run: `NITRO_PRESET=vercel npm run build`

Expected: successful build and a `.vercel/output` directory containing Vercel build output.

- [ ] **Step 5: Verify the application checks**

Run: `npm test && npm run typecheck && npm run build`

Expected: all tests, type checking, and normal Node production build succeed.

- [ ] **Step 6: Commit and push**

```bash
git add vite.config.ts vercel.json README.md docs/superpowers/plans/2026-11-18-vercel-deployment.md
git commit -m "fix: configure Vercel deployment"
git push
```
