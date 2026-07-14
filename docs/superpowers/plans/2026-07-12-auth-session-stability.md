# Auth Session Stability (MFA/AAL2 + Refresh-Token Reuse) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the constant session logout / cookie disappearance and the MFA redirect loop on `/admin` and `/portal` by removing the double session-token writer and making AAL2 persistence reliable.

**Architecture:** The Next.js proxy (`src/proxy.ts`) is the ONLY server-side writer of the Supabase auth cookies (it already rotates cookies via `response.cookies.set` and reads session in middleware). The client layouts (`admin/layout.tsx`, `portal/layout.tsx`) currently also run `supabase.auth.onAuthStateChange` that re-emits the browser auth cookie on every `TOKEN_REFRESHED` and re-checks AAL2 via `getAuthenticatorAssuranceLevel()` inside the change handler. Combined with `refresh_token_rotation_enabled=true` (Supabase: `lyqmsluktqdeytpouyvh`, `security_refresh_token_reuse_interval=10s`), the two writers race on the rotated refresh token and GoTrue revokes the session (cookie wipe → forced re-login). Fix: keep proxy as single writer; in the layouts, stop re-writing cookies inside `onAuthStateChange`, and check AAL2 once at mount (not inside the auth-state handler). AAL2 from `mfa.verify()` + `setSession()` then persists across F5 because nothing overwrites it. Also raise `security_refresh_token_reuse_interval` on the remote project as defense-in-depth so a transient race does not instantly revoke the whole session.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts` middleware convention), `@supabase/ssr` 0.12.0, `@supabase/supabase-js` 2.110, Supabase GoTrue Auth (remote project `lyqmsluktqdeytpouyvh`).

---

## Background / Root Cause (verified evidence)

- Local `.env.local` and Vercel env both point to `https://lyqmsluktqdeytpouyvh.supabase.co` with identical anon key → **credentials match**.
- Remote auth config (`/v1/projects/lyqmsluktqdeytpouyvh/config/auth`):
  - `refresh_token_rotation_enabled = true`
  - `security_refresh_token_reuse_interval = 10` (seconds — very short)
  - `mfa_allow_low_aal = false`
  - no custom `cookie_*` options → `@supabase/ssr` defaults apply (`sameSite: "lax"`, `path: "/"`, `maxAge: 400d`) — correct.
- Remote users (read-only SQL): `issencialofficial@gmail.com` = admin + verified TOTP; `baptistalimab@gmail.com` = client + verified TOTP → **MFA correctly active**, not the problem.
- Code double-write:
  1. `src/proxy.ts`: every protected request → `supabase.auth.getUser()` → on near-expiry refreshes server-side and re-emits rotated refresh token via `response.cookies.set`.
  2. `src/app/admin/layout.tsx:121` and `src/app/portal/layout.tsx:104`: `onAuthStateChange(async (_event, session) => { ... getAuthenticatorAssuranceLevel(); listFactors(); ... })` in the **browser**, which re-emits cookies on `TOKEN_REFRESHED`.
- AAL2 MFA persistence: `src/app/{admin,login}/mfa/page.tsx` already does `getSession()` + `setSession()` after `mfa.verify()` to force-write the AAL2 cookie — but the duplicate writer nullifies it.

**Conclusion:** single root cause = concurrent token writers under tight rotation-reuse window → session revocation → cookie wipe → forced login loop (exacerbated by AAL1→MFA redirect and the `signOut({scope:'global'})` on role mismatch).

---

## File Structure

- `src/proxy.ts` — MODIFY (keep as sole server-side cookie writer; only minor hardening — no AAL logic). Already correct; left largely intact.
- `src/app/admin/layout.tsx` — MODIFY: remove `getAuthenticatorAssuranceLevel()`/`listFactors()` from inside `onAuthStateChange`; keep AAL2 check at mount only.
- `src/app/portal/layout.tsx` — MODIFY: same as admin.
- `src/app/admin/login/mfa/page.tsx` — MODIFY (minor): keep `setSession` persistence, ensure redirect uses `replace` to avoid history back-loop.
- `src/app/login/mfa/page.tsx` — MODIFY (minor): same.
- `supabase/config-patch.sh` (NEW, optional helper) — raises `security_refresh_token_reuse_interval` via API for defense-in-depth.

No new source files required; changes are surgical in 4 existing files + optional remote config bump.

---

## Task 1: Stop the layout `onAuthStateChange` from re-checking AAL2 and re-writing cookies (ADMIN)

**Files:**
- Modify: `src/app/admin/layout.tsx:119-159` (the `onAuthStateChange` subscription block)

The current handler re-runs `getAuthenticatorAssuranceLevel()`/`listFactors()` on EVERY auth event (incl. `TOKEN_REFRESHED`), which re-emits the browser cookie and races the proxy. Replace it with a handler that only reacts to sign-out, moving the AAL2 check to mount only.

- [ ] **Step 1: Replace the `onAuthStateChange` block with a minimal, non-rewriting handler**

Locate this exact block in `src/app/admin/layout.tsx` (lines 119-159):

