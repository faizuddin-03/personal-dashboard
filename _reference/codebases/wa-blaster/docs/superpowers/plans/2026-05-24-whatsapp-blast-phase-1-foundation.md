# WhatsApp Blast — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working monorepo with Dockerized Postgres + Redis, a NestJS API with JWT auth and admin/operator role-based user management, and a React SPA where an admin can log in and manage other users.

**Architecture:** pnpm monorepo with two apps (`apps/api` NestJS, `apps/web` Vite+React SPA). Postgres via Prisma. Auth = short-lived JWT access token + HTTP-only refresh cookie. Two roles: `ADMIN` (full access including Settings) and `OPERATOR` (no Settings access). E2E smoke test with Playwright proves login → dashboard works.

**Tech Stack:** TypeScript, Node.js 20, NestJS 10, React 18, Vite 5, Prisma 5, PostgreSQL 16, Redis 7, BullMQ (set up but unused until Phase 4), bcrypt, jsonwebtoken, Jest, Playwright, Docker Compose, Tailwind CSS, React Query, React Router 6.

**Spec reference:** `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md`

---

## File Structure

```
untitled/
├── .gitignore
├── .editorconfig
├── docker-compose.yml
├── package.json                          # root, manages workspaces
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── README.md
│
├── apps/
│   ├── api/                              # NestJS backend
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── jest.config.js
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── prisma/
│   │       │   ├── prisma.module.ts
│   │       │   └── prisma.service.ts
│   │       ├── auth/
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── password.service.ts
│   │       │   ├── jwt.strategy.ts
│   │       │   ├── jwt-auth.guard.ts
│   │       │   ├── roles.guard.ts
│   │       │   ├── roles.decorator.ts
│   │       │   ├── dto/
│   │       │   │   ├── login.dto.ts
│   │       │   │   └── refresh.dto.ts
│   │       │   └── __tests__/
│   │       │       ├── password.service.spec.ts
│   │       │       └── auth.controller.spec.ts
│   │       ├── users/
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   ├── dto/
│   │       │   │   ├── create-user.dto.ts
│   │       │   │   └── update-user.dto.ts
│   │       │   └── __tests__/
│   │       │       └── users.controller.spec.ts
│   │       └── health/
│   │           └── health.controller.ts
│   │
│   └── web/                              # React SPA
│       ├── .env.example
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── index.css
│           ├── api/
│           │   ├── client.ts
│           │   ├── auth.ts
│           │   └── users.ts
│           ├── auth/
│           │   ├── AuthContext.tsx
│           │   └── ProtectedRoute.tsx
│           ├── components/
│           │   └── Layout.tsx
│           └── pages/
│               ├── Login.tsx
│               ├── Dashboard.tsx
│               └── Settings.tsx
│
└── e2e/                                  # Playwright tests
    ├── package.json
    ├── playwright.config.ts
    └── tests/
        └── login.spec.ts
```

**Responsibility per file:**

- `apps/api/src/prisma/prisma.service.ts` — wraps PrismaClient, provides DI-friendly access.
- `apps/api/src/auth/password.service.ts` — bcrypt hash/verify utilities.
- `apps/api/src/auth/auth.service.ts` — login logic (verify password, issue tokens).
- `apps/api/src/auth/jwt.strategy.ts` — Passport JWT strategy, extracts user from token.
- `apps/api/src/auth/jwt-auth.guard.ts` — guard requiring valid JWT.
- `apps/api/src/auth/roles.guard.ts` — guard checking user role.
- `apps/api/src/users/users.service.ts` — CRUD for users (admin-only operations).
- `apps/web/src/api/client.ts` — axios instance with refresh-token interceptor.
- `apps/web/src/auth/AuthContext.tsx` — React context holding current user + token.
- `apps/web/src/components/Layout.tsx` — app shell with nav and logout.

---

