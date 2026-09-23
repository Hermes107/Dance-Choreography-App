# Stagecraft

Stagecraft is a touch-first choreography workspace for mapping dancer formations and keyframed stage scenes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/stagecraft/src/pages/workspace.tsx` — Milestone 1 workspace UI and stage interactions
- `artifacts/stagecraft/src/index.css` — Stagecraft theme and stage canvas utilities
- `lib/api-spec/openapi.yaml` — source of truth for the Stagecraft API contract
- `artifacts/api-server/src/routes/stagecraft.ts` — project, dancer, and keyframe API routes
- `lib/db/src/schema/` — Drizzle schema for projects, dancers, and keyframes

## Architecture decisions

- Stagecraft is a responsive web app; native mobile packaging is out of scope for the current milestones.
- Milestone 1 stores dancer positions as stage-space pixel coordinates, which keeps grid snapping and SVG transition paths in one coordinate system.
- Keyframes own their dancer position snapshots; dancer metadata is shared at the project level.
- The initial workspace is seeded with a small formation example when the project has no projects yet.

## Product

Milestone 1 lets choreographers create projects, edit dancer tokens, drag tokens on a labeled stage grid, snap to a configurable grid, save formation keyframes, visualize movement paths from the previous keyframe, and duplicate, reorder, or delete scenes.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- The API client compiler needs `dom.iterable` so generated `Headers.entries()` code typechecks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