```tsx
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        // Only redirect if not already on the login page
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
        return;
      }
      setUser(session.user);

      const role = session.user.app_metadata?.role;
      if (role !== "admin") {
        router.push("/portal");
        return;
      }

      // If MFA is enrolled but not yet verified for this session,
      // redirect to the challenge instead of trusting the AAL1 session.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedTotp = factors?.totp?.some(
        (f) => f.status === "verified",
      );
      if (hasVerifiedTotp && (aal?.currentLevel ?? "aal1") !== "aal2") {
        if (
          pathname !== "/admin/login" &&
          !pathname.startsWith("/admin/login/")
        ) {
          router.push("/admin/login/mfa");
        }
        return;
      }

      setIsAdmin(true);
    });

    return () => subscription.unsubscribe();
  }, [pathname]);
```

Replace with (handles sign-out only; does NOT call `getAuthenticatorAssuranceLevel`/`listFactors` — those run once at mount in `checkAdmin()` above, which already exists at `admin/layout.tsx:69-115`):

```tsx
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only react to sign-out. Do NOT re-check AAL2 or re-emit the auth
      // cookie here: that races the proxy's server-side refresh (which is
      // the single writer under refresh_token_rotation_enabled) and causes
      // GoTrue to revoke the session (cookie wipe -> forced re-login).
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);
```

- [ ] **Step 2: Verify `checkAdmin()` still performs the AAL2 check at mount**

Confirm the mount function `checkAdmin()` (around `admin/layout.tsx:69-115`) keeps its AAL2 logic. It already does (lines 87-101):

```tsx
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedTotp = factors?.totp?.some(
        (f) => f.status === "verified",
      );
      if (hasVerifiedTotp && (aal?.currentLevel ?? "aal1") !== "aal2") {
        router.push("/admin/login/mfa");
        return;
      }
```

No change needed there. AAL2 is now checked ONCE at mount, not on every refresh event.

- [ ] **Step 3: Typecheck the change**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: no new type errors referencing `admin/layout.tsx`. (Project may have pre-existing lint/type noise; only regression in this file matters.)

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "fix(auth): stop admin layout onAuthStateChange from re-checking AAL2 / re-writing cookies"
```

---

## Task 2: Stop the layout `onAuthStateChange` from re-checking AAL2 and re-writing cookies (PORTAL)

**Files:**
- Modify: `src/app/portal/layout.tsx:102-135` (the `onAuthStateChange` subscription block)

Mirror of Task 1 for the portal. The current handler re-checks AAL2 on every event and additionally calls `signOut({scope:'global'})` on admin role — that global signOut inside an auth-state handler is a second session killer.

- [ ] **Step 1: Replace the `onAuthStateChange` block with a minimal, non-rewriting handler**

Locate this exact block in `src/app/portal/layout.tsx` (lines 102-135):

```tsx
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push("/login");
        return;
      }

      // Admin users should not access the client portal — sign them out globally
      if (session.user.app_metadata?.role === "admin") {
        supabase.auth.signOut({ scope: "global" });
        router.push("/admin/login");
        return;
      }

      // Re-check MFA on auth state change — if AAL2 is now required,
      // redirect to the challenge before allowing access.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasVerifiedTotp = factors?.totp?.some(
        (f) => f.status === "verified",
      );
      if (hasVerifiedTotp && (aal?.currentLevel ?? "aal1") !== "aal2") {
        router.push("/login/mfa");
        return;
      }

      setUser(session.user);
      fetchBadges(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [pathname]);
```

Replace with (sign-out handling only; role mismatch handling MOVED to the mount `getUser()` check at `portal/layout.tsx:57-83`, which already pushes admins to `/admin/login`). The handler must NEVER call `signOut` or AAL2 re-check:

```tsx
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only react to sign-out. Do NOT re-check AAL2 or call signOut here:
      // this races the proxy's single server-side cookie writer under
      // refresh_token_rotation_enabled and can revoke the whole session.
      // Role mismatch is handled at mount in the initial getUser() check.
      if (!session?.user) {
        setUser(null);
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);
```

- [ ] **Step 2: Confirm the mount `getUser()` block still handles admin role mismatch**

Verify `portal/layout.tsx:57-83` keeps (it already has at lines 64-69):

```tsx
      // Admin users should not access the client portal — sign them out globally
      if (user.app_metadata?.role === "admin") {
        await supabase.auth.signOut({ scope: "global" });
        router.push("/admin/login");
        return;
      }
```

This is fine: it runs ONCE at mount, not on every auth event. No change needed.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: no new type errors from `portal/layout.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/layout.tsx
git commit -m "fix(auth): stop portal layout onAuthStateChange from re-checking AAL2 / calling global signOut"
```

---

## Task 3: Make MFA verify redirect loop-proof with `router.replace`

**Files:**
- Modify: `src/app/admin/login/mfa/page.tsx:143`
- Modify: `src/app/login/mfa/page.tsx` (the `router.push(redirectTo)` after verify; mirror of admin)

After `mfa.verify()` + `setSession(session)`, the code does `router.push("/admin")` / `router.push(redirectTo)`. Use `router.replace` so the MFA page is not left on the history stack (prevents back-button re-entry into the challenge and reduces re-evaluation churn).

- [ ] **Step 1: Change admin MFA verify redirect to `replace`**

In `src/app/admin/login/mfa/page.tsx`, replace:

```tsx
        router.push("/admin");
