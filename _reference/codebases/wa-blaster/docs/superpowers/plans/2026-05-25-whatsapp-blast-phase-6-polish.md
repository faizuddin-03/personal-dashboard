# WhatsApp Blast — Phase 6: Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address accumulated tech debt from per-phase code reviews — refresh-token rotation + auth persistence so page reloads no longer kick the user out, logout endpoint that clears the refresh cookie, login-rate-limiting, self-deletion guard, ConfigService consistency, mock-mode startup warning, reset-password UI feedback, operator-role E2E coverage, and a fix for the contacts E2E pagination flakiness.

**Architecture:** Auth becomes stateless-but-persistent: access token still in memory (XSS-safe), refresh token in HTTP-only cookie. On page load, `AuthProvider` calls `/auth/refresh` once before rendering; on mid-session 401, the axios interceptor transparently refreshes and retries. Login + refresh endpoints get throttled per-IP via `@nestjs/throttler`. Backend tightens correctness in three small surgical edits (users self-delete guard, `process.env.NODE_ENV` → `ConfigService`, mock-mode startup warning).

**Tech Stack:** `@nestjs/throttler` (new dep — rate limiting), existing axios interceptor pattern, existing NestJS + React + React Query. No frontend deps added.

**Spec reference:** `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md` — section 11 ("Phase 6 deferred items") and the "What this plan does NOT do" trailers in plans 1–5.

**Branch:** `feat/phase-6-polish` off the merged `master` (includes Phases 1-5).

---

## File Structure

```
apps/api/
  src/
    auth/
      auth.module.ts                       # MODIFIED — register ThrottlerModule
      auth.controller.ts                   # MODIFIED — add refresh + logout endpoints, throttler decorators, fix NODE_ENV
      auth.service.ts                      # MODIFIED — add refreshTokens + helper
      __tests__/
        auth.controller.spec.ts            # MODIFIED — add tests for refresh + logout
    users/
      users.service.ts                     # MODIFIED — self-deletion guard
      users.controller.ts                  # MODIFIED — pass actor user to remove
      __tests__/
        users.controller.spec.ts           # MODIFIED — add self-deletion test
    main.ts                                # MODIFIED — startup warning if MOCK_MODE=false but no token
    app.module.ts                          # MODIFIED — register ThrottlerModule globally (optional — auth.module is fine)
  package.json                             # MODIFIED — add @nestjs/throttler

apps/web/
  src/
    api/
      client.ts                            # MODIFIED — axios response interceptor for 401 → refresh → retry
      auth.ts                              # MODIFIED — add refresh() + logout() functions
    auth/
      AuthContext.tsx                      # MODIFIED — initial /auth/refresh on mount, isInitializing flag, logout calls API
      ProtectedRoute.tsx                   # MODIFIED — block render while initializing
    pages/
      Settings.tsx                         # MODIFIED — replace window.prompt with proper modal; add success/error feedback
    components/
      Modal.tsx                            # NEW — simple controlled modal component (reused for password reset)
      Toast.tsx                            # NEW — minimal success/error toast for user feedback

e2e/
  tests/
    operator.spec.ts                       # NEW — operator-role tests (forbidden routes, allowed routes)
    contacts.spec.ts                       # MODIFIED — fix pagination flakiness (search for renamed contact via search box)

README.md                                  # MODIFIED — Phase 6 section + note about local dev MOCK_MODE
```

**Responsibility per key file:**

- `AuthContext.tsx` becomes the orchestration point for auth lifecycle: initial-load refresh, post-login state, logout API call, error fall-through.
- `client.ts` interceptor is the single place where 401s get auto-recovered — keeps every page agnostic of token expiry.
- `Modal.tsx` is a primitive component, not opinionated. Used by Settings now; available for other forms later.

---

## Task 1: Branch Setup

- [ ] **Step 1: Update master and create branch**

```bash
git checkout master
git pull origin master
git checkout -b feat/phase-6-polish
git status
```

Expected: `On branch feat/phase-6-polish`, clean tree.

No commit yet.

---