## Task 1: Initialize Monorepo and Root Files

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `README.md`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "whatsapp-blast",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm --filter './apps/*' build",
    "test": "pnpm --filter './apps/*' test",
    "lint": "pnpm --filter './apps/*' lint",
    "db:migrate": "pnpm --filter api db:migrate",
    "db:seed": "pnpm --filter api db:seed"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'e2e'
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

```
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
build/
*.tsbuildinfo

# Env files
.env
.env.local
.env.*.local

# Editor / OS
.idea/
.vscode/
*.iml
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Test output
coverage/
playwright-report/
test-results/

# Superpowers brainstorm artifacts
.superpowers/

# Claude
.claude/
```

- [ ] **Step 5: Create `.editorconfig`**

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 6: Create `README.md`**

```markdown
# WhatsApp Blast System

Single-tenant marketing-blast system on the WhatsApp Business Cloud API.

## Quick start

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Then visit http://localhost:5173 — log in with the seeded admin credentials printed in the seed script's output.

## Architecture

See `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md`.

## Phase 1 — Foundation

This phase delivers: monorepo, Docker Postgres+Redis, NestJS API with JWT auth, React SPA, user management. See `docs/superpowers/plans/2026-05-24-whatsapp-blast-phase-1-foundation.md`.
```

- [ ] **Step 7: Install pnpm if not already**

Run: `npm install -g pnpm@9` (skip if already installed)

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .editorconfig README.md
git commit -m "chore: initialize pnpm monorepo with workspaces"
```

---

## Task 2: Docker Compose with Postgres and Redis

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: wbs_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: wbs
      POSTGRES_PASSWORD: wbs_dev
      POSTGRES_DB: wbs
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wbs"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: wbs_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Start the stack and verify**

Run: `docker compose up -d`
Then: `docker compose ps`
Expected: both `wbs_postgres` and `wbs_redis` are `running` and healthy.

- [ ] **Step 3: Verify Postgres connectivity**

Run: `docker exec -it wbs_postgres psql -U wbs -d wbs -c "SELECT 1;"`
Expected: returns `1` in a one-row table.

- [ ] **Step 4: Verify Redis connectivity**

Run: `docker exec -it wbs_redis redis-cli PING`
Expected: `PONG`

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add docker-compose for postgres and redis"
```

---

