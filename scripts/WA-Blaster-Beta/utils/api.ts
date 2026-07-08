import { request, expect } from '../fixtures/authFixture';
import type { APIRequestContext } from '../fixtures/authFixture';
import { API_BASE } from '../data/testData';
import { getUser } from '../data/users';

// ── API helpers (seeding / cleanup via the backend) ─────────

/** Log in as admin over the API and return a bearer token. */
export async function adminToken(): Promise<string> {
  const ctx: APIRequestContext = await request.newContext();
  try {
    const admin = getUser('admin');
    const res = await ctx.post(`${API_BASE}/api/auth/login`, {
      data: { email: admin.email, password: admin.password },
    });
    expect(res.ok(), `admin login failed: ${await res.text()}`).toBeTruthy();
    const { accessToken } = await res.json();
    return accessToken;
  } finally {
    await ctx.dispose();
  }
}

/** Seed an escalated inbound message via the admin simulator. */
export async function seedEscalation(token: string, phone: string, text: string): Promise<void> {
  const ctx: APIRequestContext = await request.newContext();
  try {
    const res = await ctx.post(`${API_BASE}/api/sim/inbound`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { phone, text },
    });
    expect(res.status(), `sim/inbound failed (${res.status()}): ${await res.text()}`).toBeLessThan(300);
  } finally {
    await ctx.dispose();
  }
}

/** Set (or, with an empty list, delete) a state → language mapping. */
export async function setStateLanguageMapping(token: string, state: string, languages: string[]): Promise<void> {
  const ctx: APIRequestContext = await request.newContext();
  try {
    if (languages.length === 0) {
      await ctx.delete(`${API_BASE}/api/state-language-mappings/${state}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      const res = await ctx.put(`${API_BASE}/api/state-language-mappings/${state}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { languages },
      });
      expect(res.ok()).toBeTruthy();
    }
  } finally {
    await ctx.dispose();
  }
}