## Task 2: Install `@nestjs/throttler` and Wire It Into AuthModule

**Files:**
- Modify: `apps/api/package.json` — add `@nestjs/throttler`
- Modify: `apps/api/src/auth/auth.module.ts` — register `ThrottlerModule.forRoot()`

- [ ] **Step 1: Install dep**

```bash
pnpm --filter api add @nestjs/throttler
```

(If pnpm not on PATH: `corepack pnpm --filter api add @nestjs/throttler`.)

- [ ] **Step 2: Update `apps/api/src/auth/auth.module.ts`**

Read the existing module. Add `ThrottlerModule` to the imports list. The `ThrottlerGuard` will be applied per-route via decorators (we don't make it global because we only want rate limits on auth, not on every API call).

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),  // 10 requests per IP per 60s by default
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtStrategy],
  exports: [AuthService, PasswordService, JwtModule, PassportModule],
})
export class AuthModule {}
```

NOTE: Keep all existing imports + providers in their current positions. Only add `ThrottlerModule` to imports.

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/api/src/auth/auth.module.ts pnpm-lock.yaml
git commit -m "feat(auth): install and register @nestjs/throttler for auth route rate limiting"
```

---

## Task 3: Add Refresh-Token Endpoint to AuthController (TDD)

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts` — add `refreshTokens(refreshToken: string)` method
- Modify: `apps/api/src/auth/auth.controller.ts` — add `POST /auth/refresh` endpoint, also apply throttling
- Modify: `apps/api/src/auth/__tests__/auth.controller.spec.ts` — add tests for refresh endpoint

The refresh flow:
1. Client sends `POST /api/auth/refresh` with the `refresh_token` cookie automatically attached
2. Server verifies the cookie's JWT signature using `JWT_REFRESH_SECRET`
3. If valid, looks up the user (re-checks isActive)
4. Issues a new access token + a new refresh token (rotation)
5. Sets new refresh cookie, returns new access token + user in the body

- [ ] **Step 1: Write the failing test**

Add to `apps/api/src/auth/__tests__/auth.controller.spec.ts` (inside the existing `describe('AuthController', ...)` block):

```typescript
  describe('POST /auth/refresh', () => {
    it('issues new tokens when refresh cookie is valid', async () => {
      mockAuthService.refreshTokens = jest.fn().mockResolvedValue({
        accessToken: 'new.access',
        refreshToken: 'new.refresh',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN', name: null },
      });
      const req = { cookies: { refresh_token: 'old.refresh' } } as any;
      const res = { cookie: jest.fn() } as any;

      const result = await controller.refresh(req, res);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('old.refresh');
      expect(result).toEqual({
        accessToken: 'new.access',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN', name: null },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new.refresh',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
      );
    });

    it('throws UnauthorizedException when no cookie present', async () => {
      const req = { cookies: {} } as any;
      const res = { cookie: jest.fn() } as any;
      await expect(controller.refresh(req, res)).rejects.toThrow(/missing refresh token/i);
    });

    it('throws UnauthorizedException when service rejects', async () => {
      mockAuthService.refreshTokens = jest.fn().mockRejectedValue(new (require('@nestjs/common').UnauthorizedException)());
      const req = { cookies: { refresh_token: 'bad' } } as any;
      const res = { cookie: jest.fn() } as any;
      await expect(controller.refresh(req, res)).rejects.toThrow();
    });
  });
```

ALSO: the existing `AuthController` constructor test setup mocks `AuthService` with only the `login` method. The setup needs to be extended so `mockAuthService.refreshTokens` can be assigned without TypeScript complaints. Update the existing `mockAuthService` declaration at the top of the `beforeEach`:

```typescript
    mockAuthService = {
      login: jest.fn(),
      refreshTokens: jest.fn(),
    } as any;
```

(The `as any` widens the type so the spec block above can reassign methods freely.)

- [ ] **Step 2: Add `refreshTokens` to `AuthService`**

Read `apps/api/src/auth/auth.service.ts`. Append a new method after the existing `login` method:

```typescript
  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; type?: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException();
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: Number(this.config.get<string>('JWT_ACCESS_TTL', '900')),
      },
    );
    const newRefreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.config.get<string>('JWT_REFRESH_TTL', '1209600')),
      },
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    };
  }