## Task 3: Scaffold NestJS API

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/nest-cli.json`, `apps/api/jest.config.js`, `apps/api/.env.example`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/health/health.controller.ts`

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint \"src/**/*.ts\"",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/bullmq": "^10.1.0",
    "@prisma/client": "^5.13.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "cookie-parser": "^1.4.6",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1",
    "bullmq": "^5.7.0",
    "ioredis": "^5.4.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.1",
    "@nestjs/testing": "^10.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.0",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.13.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "sourceMap": true,
    "incremental": true
  },
  "include": ["src/**/*", "prisma/seed.ts"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 3: Create `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

- [ ] **Step 4: Create `apps/api/jest.config.js`**

```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
```

- [ ] **Step 5: Create `apps/api/.env.example`**

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://wbs:wbs_dev@localhost:5432/wbs
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace-me-in-prod
JWT_REFRESH_SECRET=replace-me-too
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=1209600
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 6: Copy `.env.example` to `.env`**

Run: `cp apps/api/.env.example apps/api/.env`

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`
Expected: all dependencies resolved without errors.

- [ ] **Step 8: Create `apps/api/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 9: Create `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 10: Create `apps/api/src/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 11: Run the API and verify**

Run (in one terminal): `pnpm --filter api dev`
Then (in another): `curl http://localhost:3000/api/health`
Expected: `{"status":"ok","timestamp":"..."}`

Stop the dev server with Ctrl+C.

- [ ] **Step 12: Commit**

```bash
git add apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json apps/api/jest.config.js apps/api/.env.example apps/api/src pnpm-lock.yaml
git commit -m "feat(api): scaffold nestjs app with health endpoint"
```

---

## Task 4: Set Up Prisma with Users Schema

**Files:**
- Create: `apps/api/prisma/schema.prisma`, `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/prisma/prisma.service.ts`

- [ ] **Step 1: Initialize Prisma**

Run: `cd apps/api && pnpm prisma init --datasource-provider postgresql && cd ../..`

This creates `prisma/schema.prisma`. Overwrite it in the next step.

- [ ] **Step 2: Write `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  OPERATOR
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  role         UserRole @default(OPERATOR)
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

- [ ] **Step 3: Run the first migration**

Run: `pnpm --filter api db:migrate -- --name init`
Expected: a migration directory appears under `apps/api/prisma/migrations/`, and the `users` table is created. The Prisma client is generated.

- [ ] **Step 4: Verify the schema in Postgres**

Run: `docker exec -it wbs_postgres psql -U wbs -d wbs -c "\d users"`
Expected: table description with columns `id`, `email`, `password_hash`, `name`, `role`, `is_active`, `created_at`, `updated_at`.

- [ ] **Step 5: Create `apps/api/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 6: Create `apps/api/src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 7: Wire `PrismaModule` into `AppModule`**

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 8: Verify API still starts**

Run: `pnpm --filter api dev`
Expected: starts on port 3000 without errors. Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add apps/api/prisma apps/api/src/prisma apps/api/src/app.module.ts
git commit -m "feat(api): add prisma with User model and initial migration"
```

---

## Task 5: Password Service (TDD)

**Files:**
- Create: `apps/api/src/auth/password.service.ts`, `apps/api/src/auth/__tests__/password.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/auth/__tests__/password.service.spec.ts`:

```typescript
import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes a password to a non-matching string', async () => {
    const hash = await service.hash('hunter2');
    expect(hash).not.toEqual('hunter2');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('hunter2');
    await expect(service.verify('hunter2', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('hunter2');
    await expect(service.verify('wrong', hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm --filter api test password.service`
Expected: FAIL with "Cannot find module '../password.service'".

- [ ] **Step 3: Implement `apps/api/src/auth/password.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
  }

  verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm --filter api test password.service`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/password.service.ts apps/api/src/auth/__tests__/password.service.spec.ts
git commit -m "feat(auth): add bcrypt password service with tests"
```

---

## Task 6: Auth Module — Login Endpoint

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`, `apps/api/src/auth/dto/login.dto.ts`, `apps/api/src/auth/__tests__/auth.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create `apps/api/src/auth/dto/login.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
```

- [ ] **Step 2: Write the failing controller test**

Create `apps/api/src/auth/__tests__/auth.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: { login: jest.Mock };

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'JWT_REFRESH_TTL') return '1209600';
        return fallback;
      }),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('POST /auth/login', () => {
    it('returns access token + sets refresh cookie on valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN' },
      });
      const res = { cookie: jest.fn() } as any;

      const result = await controller.login({ email: 'admin@example.com', password: 'hunter2' }, res);

      expect(result).toEqual({
        accessToken: 'access.jwt.token',
        user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN' },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh.jwt.token',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
      );
    });

    it('throws UnauthorizedException on bad credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());
      const res = { cookie: jest.fn() } as any;

      await expect(
        controller.login({ email: 'admin@example.com', password: 'wrong' }, res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 3: Run test and verify it fails**

Run: `pnpm --filter api test auth.controller`
Expected: FAIL with module-not-found errors.

- [ ] **Step 4: Implement `apps/api/src/auth/auth.service.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    const ok = await this.passwords.verify(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException();

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: Number(this.config.get<string>('JWT_ACCESS_TTL', '900')),
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.config.get<string>('JWT_REFRESH_TTL', '1209600')),
      },
    );

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    };
  }
}
```

- [ ] **Step 5: Implement `apps/api/src/auth/auth.controller.ts`**

```typescript
import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.auth.login(dto.email, dto.password);
    const ttl = Number(this.config.get<string>('JWT_REFRESH_TTL', '1209600'));

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ttl * 1000,
      path: '/api/auth',
    });

    return { accessToken, user };
  }
}
```

- [ ] **Step 6: Implement `apps/api/src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
  exports: [AuthService, PasswordService, JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 7: Wire `AuthModule` into `AppModule`**

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 8: Run tests and verify they pass**

Run: `pnpm --filter api test auth.controller`
Expected: PASS — 2 tests green.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.module.ts
git commit -m "feat(auth): add login endpoint with JWT access + refresh tokens"
```

---

## Task 7: JWT Auth Guard and Role Guard

**Files:**
- Create: `apps/api/src/auth/jwt.strategy.ts`, `apps/api/src/auth/jwt-auth.guard.ts`, `apps/api/src/auth/roles.guard.ts`, `apps/api/src/auth/roles.decorator.ts`
- Modify: `apps/api/src/auth/auth.module.ts`

- [ ] **Step 1: Create `apps/api/src/auth/jwt.strategy.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role };
  }
}
```

- [ ] **Step 2: Create `apps/api/src/auth/jwt-auth.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 3: Create `apps/api/src/auth/roles.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';

export type Role = 'ADMIN' | 'OPERATOR';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 4: Create `apps/api/src/auth/roles.guard.ts`**

```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
```

- [ ] **Step 5: Update `apps/api/src/auth/auth.module.ts` to register the strategy**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtStrategy],
  exports: [AuthService, PasswordService, JwtModule, PassportModule],
})
export class AuthModule {}
```

- [ ] **Step 6: Verify API starts**

Run: `pnpm --filter api dev`
Expected: starts cleanly on port 3000. Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/auth
git commit -m "feat(auth): add JWT strategy, jwt-auth guard, and roles guard"
```