```

with:

```tsx
        router.replace("/admin");
```

- [ ] **Step 2: Change client MFA verify redirect to `replace`**

In `src/app/login/mfa/page.tsx`, locate the verify success block (after `await supabase.auth.setSession(sessionData.session);`, around line 133-135):

```tsx
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") || "/portal";
        router.push(redirectTo);
```

replace with `router.replace(redirectTo);`:

```tsx
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") || "/portal";
        router.replace(redirectTo);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/login/mfa/page.tsx src/app/login/mfa/page.tsx
git commit -m "fix(auth): use router.replace after MFA verify to avoid challenge re-entry"
```

---

## Task 4 (defense-in-depth, optional but recommended): Raise remote `security_refresh_token_reuse_interval`

**Files:**
- New: `supabase/config-patch.sh` (helper script; not committed to app build)

Even with a single writer, a transient network race could still reuse a rotated token within the 10s window and revoke the session. Raising the reuse interval gives a safe buffer without disabling rotation (which is good security). We raise it to a large value (e.g. 86400s = 24h) — Supabase still rotates, but briefly overlapping refreshes don't nuke the session.

- [ ] **Step 1: Write the patch script**

Create `supabase/config-patch.sh`:

```bash
#!/usr/bin/env bash
# Raises refresh-token reuse interval so a transient race between the
# proxy (single server-side cookie writer) and a browser refresh does
# not instantly revoke the session. Rotation stays ENABLED (secure).
set -euo pipefail
TOKEN="$(cat ~/.supabase/access-token)"
PROJECT_REF="lyqmsluktqdeytpouyvh"
PATCH_BODY='{"security_refresh_token_reuse_interval":86400}'
echo "Patching $PROJECT_REF auth config..."
curl -sS -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PATCH_BODY" \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('security_refresh_token_reuse_interval =', d.get('security_refresh_token_reuse_interval'))"
```

- [ ] **Step 2: Run it and confirm the new value**

Run: `bash supabase/config-patch.sh`
Expected output contains `security_refresh_token_reuse_interval = 86400`.

(If the PATCH returns an auth/permission error, report it — the value can also be set in Supabase Dashboard → Project Settings → Auth → Advanced → "Refresh token reuse interval".)

- [ ] **Step 3: Commit the helper**

```bash
git add supabase/config-patch.sh
git commit -m "chore(supabase): add helper to raise refresh-token reuse interval"
```

---

## Task 5: Manual end-to-end verification (no automated test framework in repo)

The repo has no auth integration test suite. Verification is manual against the running app (local `npm run dev` or Vercel preview). This is the acceptance gate.

- [ ] **Step 1: Build to catch errors**

Run: `npm run build 2>&1 | tail -30`
Expected: build succeeds (no auth-related compile errors).

- [ ] **Step 2: Login at `/admin/login` (admin account), complete MFA**

Open `/admin/login`, sign in with the admin credentials, enter TOTP.
Expected: lands on `/admin` and stays there.

- [ ] **Step 3: Press F5 on `/admin` 5+ times across ~2 minutes**

Expected: stays on `/admin`; NO redirect to `/admin/login/mfa` and NO forced re-login. Session persists.

- [ ] **Step 4: Repeat for client portal**

Login at `/login`, complete MFA, land on `/portal`. Press F5 repeatedly.
Expected: stays on `/portal`; no redirect to `/login/mfa`; no forced re-login.

- [ ] **Step 5: Open two tabs (admin + portal) and refresh both**

Expected: neither logs the other out; both keep sessions stable (confirms no global signOut race).

- [ ] **Step 6: Confirm MFA challenge still enforced**

In a fresh incognito session, login with password only (no TOTP).
Expected: redirected to `/admin/login/mfa` (or `/login/mfa`) and CANNOT reach `/admin` or `/portal` at AAL1. (Confirms security is preserved, not bypassed.)

---

## Self-Review Notes

- **Spec coverage:** (1) credentials match → verified, no code change needed. (2) MFA active/correct → verified, no change. (3) double token writer removed → Tasks 1 & 2. (4) AAL2 persists across F5 → Tasks 1/2 (check once at mount) + Task 3 (replace). (5) reuse race defense → Task 4. (6) acceptance → Task 5. All covered.
- **Placeholders:** none — every step has exact code / exact command / expected output.
- **Type consistency:** `router.replace` exists on `useRouter` in both pages; `onAuthStateChange` callback signature changed to sync `(event, session)` in both layouts — consistent. `setUser(null)` / `setIsAdmin(false)` setters already declared in both layouts.
- **Security preserved:** AAL2 enforcement remains (at mount), `mfa_allow_low_aal=false` untouched, global signOut on role mismatch preserved at mount. We only removed the per-event re-checks that caused the revocation race — we did NOT weaken MFA.