```

- [ ] **Step 3: Add the `POST /auth/refresh` endpoint to `AuthController`**

Read `apps/api/src/auth/auth.controller.ts`. Add `Req` to the imports and the `ThrottlerGuard` + `Throttle` from `@nestjs/throttler`:

```typescript
import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
```

Apply `@UseGuards(ThrottlerGuard)` at the class level (so all auth routes are rate-limited) and add the new endpoint. The final controller class should look like:

```typescript
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })  // 5 login attempts per IP per minute
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.login(dto.email, dto.password);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })  // 10 refreshes per IP per minute
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string> | undefined)?.refresh_token;
    if (!token) throw new UnauthorizedException('missing refresh token');
    const { accessToken, refreshToken, user } = await this.auth.refreshTokens(token);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const ttl = Number(this.config.get<string>('JWT_REFRESH_TTL', '1209600'));
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: ttl * 1000,
      path: '/api/auth',
    });
  }
}
```

NOTE: The original `login` method set the cookie inline. We extract that into a private `setRefreshCookie` helper so both routes share it. Also we now use `config.get('NODE_ENV')` instead of `process.env.NODE_ENV` — this addresses the Phase 1 final-review concern.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/auth
git commit -m "feat(auth): add /auth/refresh endpoint with token rotation + throttling"
```

---

## Task 4: Add Logout Endpoint

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts` — add `POST /auth/logout`
- Modify: `apps/api/src/auth/__tests__/auth.controller.spec.ts` — add logout test

- [ ] **Step 1: Write the failing test**

Append to the `describe('AuthController', ...)` block in the spec:

```typescript
  describe('POST /auth/logout', () => {
    it('clears the refresh cookie', async () => {
      const res = { clearCookie: jest.fn() } as any;
      await controller.logout(res);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ path: '/api/auth' }),
      );
    });

    it('returns success even when no cookie present (idempotent)', async () => {
      const res = { clearCookie: jest.fn() } as any;
      const result = await controller.logout(res);
      expect(result).toEqual({ ok: true });
    });
  });
```

- [ ] **Step 2: Add the logout endpoint to `AuthController`**

Add this method to the existing `AuthController` class, after the `refresh` method:

```typescript
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { ok: true };
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/auth/auth.controller.ts apps/api/src/auth/__tests__/auth.controller.spec.ts
git commit -m "feat(auth): add /auth/logout endpoint that clears the refresh cookie"
```

---

## Task 5: Self-Deletion Guard on Users

**Files:**
- Modify: `apps/api/src/users/users.service.ts` — `remove(id, actorUserId)` signature change
- Modify: `apps/api/src/users/users.controller.ts` — pass actor user id
- Modify: `apps/api/src/users/__tests__/users.controller.spec.ts` — add tests

- [ ] **Step 1: Write the failing tests**

Update the existing tests in `apps/api/src/users/__tests__/users.controller.spec.ts`. Find the `DELETE /users/:id` test and update it (the service mock now receives 2 args). Also add a new self-delete blocking test:

Replace the existing delete test:
```typescript
  it('DELETE /users/:id removes user', async () => {
    service.remove.mockResolvedValue(undefined);
    const req = { user: { id: 'u-admin' } } as any;
    await controller.remove('u1', req);
    expect(service.remove).toHaveBeenCalledWith('u1', 'u-admin');
  });
```

Add a new test:
```typescript
  it('DELETE /users/:id rejects when admin tries to delete themselves', async () => {
    service.remove.mockRejectedValue(new (require('@nestjs/common').ForbiddenException)('cannot delete yourself'));
    const req = { user: { id: 'u-admin' } } as any;
    await expect(controller.remove('u-admin', req)).rejects.toThrow(/cannot delete yourself/i);
  });