---

## Task 8: Users Module (Admin CRUD)

**Files:**
- Create: `apps/api/src/users/users.module.ts`, `apps/api/src/users/users.controller.ts`, `apps/api/src/users/users.service.ts`, `apps/api/src/users/dto/create-user.dto.ts`, `apps/api/src/users/dto/update-user.dto.ts`, `apps/api/src/users/__tests__/users.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create DTOs**

`apps/api/src/users/dto/create-user.dto.ts`:

```typescript
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
```

`apps/api/src/users/dto/update-user.dto.ts`:

```typescript
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
```

- [ ] **Step 2: Write the failing controller test**

`apps/api/src/users/__tests__/users.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { list: jest.Mock; create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('GET /users returns user list', async () => {
    service.list.mockResolvedValue([{ id: 'u1', email: 'a@x', role: 'ADMIN' }]);
    const result = await controller.list();
    expect(result).toEqual([{ id: 'u1', email: 'a@x', role: 'ADMIN' }]);
    expect(service.list).toHaveBeenCalled();
  });

  it('POST /users creates user', async () => {
    service.create.mockResolvedValue({ id: 'u2', email: 'b@x', role: 'OPERATOR' });
    const dto = { email: 'b@x', password: 'password123', role: 'OPERATOR' as const };
    const result = await controller.create(dto);
    expect(result).toEqual({ id: 'u2', email: 'b@x', role: 'OPERATOR' });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('PATCH /users/:id updates user', async () => {
    service.update.mockResolvedValue({ id: 'u1', email: 'a@x', name: 'New', role: 'OPERATOR' });
    const result = await controller.update('u1', { name: 'New', role: 'OPERATOR' });
    expect(service.update).toHaveBeenCalledWith('u1', { name: 'New', role: 'OPERATOR' });
    expect(result.name).toBe('New');
  });

  it('DELETE /users/:id removes user', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('u1');
    expect(service.remove).toHaveBeenCalledWith('u1');
  });
});
```

- [ ] **Step 3: Run test and verify failure**

Run: `pnpm --filter api test users.controller`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `apps/api/src/users/users.service.ts`**

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  list() {
    return this.prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await this.passwords.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash,
      },
      select: SAFE_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password !== undefined) data.passwordHash = await this.passwords.hash(dto.password);

    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    await this.prisma.user.delete({ where: { id } });
  }
}
```

