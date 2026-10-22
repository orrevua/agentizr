# 07 — Frontend: Preview & Download

**Status:** Draft
**Date:** 2026-06-22
**Related:** `04-backend-api.md`, `06-frontend-agent-builder.md`

## Goal
After the user fills the form, "Preview" calls `POST /preview` and renders each generated file in a tabbed code viewer with a file tree. "Generate (.zip)" calls `POST /generate` and downloads the streamed zip. Warnings surface above the preview.

## Decisions

- **Shiki** for syntax highlighting — SSR-friendly, smaller bundle than Monaco, accurate TextMate grammars for Markdown/TOML/YAML. We don't need editing.
- **Preview is a side sheet / panel below the form on mobile, right column on desktop.** Implemented with a flex layout; no modal.
- **File tree is derived from `files[].path`** via a tiny `buildTree(paths)` function — no extra API call.
- **Download uses an in-memory Blob → object URL → `<a download>`** trick triggered programmatically; cleaned up immediately. No server-side filename juggling.
- **Mutation hooks** (`useGenerateMutation`, `usePreviewMutation`) live in `features/preview/api/`. Components never touch `fetch`.

## Feature Folder

```
src/features/preview/
├── components/
│   ├── PreviewPanel.tsx          # tabs + tree + warnings banner
│   ├── FileTree.tsx              # collapsible tree
│   ├── CodeView.tsx              # Shiki-rendered file content
│   ├── WarningsBanner.tsx
│   └── DownloadButton.tsx
├── hooks/
│   ├── useFileTree.ts            # buildTree(paths)
│   └── useDownloadZip.ts         # triggers browser download
├── api/
│   ├── usePreviewMutation.ts
│   └── useGenerateMutation.ts
└── lib/
    └── shiki.ts                  # singleton highlighter
```

## Implementation Units

### Unit 1 — Mutation hooks
- **Files:** `frontend/src/features/preview/api/usePreviewMutation.ts`, `useGenerateMutation.ts`, tests
- **Change:**
  - `usePreviewMutation` → `useMutation` calling `api<GenerationResult>('/preview', { method: 'POST', body: JSON.stringify(def) })`.
  - `useGenerateMutation` → `useMutation` doing a raw `fetch` (not `api`, because response is binary) returning `{ blob: Blob, filename: string }`. Parse `Content-Disposition` to get filename; fall back to `agentizr.zip`.
- **Acceptance:** Tests with `msw` mock both endpoints; preview returns parsed JSON, generate returns a Blob with correct filename.

### Unit 2 — `buildTree` utility
- **Files:** `frontend/src/features/preview/hooks/useFileTree.ts`, test
- **Change:** Pure function `buildTree(paths: string[]) -> TreeNode[]` where `TreeNode = { name: string; path?: string; children: TreeNode[] }`. Sorted directories-first, alphabetic.
- **Acceptance:** Snapshot test over a representative path list.

### Unit 3 — Shiki singleton
- **Files:** `frontend/src/features/preview/lib/shiki.ts`
- **Change:** Lazy-initialize a single `getHighlighter({ themes: ['github-light','github-dark'], langs: ['markdown','toml','yaml','text'] })`. Export `highlight(code, lang)`. Use a `LANG_MAP: Record<GeneratedFile['language'], BundledLanguage>` lookup — no if/else.
- **Acceptance:** First call initializes; subsequent calls reuse; rendering Markdown produces `<pre class="shiki ...">`.

### Unit 4 — `CodeView`
- **Files:** `frontend/src/features/preview/components/CodeView.tsx`, test
- **Change:** Client Component receiving `{ file: GeneratedFile }`. Renders highlighted HTML via `dangerouslySetInnerHTML` (Shiki output is escaped). Includes a small "Copy" button using `navigator.clipboard.writeText`.
- **Acceptance:** Switching files re-renders highlighted output.

### Unit 5 — `FileTree`
- **Files:** `frontend/src/features/preview/components/FileTree.tsx`, test
- **Change:** Receives `TreeNode[]` and `{ selectedPath, onSelect }`. Recursive component; folders are collapsible (default expanded for the first 2 levels). Uses lucide `ChevronRight`/`Folder`/`FileText` icons. Selected file gets a primary background.
- **Acceptance:** Clicking a leaf fires `onSelect(path)`.

### Unit 6 — `WarningsBanner` + `DownloadButton`
- **Files:** `WarningsBanner.tsx`, `DownloadButton.tsx`, `useDownloadZip.ts`, tests
- **Change:**
  - `WarningsBanner`: rendered if `warnings.length > 0`; one row per warning with code + message + platform badge.
  - `useDownloadZip`: takes `(blob, filename)`, creates object URL, programmatically clicks an `<a>`, revokes URL.
  - `DownloadButton`: triggers `useGenerateMutation` with the current form values; on success calls `useDownloadZip`; shows loading state.
- **Acceptance:** Tests verify URL.createObjectURL invoked + revoked; warnings render in order.

### Unit 7 — `PreviewPanel` composition
- **Files:** `PreviewPanel.tsx`, integration test
- **Change:** Receives the form's current values + a `previewResult` (from `usePreviewMutation` triggered by the form's Preview button). Composes: `WarningsBanner` on top, two-column body (`FileTree` left, `CodeView` right). Empty state: "Click Preview to generate files".
- **Acceptance:** Integration test fills the form, clicks Preview, asserts every expected platform tab appears.

### Unit 8 — Wire into `AgentForm`
- **Files:** `frontend/src/features/agent-builder/components/AgentForm.tsx` (modify), `frontend/src/features/agent-builder/components/AgentBuilder.tsx` (modify)
- **Change:** AgentForm exposes two submit handlers via RHF's `handleSubmit`: `onPreview` triggers `previewMutation.mutate(values)`; `onGenerate` triggers `generateMutation.mutate(values)` then `downloadZip`. AgentBuilder renders `<AgentForm/>` and `<PreviewPanel/>` side by side, sharing the preview state via a small Zustand store or React context (prefer context; one feature only).
- **Acceptance:** End-to-end (mocked backend) flow works inside a single Vitest integration test.

## Out of Scope
- Inline editing of generated files before download.
- Diff view / re-generate-after-edit.
- Saving previews to a shareable URL.