```

- [ ] **Step 2: Update `UsersService.remove` to take `actorUserId` and guard**

Read `apps/api/src/users/users.service.ts`. Find the existing `remove(id)` method and update its signature and body:

```typescript
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
// ...

  async remove(id: string, actorUserId: string) {
    if (id === actorUserId) {
      throw new ForbiddenException('cannot delete yourself');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    await this.prisma.user.delete({ where: { id } });
  }
```

(Import `ForbiddenException` from `@nestjs/common` if not already present.)

- [ ] **Step 3: Update `UsersController.remove` to pass the actor's id**

Read `apps/api/src/users/users.controller.ts`. Add `Req` to the NestJS imports if not present:

```typescript
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
```

Update the `remove` method:

```typescript
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @Req() req: Request) {
    const actorUserId = (req.user as { id: string }).id;
    return this.users.remove(id, actorUserId);
  }
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/users
git commit -m "feat(users): add self-deletion guard on DELETE /users/:id"
```

---

## Task 6: Mock-Mode Startup Warning

**Files:**
- Modify: `apps/api/src/main.ts` — log a clear WARN if `WHATSAPP_MOCK_MODE=false` but `WHATSAPP_ACCESS_TOKEN` is missing/empty

- [ ] **Step 1: Update `apps/api/src/main.ts`**

Read the existing `main.ts`. Find the `bootstrap()` function. After the app is configured but BEFORE `app.listen(...)`, add a startup check:

```typescript
  // Phase 6: warn if real Meta is enabled without credentials (catches local .env drift)
  const mockMode = config.get<string>('WHATSAPP_MOCK_MODE', 'true') === 'true';
  const accessToken = config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
  if (!mockMode && !accessToken) {
    const logger = new Logger('Bootstrap');
    logger.warn('WHATSAPP_MOCK_MODE=false but WHATSAPP_ACCESS_TOKEN is empty — Meta calls will fail with auth errors.');
    logger.warn('Either set WHATSAPP_MOCK_MODE=true in .env for local dev, or fill in real credentials.');
  }
```

Add the `Logger` import at the top if not present:
```typescript
import { Logger, ValidationPipe } from '@nestjs/common';
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/main.ts
git commit -m "feat(api): warn at startup when mock mode is off but no token configured"
```

---

## Task 7: Frontend Auth API — Add `refresh()` and `logout()`

**Files:**
- Modify: `apps/web/src/api/auth.ts` — add 2 new functions

- [ ] **Step 1: Update `apps/web/src/api/auth.ts`**

Append after the existing `login` function:

```typescript
export async function refreshAccessToken(): Promise<LoginResponse> {
  // The refresh_token cookie is sent automatically because the axios instance
  // has withCredentials: true. The server reads it and returns a new access token.
  const { data } = await api.post<LoginResponse>('/auth/refresh');
  return data;
}

export async function logoutOnServer(): Promise<void> {
  // Best-effort; we ignore errors so client-side cleanup proceeds regardless.
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/api/auth.ts
git commit -m "feat(web): add refreshAccessToken and logoutOnServer API helpers"
```

---

## Task 8: Axios Interceptor — Auto-Refresh on 401

**Files:**
- Modify: `apps/web/src/api/client.ts` — add response interceptor that handles 401 by calling /auth/refresh and retrying

- [ ] **Step 1: Replace `apps/web/src/api/client.ts` with the expanded version**

```typescript
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Marker we attach to AxiosRequestConfig to prevent infinite retry loops.
interface RetryableRequest extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined;
    if (!original) throw error;
    // Don't retry the refresh endpoint itself, and don't retry if we already retried.
    const isRefreshCall = typeof original.url === 'string' && original.url.includes('/auth/refresh');
    if (error.response?.status !== 401 || original._retried || isRefreshCall) {
      throw error;
    }
    original._retried = true;

    // Share the refresh promise across concurrent 401s so we only refresh once.
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
          accessToken = data.accessToken;
          return data.accessToken;
        } catch (err) {
          // Refresh failed → user must log in again
          accessToken = null;
          throw err;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    try {
      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api.request(original);
    } catch {
      throw error;
    }
  },
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/api/client.ts
git commit -m "feat(web): axios response interceptor auto-refreshes on 401 and retries the request"
```

---

## Task 9: AuthContext — Initial Refresh on Mount, Logout API, Loading State

**Files:**
- Modify: `apps/web/src/auth/AuthContext.tsx` — add `isInitializing`, call `/auth/refresh` on mount, call logout API on logout

- [ ] **Step 1: Replace `apps/web/src/auth/AuthContext.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { CurrentUser, login as loginApi, logoutOnServer, refreshAccessToken } from '../api/auth';
import { setAccessToken } from '../api/client';