- [ ] **Step 5: Implement `apps/api/src/users/users.controller.ts`**

```typescript
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
```

- [ ] **Step 6: Implement `apps/api/src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 7: Wire `UsersModule` into `AppModule`**

Edit `apps/api/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 8: Run tests and verify they pass**

Run: `pnpm --filter api test users.controller`
Expected: PASS — 4 tests green.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/users apps/api/src/app.module.ts
git commit -m "feat(users): add admin-only user CRUD endpoints"
```

---

## Task 9: Seed Script — First Admin User

**Files:**
- Create: `apps/api/prisma/seed.ts`
- Modify: `apps/api/package.json` (add `prisma.seed` config)

- [ ] **Step 1: Create `apps/api/prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists — skipping`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Initial Admin',
      role: 'ADMIN',
    },
  });

  console.log('=========================================');
  console.log('Seeded initial admin user:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('Change the password after first login.');
  console.log('=========================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add Prisma seed config to `apps/api/package.json`**

Add this top-level key:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

- [ ] **Step 3: Run the seed**

Run: `pnpm --filter api db:seed`
Expected: console output showing seeded admin credentials.

- [ ] **Step 4: Verify in Postgres**

Run: `docker exec -it wbs_postgres psql -U wbs -d wbs -c "SELECT email, role FROM users;"`
Expected: one row `admin@example.com | ADMIN`.

- [ ] **Step 5: Manual smoke test — call login endpoint**

Start API: `pnpm --filter api dev` (in another terminal)

Run:
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
```

Expected: HTTP 201, response body contains `accessToken` and `user`, response sets a `refresh_token` cookie. Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/seed.ts apps/api/package.json
git commit -m "feat(api): add seed script for initial admin user"
```

---

## Task 10: Scaffold React SPA (Vite + Tailwind + React Router + React Query)

**Files:**
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/tailwind.config.js`, `apps/web/postcss.config.js`, `apps/web/index.html`, `apps/web/.env.example`, `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/index.css`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.40.0",
    "axios": "^1.7.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.51.0",
    "react-router-dom": "^6.23.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "useDefineForClassFields": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: Create Tailwind config files**

`apps/web/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`apps/web/postcss.config.js`:

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 5: Create `apps/web/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WhatsApp Blast Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `apps/web/.env.example`**

```
VITE_API_BASE=/api
```

- [ ] **Step 7: Copy `.env.example` to `.env`**

Run: `cp apps/web/.env.example apps/web/.env`

- [ ] **Step 8: Create `apps/web/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create `apps/web/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 10: Create placeholder `apps/web/src/App.tsx`**

```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900">WhatsApp Blast Admin — bootstrapping…</h1>
    </div>
  );
}
```

- [ ] **Step 11: Install and run**

Run: `pnpm install`
Then: `pnpm --filter web dev`
Visit: `http://localhost:5173`
Expected: page renders the heading with Tailwind styling. Stop dev server.

- [ ] **Step 12: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold react + vite + tailwind + react-query"
```

---

## Task 11: API Client + Auth Context

**Files:**
- Create: `apps/web/src/api/client.ts`, `apps/web/src/api/auth.ts`, `apps/web/src/auth/AuthContext.tsx`, `apps/web/src/auth/ProtectedRoute.tsx`

- [ ] **Step 1: Create `apps/web/src/api/client.ts`**

```typescript
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
```

- [ ] **Step 2: Create `apps/web/src/api/auth.ts`**

```typescript
import { api } from './client';

export type Role = 'ADMIN' | 'OPERATOR';

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}
```

- [ ] **Step 3: Create `apps/web/src/auth/AuthContext.tsx`**

```tsx
import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { CurrentUser, login as loginApi } from '../api/auth';
import { setAccessToken } from '../api/client';

