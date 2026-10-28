// ── BackOffice logins for EAINT-12028 ───────────────────────
// Typed on the /eauto/12028 runner page; never a fallback here. The SRD maps
// the workflow roles by user ID (SRD v1.1 REQ-003: "1. Drafter: eautozara,
// mfared, mfizni ⏎ 2. Reviewer: eautonurul, mfizni ⏎ 3. Approver: kmcheah,
// mfizni"); which of those IDs to use, and the passwords, are Faizuddin's.

import { required } from './config';

export type RoleKey = 'drafter' | 'drafter2' | 'reviewer' | 'approver' | 'multi' | 'norole' | 'superadmin';

export interface UserCredentials { role: RoleKey; label: string; username: string; password: string }

const LABEL: Record<RoleKey, string> = {
  drafter: 'Drafter',
  drafter2: 'Second Drafter',
  reviewer: 'Reviewer',
  approver: 'Approver',
  multi: 'Multi-role user',
  norole: 'BO user with no Association role',
  superadmin: 'Super Admin',
};

const ENV: Record<RoleKey, string> = {
  drafter: 'DRAFTER', drafter2: 'DRAFTER2', reviewer: 'REVIEWER', approver: 'APPROVER',
  multi: 'MULTI', norole: 'NOROLE', superadmin: 'SUPERADMIN',
};

/** Login for a role; throws naming the blank field. */
export function getUser(role: RoleKey): UserCredentials {
  const k = ENV[role];
  return {
    role,
    label: LABEL[role],
    username: required(`E12028_${k}_USER`, `${LABEL[role]} login`),
    password: required(`E12028_${k}_PASS`, `${LABEL[role]} password`),
  };
}

export const roleLabel = (role: RoleKey) => LABEL[role];
