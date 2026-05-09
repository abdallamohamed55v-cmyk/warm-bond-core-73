## Goal

Add a "Chain of Thought" panel — like the screenshot — that appears in **both** normal chat and Deep Research whenever the assistant uses tools or web search. It should show:

- A collapsible header with a brain/globe icon and live status text
- A list of steps: "Searching for X", "Found a photo of Y", "Reading top sources…", with **domain chips** (x.com, github.com, …) under search steps
- An optional **image preview card** with a caption when the search returns a profile/hero image
- Bullet-style **findings** the model surfaces while it works
- Smooth enter/exit animations as new steps stream in

## Current state (already works)

- Backend (`supabase/functions/chat/index.ts`) already streams `task_start`, `task_done`, `search_query`, `deep_read`, `source_engine` events.
- `ChatPage.tsx` collects them into `researchTasks` state and passes to `<ChatMessage>`.
- `ResearchTaskTimeline` renders them as a collapsible list.
- BUT the panel is gated by `isDeepResearch` — it never shows in normal chat — and it doesn't render domain chips, images, or findings.

## Changes

### 1. Backend — emit richer events for every tool run (normal chat + deep research)

In `supabase/functions/chat/index.ts`, inside `handleToolCalls`:

- For `WEB_SEARCH`: after Serper returns, emit
  - `search_sources` event with the unique top-level domains from the result links (e.g. `["x.com","github.com","instagram.com"]`).
  - `image_found` event for each image hit (when `includeImages` true) with `{ url, caption }` derived from the result title/snippet.
- For `BROWSE_WEBSITE`, `SHOPPING_SEARCH`, `GENERATE_IMAGE`, `CODE_INTERPRETER`, `BROWSE_WEBSITE`: keep existing `task_start` / `task_done` but add a short human `summary` on completion ("Found 6 results on github.com", "Generated a 1024×1024 image", …).
- After the model emits a short interim insight between tool calls, emit `bullet_finding` event with `{ text }` so the UI can list it under the Chain of Thought.

These events are additive — no breaking change to existing consumers.

### 2. Frontend — generalize the timeline into a Chain of Thought panel

Rename behavior of `src/components/research/ResearchTaskTimeline.tsx` (keep the file/export name to avoid churn) so each `ResearchTask` can carry:

```
type ResearchTask = {
  id, kind, label, target?, status,
  summary?,
  domains?: string[],           // chips under the row
  image?: { url, caption? },    // small preview card
  bullets?: string[],           // small bullet list under the row
}
```

Render upgrades:
- Header icon: brain/globe + label "Chain of Thought" when there is at least one tool step (instead of "Researched N sources" copy).
- Under a search row, render `domains` as small pill chips matching the screenshot style.
- If a task has `image`, render a centered preview card (rounded, soft border, dark surface) with the caption underneath in muted small text.
- If a task has `bullets`, render them as `•` items with relaxed leading.
- Keep the existing collapse/expand and stream-in motion.

### 3. ChatPage — collect events for normal chat too

In `src/pages/ChatPage.tsx`:

- Stop gating `researchTasks` reset & wiring on `isDeepResearch`. Reset on every new send, accept events for every chat.
- Handle the new events:
  - `search_sources` → patch the matching `search-${query}` task with `domains`.
  - `image_found` → upsert a new task `{ kind: "image", label: "Found a photo of …", image: { url, caption } }`.
  - `bullet_finding` → append to the most recent running task's `bullets`.
- In `<ChatMessage>` rendering, change the `showResearchPanels` / inline timeline check from `isDeepResearch` to "any researchTasks present" so normal chat shows the panel too.

### 4. Visual polish

- Match the screenshot: dark surface `bg-background/40`, subtle border, 12px radius for the image preview, chip colors `bg-foreground/[0.06]` with `text-foreground/80`, 11px font.
- Smooth `AnimatePresence` for chip rows and image cards (fade + slight Y).

## Out of scope

- No changes to model selection, deep-research report writer, or persistence.
- No new dependencies.

## Files touched

- `supabase/functions/chat/index.ts` — emit `search_sources`, `image_found`, `bullet_finding`, and richer `summary` strings.
- `src/components/research/ResearchTaskTimeline.tsx` — extend `ResearchTask` type, render chips/image/bullets, update header copy.
- `src/components/ChatMessage.tsx` — show the panel when tasks exist (drop `isDeepResearch` gate for the timeline).
- `src/pages/ChatPage.tsx` — accept events in normal chat, handle the 3 new events, pass `researchTasks` to the last assistant message regardless of mode.