interface AuthState {
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user } = await loginApi(email, password);
    setAccessToken(accessToken);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: Create `apps/web/src/auth/ProtectedRoute.tsx`**

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
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/api apps/web/src/auth
git commit -m "feat(web): add api client, auth context, protected route"
```

---

## Task 12: Login Page + App Routing

**Files:**
- Create: `apps/web/src/pages/Login.tsx`, `apps/web/src/pages/Dashboard.tsx`, `apps/web/src/components/Layout.tsx`
- Modify: `apps/web/src/App.tsx`, `apps/web/src/main.tsx`

- [ ] **Step 1: Create `apps/web/src/pages/Login.tsx`**

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-300 px-3 py-2 border"
            data-testid="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-300 px-3 py-2 border"
            data-testid="password"
          />
        </label>
        {error && <p className="text-sm text-red-600" data-testid="login-error">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white rounded py-2 font-semibold disabled:opacity-50"
          data-testid="submit"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/components/Layout.tsx`**

```tsx
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-gray-900">WBS</span>
            <Link to="/" className="text-sm text-gray-700">Dashboard</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/settings" className="text-sm text-gray-700">Settings</Link>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600" data-testid="current-user">{user?.email}</span>
            <button
              onClick={onLogout}
              className="text-indigo-600 font-medium"
              data-testid="logout"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/web/src/pages/Dashboard.tsx`**

```tsx
export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900" data-testid="dashboard-title">Dashboard</h1>
      <p className="text-gray-600 mt-2">More widgets land in later phases.</p>
    </div>
  );
}
```

- [ ] **Step 4: Replace `apps/web/src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requireRole="ADMIN">
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 5: Wrap with `AuthProvider` in `apps/web/src/main.tsx`**

Replace `apps/web/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Create placeholder `apps/web/src/pages/Settings.tsx` (full version in Task 13)**

```tsx
export default function Settings() {
  return <div data-testid="settings-page">Settings (users list lands in next task)</div>;
}
```

- [ ] **Step 7: Manual test the full login flow**

Terminal 1: `pnpm --filter api dev`
Terminal 2: `pnpm --filter web dev`
Visit: `http://localhost:5173`
Expected: redirected to `/login`. Enter seed credentials → redirected to `/`, see "Dashboard" + logged-in email in nav. Click Settings → see placeholder. Click Logout → back to `/login`.

Stop both dev servers.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages apps/web/src/components apps/web/src/App.tsx apps/web/src/main.tsx
git commit -m "feat(web): add login page, layout, dashboard, and protected routes"
```

---

## Task 13: Settings Page — User Management UI

**Files:**
- Create: `apps/web/src/api/users.ts`
- Modify: `apps/web/src/pages/Settings.tsx`

- [ ] **Step 1: Create `apps/web/src/api/users.ts`**

```typescript
import { api } from './client';
import type { Role } from './auth';

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role: Role;
}