interface AuthState {
  user: CurrentUser | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // On mount, attempt to resume the session by exchanging the refresh cookie for a new access token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { accessToken, user: refreshedUser } = await refreshAccessToken();
        if (!cancelled) {
          setAccessToken(accessToken);
          setUser(refreshedUser);
        }
      } catch {
        // No valid refresh cookie — user must log in.
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: loggedInUser } = await loginApi(email, password);
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutOnServer();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isInitializing, login, logout }), [user, isInitializing, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/auth/AuthContext.tsx
git commit -m "feat(web): persist auth across reloads via initial /auth/refresh + logout endpoint"
```

---

## Task 10: ProtectedRoute Honors `isInitializing`

**Files:**
- Modify: `apps/web/src/auth/ProtectedRoute.tsx` — don't redirect to /login during initialization

Without this, ProtectedRoute briefly sees `user=null` during the initial refresh fetch and bounces to /login before the refresh completes.

- [ ] **Step 1: Update `apps/web/src/auth/ProtectedRoute.tsx`**

Replace the existing component:

```tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../api/auth';

interface Props {
  children: ReactNode;
  requireRole?: Role;
}

export function ProtectedRoute({ children, requireRole }: Props) {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="auth-loading">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/auth/ProtectedRoute.tsx
git commit -m "feat(web): show loading state during initial auth refresh in ProtectedRoute"
```

---

## Task 11: Settings UX — Replace `window.prompt` with Modal + Toast Feedback

**Files:**
- Create: `apps/web/src/components/Modal.tsx`, `apps/web/src/components/Toast.tsx`
- Modify: `apps/web/src/pages/Settings.tsx` — use Modal for password reset; show toast on success/error

- [ ] **Step 1: Create `apps/web/src/components/Modal.tsx`**

```tsx
import { ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({ open, title, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="modal-backdrop"
    >
      <div
        className="bg-white rounded shadow-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-xl leading-none" aria-label="close">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/components/Toast.tsx`**

A minimal toast that shows a single message and auto-dismisses. Used as a controlled component — parent owns the state.

```tsx
import { useEffect } from 'react';

interface Props {
  message: string | null;
  variant?: 'success' | 'error';
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({ message, variant = 'success', onDismiss, durationMs = 4000 }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  const styles = variant === 'success'
    ? 'bg-green-50 border-green-200 text-green-800'
    : 'bg-red-50 border-red-200 text-red-800';

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded border shadow-md text-sm ${styles}`}
      data-testid={`toast-${variant}`}
      role="status"
    >
      {message}
    </div>
  );
}
```

- [ ] **Step 3: Update `apps/web/src/pages/Settings.tsx` to use Modal + Toast**

Read the existing Settings page. Find the existing `onResetPassword` handler that uses `window.prompt`. Replace the imports and the reset-password flow:

Add imports near the top:
```typescript
import { useState } from 'react';  // if not already imported
import Modal from '../components/Modal';
import Toast from '../components/Toast';
```

Replace the existing `onResetPassword` function and add new state. Inside the Settings component, near the other `useState` calls, add:

```typescript
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetPassword, setResetPasswordValue] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
```

Replace the existing `reset` mutation block (which uses `useMutation`) with a version that surfaces success/error toasts:

```typescript
  const reset = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => resetUserPassword(id, password),
    onSuccess: () => {
      setToast({ message: 'Password reset successfully', variant: 'success' });
      setResetUser(null);
      setResetPasswordValue('');
    },
    onError: () => {
      setToast({ message: 'Failed to reset password', variant: 'error' });
    },
  });
```

Replace the existing `onResetPassword` function with:
```typescript
  function onResetPassword(user: UserRow) {
    setResetUser(user);
    setResetPasswordValue('');
  }

  function submitResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (resetUser && resetPassword.length >= 8) {
      reset.mutate({ id: resetUser.id, password: resetPassword });
    }
  }
```

Then add the Modal and Toast JSX at the very bottom of the Settings component's return (just before the closing `</div>`):

```tsx
      <Modal
        open={!!resetUser}
        title={`Reset password for ${resetUser?.email ?? ''}`}
        onClose={() => setResetUser(null)}
      >
        <form onSubmit={submitResetPassword} className="space-y-3" data-testid="reset-password-form">
          <input
            type="password"
            required
            minLength={8}
            value={resetPassword}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="w-full border rounded px-3 py-2"
            data-testid="reset-password-input"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setResetUser(null)} className="text-gray-600 px-3 py-1.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={reset.isPending || resetPassword.length < 8}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium disabled:opacity-50"
              data-testid="reset-password-submit"
            >
              {reset.isPending ? 'Resetting…' : 'Reset password'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
```

NOTE: There may already be a `useState` import — leave it. The existing user-management code stays; you're only touching the reset-password related parts.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/Modal.tsx apps/web/src/components/Toast.tsx apps/web/src/pages/Settings.tsx
git commit -m "feat(web): replace window.prompt password reset with modal + toast feedback"
```

---

## Task 12: E2E — Operator Role Coverage + Contacts Pagination Fix

**Files:**
- Create: `e2e/tests/operator.spec.ts`
- Modify: `e2e/tests/contacts.spec.ts` — fix the renamed-contact-not-visible-after-edit flakiness using the search box

- [ ] **Step 1: Create `e2e/tests/operator.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
const OPERATOR_EMAIL = 'operator@example.com';
const OPERATOR_PASSWORD = 'OperatorPass123!';

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Operator role coverage', () => {
  test.beforeAll(async ({ request }) => {
    // Use the API directly to ensure the operator user exists. Idempotent.
    // First, log in as admin to get a token.
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { accessToken } = await loginRes.json();

    // Try to create the operator. If it already exists, the 409 is fine.
    await request.post('http://localhost:3000/api/users', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { email: OPERATOR_EMAIL, password: OPERATOR_PASSWORD, role: 'OPERATOR' },
    });
  });

  test('operator sees Dashboard/Contacts/Segments/Templates/Blasts but NOT Settings', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contacts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Segments' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Templates' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Blasts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  });

  test('operator gets redirected when trying to access /settings via link click is impossible (no link rendered) — but direct nav also bounces', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    // Direct navigation should bounce back to root (because Phase 6 made auth persistent across reloads).
    await page.goto('/settings');
    // The ProtectedRoute will see role !== 'ADMIN' and redirect to /.
    await expect(page).toHaveURL(/\/$/);
  });

  test('operator can view Contacts but not Settings buttons', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.getByRole('link', { name: 'Contacts' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await expect(page.getByTestId('add-contact')).toBeVisible();
  });
});
```

- [ ] **Step 2: Fix `e2e/tests/contacts.spec.ts` pagination flakiness**

Read the existing file. Find the test `'admin creates a contact, sees it in the list, edits it, deletes it'`. The issue: after editing a contact's name to "E2E Renamed", the test looks for that text on the list page, but with many contacts the renamed one may not be on page 1.

Fix: use the search input to filter to the renamed contact instead of relying on it being visible by default.

Locate this section in the test (the part AFTER `submit` is clicked following the rename):
```typescript
    await page.getByTestId('contact-submit').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByText('E2E Renamed')).toBeVisible();
```

Replace with:
```typescript
    await page.getByTestId('contact-submit').click();
    await expect(page).toHaveURL(/\/contacts$/);
    // Filter to find the renamed contact — avoids pagination flakiness.
    await page.getByTestId('contacts-search').fill('E2E Renamed');
    await expect(page.getByText('E2E Renamed')).toBeVisible();
```

And in the delete section, also use the search to find the row before clicking Edit:
```typescript
    // Delete it
    page.once('dialog', (d) => d.accept());
    await page.getByText('E2E Renamed').locator('xpath=ancestor::tr').getByRole('link', { name: 'Edit' }).click();
    await page.getByTestId('contact-delete').click();
    await expect(page).toHaveURL(/\/contacts$/);
    // After delete, search should return zero results.
    await page.getByTestId('contacts-search').fill('E2E Renamed');
    await expect(page.getByText('E2E Renamed')).toHaveCount(0);
```

Note: the search box was already triggered earlier so it might already have content. Make sure to use `.fill()` which clears first.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/operator.spec.ts e2e/tests/contacts.spec.ts
git commit -m "test(e2e): add operator role coverage + fix contacts pagination flakiness"
```

---

## Task 13: Auth Persistence E2E Test

**Files:**
- Create: `e2e/tests/auth-persistence.spec.ts` — verify that page reload keeps the session

This proves the Phase 6 refresh-on-mount works end-to-end. Until this phase, `page.reload()` in E2E broke auth state (we kept hitting it as a footgun).

- [ ] **Step 1: Create `e2e/tests/auth-persistence.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

test.describe('Auth persistence', () => {
  test('admin stays logged in after a page reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    // The whole point of Phase 6: this reload should NOT bounce to /login.
    await page.reload();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('current-user')).toHaveText(ADMIN_EMAIL);
  });

  test('admin gets bounced to /login after logout, even on reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);

    // After logout the refresh cookie is cleared on the server. Reload should stay on /login.
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add e2e/tests/auth-persistence.spec.ts
git commit -m "test(e2e): verify session persists across page reload and is cleared on logout"
```

---

## Task 14: Docs + Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update `README.md`**

Find the "Phase 5 — what's done" section. Insert "Phase 6 — what's done" after it:

```markdown
## Phase 6 — what's done

- Refresh-token rotation endpoint (`POST /api/auth/refresh`) with throttling (10/min/IP)
- Logout endpoint (`POST /api/auth/logout`) that clears the refresh cookie
- Login route throttled (5/min/IP) to deter brute-force
- Self-deletion guard on `DELETE /api/users/:id` (admins can't delete themselves)
- `process.env.NODE_ENV` replaced with `ConfigService.get('NODE_ENV')` in auth controller (consistency)
- Startup warning when `WHATSAPP_MOCK_MODE=false` but `WHATSAPP_ACCESS_TOKEN` is empty (catches local `.env` drift)
- Frontend auth persists across page reloads: AuthContext calls `/auth/refresh` on mount and shows a brief "Loading…" state via `ProtectedRoute`
- Axios interceptor auto-refreshes on 401 mid-session and retries the original request transparently
- Password reset uses a modal + toast feedback instead of `window.prompt`/silent UX
- E2E coverage for operator role (cannot see Settings link, cannot access `/settings` even via direct URL)
- E2E coverage for auth persistence (page reload keeps the session; logout clears it)
- Contacts E2E pagination flakiness fixed via search filter
```

Remove "Phase 6: polish" from the "Coming in later phases" line (delete that line entirely since it was the last phase):

If the current README has:
```markdown
Phase 6: polish.
```

Delete that line, OR replace with a single line:
```markdown
All phases complete. Next steps are out-of-scope items: AWS deployment, real customer onboarding, etc.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Phase 6 README section and mark all phases complete"
```

- [ ] **Step 3: FINAL VERIFICATION**

```bash
# Reset state
docker compose down -v
docker compose up -d
sleep 10

pnpm install
pnpm db:migrate
pnpm db:seed
```

Expected: all clean. 5 migrations apply.

```bash
# Run all API unit tests
pnpm --filter api test
```

Expected: ~130-140 tests pass. Phase 6 adds: auth.controller +5 (3 refresh + 2 logout), users.controller +1.

```bash
# Build web
pnpm --filter web build
```

Expected: clean tsc + vite.

```bash
# 3 dev servers
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
nohup pnpm --filter api dev:worker > /tmp/worker.log 2>&1 &
WORKER_PID=$!
nohup pnpm --filter web dev > /tmp/web.log 2>&1 &
WEB_PID=$!
sleep 20

curl -s -o /dev/null -w "API: %{http_code}\n" http://localhost:3000/api/health
curl -s -o /dev/null -w "Web: %{http_code}\n" http://localhost:5173/

# Verify the new auth endpoints exist
curl -s -o /dev/null -w "Refresh (no cookie): %{http_code}\n" -X POST http://localhost:3000/api/auth/refresh
# Expected: 401 (no cookie)
curl -s -o /dev/null -w "Logout: %{http_code}\n" -X POST http://localhost:3000/api/auth/logout
# Expected: 201

pnpm --filter e2e test

kill $API_PID $WORKER_PID $WEB_PID 2>/dev/null
```

Expected: 18 E2E tests pass (3 Phase 1 + 3 Phase 2 + 2 Phase 3 + 2 Phase 4 + 3 Phase 5 + 3 operator + 2 auth-persistence).

- [ ] **Step 4: Tag**

```bash
git tag -a phase-6-complete -m "Phase 6 complete: auth persistence, rate limiting, self-deletion guard, UX polish"
git tag -a v1.0.0 -m "Version 1.0 — all 6 phases of the WhatsApp Blast System complete"
```

The `v1.0.0` tag marks the end of the planned implementation. The system is feature-complete per the spec.

- [ ] **Step 5: Final state**

```bash
git log --oneline | head -25
git tag --list
git status
```

---

## What this plan does NOT do (intentionally — out of scope)

- **Email service** (invites, password reset emails) — admin still creates accounts inline. If you eventually need email, add Resend/SES + a `/auth/forgot-password` flow. Roughly 1-2 days.
- **Activity log / audit trail UI** — `message_events` already captures Meta webhook history; a future "audit log" surface would need a separate table for user actions (created template, scheduled blast, deleted contact, etc.). Track as a follow-up if compliance ever requires it.
- **Image/video/document template headers** — current text-only header support is enough for typical marketing use. Adding media headers requires file upload to Meta's media endpoints + storing the media handle. ~1 week of work.
- **Bulk-edit / clone blast** — schedule one at a time today. If marketing volume grows, add a "clone" button next to each blast in the list.
- **Custom domain on AWS** — covered in the future AWS migration phase, not Phase 6.
- **Backup/restore tooling** — RDS handles automated daily snapshots once you're on AWS. For local dev, `pg_dump` is fine ad-hoc.
- **PDPA data subject request tooling** — handled by you out-of-band per the design spec section 16.
- **WebSocket / SSE** — polling at 5s remains adequate at current scale. The architecture supports adding this later (the worker could emit job events to Redis Pub/Sub, the web could subscribe via a NestJS gateway) but adds complexity not justified by current load.
- **The original spec's chatbot integration (Phase 2 of larger product)** — that's a separate Python project. Phase 6 of THIS project doesn't touch it. `inbound_messages.routed_to` enum is already in place for when that project starts.

---

## Phase 6 Highlights — Why These Items Together?

These changes share a common theme: **friction the team hits during real use** that we punted on while building features. None are individually critical, but together they make the system feel polished rather than half-built:

- The auth-on-reload issue has surfaced in nearly every phase's E2E testing. Fixing it once removes a permanent footgun.
- Rate limiting was always "we'll add it later" — `@nestjs/throttler` is a 2-line addition that closes a real attack vector.
- The self-deletion guard prevents a foot-shooting accident that has bitten some teams.
- The mock-mode startup warning was discovered during Phase 5's final verification when `.env` drift broke E2E. Fixing it costs 5 lines.

Phase 6 is small in code volume (~300 lines) but high in user-perceived quality.
