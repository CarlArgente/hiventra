# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

## Stack

- **Next.js 16.2.6** — App Router. AGENTS.md warning applies: read `node_modules/next/dist/docs/` before writing any Next.js-specific code.
- **React 19.2.4**, **TypeScript 5**, **Tailwind CSS 4**
- **Supabase** via `@supabase/ssr` 0.10.3 — server client uses publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), not service role key
- **Radix UI** — Dialog, DropdownMenu, Tabs, etc. already installed; use these over custom implementations
- **lucide-react** for icons

## Architecture

### Route structure
- `/` — landing page
- `/signin` — auth
- `/dashboard/*` — recruiter UI (protected; redirects candidates to `/portal`)
- `/portal` + `/portal/interview` — candidate-facing interface

### Auth & RLS pattern
Every server component or server action that reads protected data **must** call `await supabase.auth.getUser()` before any DB query to establish the RLS auth context. Skipping it causes queries to return 0 rows with no error.

RLS policies use a `SECURITY DEFINER` function `get_my_role()` to avoid infinite recursion on the `profiles` table:
```sql
SELECT public.get_my_role() -- returns current user's role without triggering RLS on profiles
```

### Data flow
Server Components fetch data → pass as props to Client Components. After mutations, call `revalidatePath()` in the server action **and** `router.refresh()` in the client. Sync new props with `useEffect(() => { setState(prop); }, [prop])` — `useState(initialValue)` only runs once.

### Dropdown menus in tables
Use `@radix-ui/react-dropdown-menu` with `<DropdownMenu.Portal>` — renders at body level, bypasses `overflow-hidden` clipping on table wrappers.

### Modal placement in tables
Place `<JobFormModal>` as a sibling **outside** `<tr>` (not nested inside), to avoid invalid DOM nesting. Use controlled `open`/`onOpenChange` props.

### Server actions
Live in `app/actions/`. Always call `revalidatePath()` at the end. Return `{ error: string }` on failure, `{ success: true }` on success.

## Key files
- `lib/supabase/server.ts` — server Supabase client factory
- `lib/supabase/client.ts` — browser Supabase client factory
- `app/dashboard/layout.tsx` — auth guard + role-based redirect
- `app/actions/jobs.ts` — job CRUD server actions
- `components/dashboard/jobs/JobsTable.tsx` — full client-side job table with filters, search, bulk actions
- `components/dashboard/jobs/JobFormModal.tsx` — create/edit modal (controlled + uncontrolled)