export async function listUsers(): Promise<UserRow[]> {
  const { data } = await api.get<UserRow[]>('/users');
  return data;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const { data } = await api.post<UserRow>('/users', input);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function resetUserPassword(id: string, password: string): Promise<UserRow> {
  const { data } = await api.patch<UserRow>(`/users/${id}`, { password });
  return data;
}
```

- [ ] **Step 2: Replace `apps/web/src/pages/Settings.tsx`**

```tsx
import { useState, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, deleteUser, listUsers, resetUserPassword, UserRow } from '../api/users';
import type { Role } from '../api/auth';

export default function Settings() {
  const qc = useQueryClient();
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('OPERATOR');
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEmail(''); setName(''); setPassword(''); setRole('OPERATOR'); setFormError(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setFormError(typeof msg === 'string' ? msg : 'Failed to create user');
    },
  });

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const reset = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => resetUserPassword(id, password),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ email, password, name: name || undefined, role });
  }

  function onResetPassword(user: UserRow) {
    const pw = window.prompt(`Set new password for ${user.email}:`);
    if (pw) reset.mutate({ id: user.id, password: pw });
  }

  function onDelete(user: UserRow) {
    if (window.confirm(`Delete user ${user.email}?`)) remove.mutate(user.id);
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Settings — Users</h1>
        <p className="text-gray-600 mt-1 text-sm">Admins and operators with access to this system.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Add user</h2>
        <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-end" data-testid="add-user-form">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com" className="border rounded px-2 py-1.5"
            data-testid="new-user-email"
          />
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)" className="border rounded px-2 py-1.5"
            data-testid="new-user-name"
          />
          <input
            type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8)" className="border rounded px-2 py-1.5"
            data-testid="new-user-password"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="border rounded px-2 py-1.5" data-testid="new-user-role">
            <option value="OPERATOR">Operator</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="submit" disabled={create.isPending}
            className="bg-indigo-600 text-white rounded py-1.5 font-medium disabled:opacity-50"
            data-testid="new-user-submit"
          >
            {create.isPending ? 'Creating…' : 'Add user'}
          </button>
          {formError && <p className="md:col-span-5 text-sm text-red-600" data-testid="add-user-error">{formError}</p>}
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Existing users</h2>
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load users.</p>}
        {users && (
          <table className="w-full bg-white rounded shadow-sm" data-testid="users-table">
            <thead className="text-left text-sm text-gray-600 border-b">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b text-sm">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.name ?? '—'}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.isActive ? 'Active' : 'Disabled'}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => onResetPassword(u)} className="text-indigo-600 mr-3">Reset password</button>
                    <button onClick={() => onDelete(u)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Manual test**

Terminal 1: `pnpm --filter api dev`
Terminal 2: `pnpm --filter web dev`
Visit: `http://localhost:5173`, log in as admin, click Settings.
Expected:
- See the seeded admin user listed in the table.
- Add a new operator (e.g. `op@example.com` / `Operator123!` / role OPERATOR). The row appears in the table.
- Reset that user's password via the "Reset password" button. No error.
- Log out, log in as the new operator. Confirm Settings link does NOT appear in nav.
- Attempt to visit `/settings` directly as the operator. Expected: redirected to `/`.

Stop both dev servers.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api/users.ts apps/web/src/pages/Settings.tsx
git commit -m "feat(web): add settings page with user CRUD UI"
```

---

## Task 14: E2E Smoke Test with Playwright

**Files:**
- Create: `e2e/package.json`, `e2e/playwright.config.ts`, `e2e/tests/login.spec.ts`

- [ ] **Step 1: Create `e2e/package.json`**

```json
{
  "name": "e2e",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "install-browsers": "playwright install --with-deps chromium"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Install Playwright**

Run: `pnpm install`
Then: `pnpm --filter e2e install-browsers`

- [ ] **Step 3: Create `e2e/playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

- [ ] **Step 4: Create `e2e/tests/login.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Auth smoke', () => {
  test('admin logs in and reaches dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByTestId('email').fill('admin@example.com');
    await page.getByTestId('password').fill('ChangeMe123!');
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('dashboard-title')).toHaveText('Dashboard');
    await expect(page.getByTestId('current-user')).toHaveText('admin@example.com');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill('admin@example.com');
    await page.getByTestId('password').fill('wrong-password');
    await page.getByTestId('submit').click();

    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
  });

  test('admin can navigate to settings; operator cannot', async ({ page }) => {
    // Admin path
    await page.goto('/login');
    await page.getByTestId('email').fill('admin@example.com');
    await page.getByTestId('password').fill('ChangeMe123!');
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL('/');

    await page.goto('/settings');
    await expect(page.getByTestId('users-table')).toBeVisible();

    // Logout
    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
```

- [ ] **Step 5: Run the suite**

Make sure the API and web are both running:
- Terminal 1: `pnpm --filter api dev`
- Terminal 2: `pnpm --filter web dev`
- Terminal 3: `pnpm --filter e2e test`

Expected: all 3 tests pass.

Stop dev servers.

- [ ] **Step 6: Commit**

```bash
git add e2e pnpm-lock.yaml
git commit -m "test(e2e): add playwright smoke tests for login flow"
```

---

## Task 15: Documentation Sweep — README and Operator Guide

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Expand `README.md`**

```markdown
# WhatsApp Blast System

Single-tenant marketing-blast system on the WhatsApp Business Cloud API.

See full design: `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md`

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm@9`)
- Docker Desktop (for Postgres + Redis)

## First-time setup

```bash
# 1. Install deps
pnpm install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Apply DB migrations
pnpm db:migrate

# 5. Seed the initial admin user (prints credentials)
pnpm db:seed
```

## Run dev

In two terminals:

```bash
# Terminal 1 — API on http://localhost:3000
pnpm --filter api dev

# Terminal 2 — Web on http://localhost:5173
pnpm --filter web dev
```

Visit `http://localhost:5173` and log in with the seeded admin credentials.

## Tests

```bash
# Unit + integration (NestJS + Jest)
pnpm --filter api test

# E2E smoke (Playwright) — requires API + web running
pnpm --filter e2e install-browsers   # one-time
pnpm --filter e2e test
```

## Project layout

- `apps/api` — NestJS backend, Prisma, BullMQ
- `apps/web` — React SPA (Vite, Tailwind, React Query, React Router)
- `e2e`     — Playwright smoke tests
- `docs/superpowers/specs` — design spec
- `docs/superpowers/plans` — phased implementation plans

## Phase 1 — what's done

- Monorepo + Docker (Postgres, Redis)
- NestJS API with JWT auth, refresh-token cookie, JWT + roles guards
- Users module (admin-only CRUD)
- Seed script for initial admin
- React SPA with login, protected routes, settings page (user management)
- Playwright smoke tests for login + roles

## Coming in later phases

Phase 2: contacts + segments · Phase 3: templates · Phase 4: blast engine · Phase 5: analytics + replies · Phase 6: polish.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: expand README with setup, dev, and test instructions"
```

---

## Final Verification

- [ ] **Step 1: Clean start from zero**

In a fresh terminal:

```bash
docker compose down -v
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
```

Expected: no errors. Seed prints admin credentials.

- [ ] **Step 2: Run all unit tests**

```bash
pnpm --filter api test
```

Expected: all suites pass. (Password service: 3 tests. Auth controller: 2 tests. Users controller: 4 tests.)

- [ ] **Step 3: Run the E2E suite**

Terminal 1: `pnpm --filter api dev`
Terminal 2: `pnpm --filter web dev`
Terminal 3: `pnpm --filter e2e test`

Expected: 3 E2E tests pass.

- [ ] **Step 4: Manual smoke**

Visit `http://localhost:5173`:
- Login as admin → dashboard
- Go to Settings → create operator → reset its password → delete it → confirm gone
- Logout → login as a freshly-created operator → confirm no Settings link → directly visiting `/settings` redirects to `/`

- [ ] **Step 5: Tag the milestone**

```bash
git tag -a phase-1-complete -m "Phase 1 foundation complete: auth, users, monorepo"
```

---

## What this plan does NOT do (intentionally — comes later)

- Contacts, segments, templates, blasts, webhooks, BullMQ workers — Phase 2-4
- Refresh-token rotation endpoint (`POST /api/auth/refresh`) — added in Phase 6
- Real CSRF protection — refresh cookie is SameSite=Lax and limited to `/api/auth`; tighten in Phase 6
- Rate limiting on `/auth/login` — Phase 6
- Logging/observability — Phase 6
- BullMQ wiring (the dep is installed; nothing uses it yet) — Phase 4
