import { useState, FormEvent, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, deleteUser, listUsers, resetUserPassword, updateUser, UserRow } from '../api/users';
import { getSystemSettings, updateSystemSettings } from '../api/systemSettings';
import type { Role } from '../api/auth';
import Modal from '../components/Modal';
import { useToast } from '../components/toast/ToastProvider';
import { Page, PageHead } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs, Avatar, Switch } from '../components/ui/Misc';
import { Badge } from '../components/ui/Badge';
import { AIOrb } from '../components/ui/AIOrb';
import {
  IcSend, IcAlert, IcShield, IcUser, IcPlus, IcGlobe,
} from '../components/ui/icons';
import { ROLE_LABEL } from '../lib/roles';
import StateLanguageMappingCard from './settings/StateLanguageMappingCard';
import {
  listCannedReplies, createCannedReply, updateCannedReply, deleteCannedReply,
  type CannedReply,
} from '../api/cannedReplies';

// ─── helper ──────────────────────────────────────────────────────────────────

type TabId = 'channel' | 'autopilot' | 'team' | 'languages' | 'canned';

function SettingRow({
  title,
  desc,
  children,
}: {
  title: React.ReactNode;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-5 py-[18px] border-t border-border first:border-t-0">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-foreground">{title}</div>
        {desc && (
          <div className="text-[12.5px] text-foreground-muted mt-0.5 leading-[1.5] max-w-[480px]">
            {desc}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function tierLabel(tier: number): string {
  if (tier >= 100000) return '100,000 / day';
  if (tier >= 10000) return '10,000 / day';
  if (tier >= 1000) return '1,000 / day';
  return `${tier.toLocaleString()} / day`;
}

// ─── Channel tab ─────────────────────────────────────────────────────────────

function ChannelTab({ messagingTier }: { messagingTier: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-background p-5 relative">
        {/* header */}
        <div className="flex items-center gap-4 mb-1">
          <div
            className="h-12 w-12 rounded-[13px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--brand-grad, linear-gradient(135deg,#22c55e,#16a34a))' }}
          >
            <IcSend size={22} style={{ color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15.5px] font-semibold text-foreground">eAuto</span>
              <Badge tone="success">
                <span className="flex items-center gap-1">Connected</span>
              </Badge>
            </div>
            <div
              className="text-[12.5px] text-foreground-muted mt-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              WABA · +60 3-7890 1234 · ID 1029384756
            </div>
          </div>
          <Button variant="secondary" size="sm">Manage</Button>
        </div>

        <SettingRow title="Display name" desc="Shown to dealers in WhatsApp.">
          <span className="text-[14px] font-semibold text-foreground">eAuto</span>
        </SettingRow>
        <SettingRow title="Quality rating" desc="WhatsApp's health rating for your number.">
          <Badge tone="success">High</Badge>
        </SettingRow>
        <SettingRow
          title="Messaging limit"
          desc="Daily unique-recipient cap on your current tier."
        >
          <span className="text-[14px] font-semibold text-foreground">{tierLabel(messagingTier)}</span>
        </SettingRow>
        <SettingRow title="Webhook" desc="Inbound message delivery from Meta.">
          <Badge tone="success">Receiving</Badge>
        </SettingRow>
      </div>
    </div>
  );
}

// ─── Autopilot tab ────────────────────────────────────────────────────────────

function AutopilotTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  });

  // Local optimistic state for slider — commit on pointerup
  const [localThreshold, setLocalThreshold] = useState<number | null>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  const mutate = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: (updated) => {
      qc.setQueryData(['system-settings'], updated);
      qc.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: () => {
      showToast('Failed to save setting', 'error');
      qc.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });

  const ap = data?.autopilot;
  const threshold = localThreshold ?? ap?.escalationThreshold ?? 70;

  const toggle = useCallback(
    (field: 'autopilotEnabled' | 'autopilotHonourStop', value: boolean) => {
      mutate.mutate({ [field]: value });
    },
    [mutate],
  );

  const commitThreshold = useCallback(() => {
    if (localThreshold !== null) {
      mutate.mutate({ autopilotEscalationThreshold: localThreshold });
      setLocalThreshold(null);
    }
  }, [localThreshold, mutate]);

  if (isLoading || !data) {
    return <div className="text-[13px] text-foreground-muted p-4">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* main card */}
      <div className="overflow-hidden rounded-xl border border-border bg-background relative">
        {/* brand gradient top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'var(--brand-grad, linear-gradient(90deg,#22c55e,#16a34a))' }}
        />
        <div className="px-6 pt-5 pb-2">
          <SettingRow
            title={
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <AIOrb size={20} breathe={ap?.enabled} />
                Autopilot — AI auto-reply
              </span>
            }
            desc="When on, the AI replies to high-confidence messages on its own and sends everything else to the Needs Human queue."
          >
            <Switch
              on={ap?.enabled ?? false}
              onChange={(v) => toggle('autopilotEnabled', v)}
            />
          </SettingRow>

          <SettingRow
            title="Escalation threshold"
            desc={`Messages the bot is less than ${threshold}% confident about are escalated to a human.`}
          >
            <div className="flex items-center gap-3 w-[220px]">
              <input
                ref={sliderRef}
                type="range"
                min={40}
                max={95}
                value={threshold}
                disabled={!ap?.enabled}
                onChange={(e) => setLocalThreshold(Number(e.target.value))}
                onPointerUp={commitThreshold}
                onBlur={commitThreshold}
                className="flex-1 accent-accent"
                style={{ accentColor: 'var(--accent)' }}
              />
              <span
                className="text-[14px] font-semibold min-w-[40px] text-right"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}
              >
                {threshold}%
              </span>
            </div>
          </SettingRow>

          <SettingRow
            title="Honour STOP / opt-out"
            desc="Automatically opt dealers out when they reply STOP or BERHENTI."
          >
            <Switch
              on={ap?.honourStop ?? true}
              onChange={(v) => toggle('autopilotHonourStop', v)}
            />
          </SettingRow>

          <SettingRow
            title="After-hours behaviour"
            desc="Outside business hours — a human still replies during business hours (no AI drafting)."
          >
            <select
              className="h-8 rounded-md border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              value={ap?.afterHours ?? 'AWAY_THEN_ESCALATE'}
              onChange={(e) =>
                mutate.mutate({
                  autopilotAfterHours: e.target.value as 'AWAY_THEN_ESCALATE' | 'ESCALATE_ONLY',
                })
              }
            >
              <option value="AWAY_THEN_ESCALATE">Send an away message, then escalate</option>
              <option value="ESCALATE_ONLY">Escalate only — a human replies next day</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* amber note */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background-subtle px-[22px] py-[18px]">
        <IcAlert size={20} className="shrink-0 text-amber-500" />
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-foreground">
            Escalations are handled by people
          </div>
          <div className="text-[12.5px] text-foreground-muted mt-0.5 leading-[1.5]">
            The bot never guesses on sensitive messages. Anything it escalates goes to the Inbox,
            where a team member writes the reply themselves.
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Team & Roles tab ─────────────────────────────────────────────────────────

function TeamTab() {
  const qc = useQueryClient();
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('OPERATOR');
  const [formError, setFormError] = useState<string | null>(null);

  // Reset password modal state
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetPassword, setResetPasswordValue] = useState('');

  const { showToast } = useToast();

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEmail(''); setName(''); setPassword(''); setRole('OPERATOR'); setFormError(null);
      setShowInvite(false);
      showToast('User invited successfully');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setFormError(typeof msg === 'string' ? msg : 'Failed to create user');
    },
  });

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      showToast('User deleted');
    },
    onError: () => showToast('Failed to delete user', 'error'),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role: r }: { id: string; role: Role }) => updateUser(id, { role: r }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      showToast(`${updated.name ?? updated.email} is now ${ROLE_LABEL[updated.role]}`);
    },
    onError: () => showToast('Failed to update role', 'error'),
  });

  const reset = useMutation({
    mutationFn: ({ id, pw }: { id: string; pw: string }) => resetUserPassword(id, pw),
    onSuccess: () => {
      showToast('Password reset successfully');
      setResetUser(null);
      setResetPasswordValue('');
    },
    onError: () => showToast('Failed to reset password', 'error'),
  });

  function onSubmitInvite(e: FormEvent) {
    e.preventDefault();
    create.mutate({ email, password, name: name || undefined, role });
  }

  function submitResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (resetUser && resetPassword.length >= 8) {
      reset.mutate({ id: resetUser.id, pw: resetPassword });
    }
  }

  function onDelete(user: UserRow) {
    if (window.confirm(`Delete user ${user.email}?`)) remove.mutate(user.id);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Role explainer cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            icon: <IcShield size={15} />,
            title: ROLE_LABEL['ADMIN'],
            colorClass: 'bg-blue-50 text-blue-600',
            desc: 'Full access — create & send campaigns, generate & submit templates, manage dealers, edit Knowledge, change Settings & manage users.',
          },
          {
            icon: <IcUser size={15} />,
            title: ROLE_LABEL['OPERATOR'],
            colorClass: 'bg-background-subtle text-foreground-muted',
            desc: 'Acts in the Inbox (work, resolve & close tickets) and Knowledge (edit answers, publish learned entries). Every other screen is view-only; Settings & Users are hidden.',
          },
        ].map(({ icon, title, colorClass, desc }) => (
          <div key={title} className="overflow-hidden rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colorClass}`}>
                {icon}
              </div>
              <span className="text-[14px] font-semibold text-foreground">{title}</span>
            </div>
            <div className="text-[12.5px] text-foreground-muted leading-[1.55]">{desc}</div>
          </div>
        ))}
      </div>

      {/* Members header */}
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] text-foreground-muted">
          {users ? `${users.length} team members` : 'Loading…'}
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<IcPlus size={14} />}
          onClick={() => setShowInvite(true)}
          data-testid="invite-member-btn"
        >
          Invite member
        </Button>
      </div>

      {/* Members table */}
      {isLoading && <p className="text-[13px] text-foreground-muted">Loading…</p>}
      {error && <p className="text-[13px] text-red-500">Failed to load users.</p>}
      {users && (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <table className="w-full text-[13px]" data-testid="users-table">
            <thead className="bg-background-subtle">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">Member</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-foreground-muted pr-4">Role</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name ?? u.email} size="lg" />
                      <div>
                        <div className="text-[13.5px] font-semibold text-foreground">{u.name ?? '—'}</div>
                        <div className="text-[12px] text-foreground-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12.5px] text-foreground-muted">
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      className="h-8 rounded-md border border-border bg-background px-3 text-[12.5px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      value={u.role}
                      onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value as Role })}
                    >
                      <option value="ADMIN">{ROLE_LABEL['ADMIN']}</option>
                      <option value="OPERATOR">{ROLE_LABEL['OPERATOR']}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setResetUser(u); setResetPasswordValue(''); }}
                      className="mr-1 text-accent hover:text-accent"
                    >
                      Reset password
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(u)}
                      className="text-red-500 hover:text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit log (static seed) */}
      <div className="mt-2">
        <div className="text-[13px] font-semibold text-foreground mb-3">Recent activity</div>
        <div className="overflow-hidden rounded-xl border border-border bg-background px-[18px]">
          {[
            ['Aiman Tan', "changed Faizal Rahim's role to Customer Support", '2h ago'],
            ['Priya Nair', 'published a knowledge answer from TCK-1042', 'yesterday'],
            ['Aiman Tan', 'turned Autopilot on', 'yesterday'],
            ['Aiman Tan', 'submitted 3 language versions of subscription_renewal', '2d ago'],
            ['Michelle Goh', 'closed ticket TCK-1071', '3d ago'],
          ].map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 py-3 text-[13px] ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <Avatar name={a[0]} size="sm" />
              <span className="flex-1">
                <b className="font-semibold text-foreground">{a[0]}</b>{' '}
                <span className="text-foreground-muted">{a[1]}</span>
              </span>
              <span className="text-[11.5px] text-foreground-muted shrink-0">{a[2]}</span>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-foreground-muted mt-2 px-1">Audit log — static seed data.</p>
      </div>

      {/* Invite modal */}
      <Modal open={showInvite} title="Invite team member" onClose={() => setShowInvite(false)}>
        <form onSubmit={onSubmitInvite} className="space-y-3" data-testid="add-user-form">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full h-8 rounded-md border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid="new-user-email"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full h-8 rounded-md border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid="new-user-name"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8)"
            className="w-full h-8 rounded-md border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid="new-user-password"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full h-8 rounded-md border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid="new-user-role"
          >
            <option value="OPERATOR">{ROLE_LABEL['OPERATOR']}</option>
            <option value="ADMIN">{ROLE_LABEL['ADMIN']}</option>
          </select>
          {formError && (
            <p className="text-[13px] text-red-500" data-testid="add-user-error">{formError}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={create.isPending}
              data-testid="new-user-submit"
            >
              {create.isPending ? 'Inviting…' : 'Invite'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={!!resetUser}
        title={`Reset password for ${resetUser?.email ?? ''}`}
        onClose={() => setResetUser(null)}
      >
        <form onSubmit={submitResetPassword} className="space-y-4" data-testid="reset-password-form">
          <input
            type="password"
            required
            minLength={8}
            value={resetPassword}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="w-full h-8 rounded-md border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid="reset-password-input"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setResetUser(null)}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={reset.isPending || resetPassword.length < 8}
              data-testid="reset-password-submit"
            >
              {reset.isPending ? 'Resetting…' : 'Reset password'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

// ─── Canned Replies tab ───────────────────────────────────────────────────────

function CannedRepliesTab() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<CannedReply | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: '' });

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['canned-replies'],
    queryFn: () => listCannedReplies(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['canned-replies'] });

  const createMut = useMutation({
    mutationFn: () => createCannedReply({ title: form.title, body: form.body, category: form.category || undefined }),
    onSuccess: () => { invalidate(); setCreating(false); showToast('Canned reply added'); },
    onError: () => showToast('Failed to add', 'error'),
  });
  const updateMut = useMutation({
    mutationFn: () => updateCannedReply(editing!.id, { title: form.title, body: form.body, category: form.category || undefined }),
    onSuccess: () => { invalidate(); setEditing(null); showToast('Canned reply updated'); },
    onError: () => showToast('Failed to update', 'error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCannedReply(id),
    onSuccess: () => { invalidate(); showToast('Canned reply deleted'); },
    onError: () => showToast('Failed to delete', 'error'),
  });

  const openCreate = () => { setForm({ title: '', body: '', category: '' }); setCreating(true); };
  const openEdit = (r: CannedReply) => { setForm({ title: r.title, body: r.body, category: r.category ?? '' }); setEditing(r); };
  const closeModal = () => { setCreating(false); setEditing(null); };
  const formValid = form.title.trim().length > 0 && form.body.trim().length > 0;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Reusable replies agents can insert in the inbox.</p>
        <Button variant="primary" size="sm" data-testid="add-canned-reply" onClick={openCreate}>Add reply</Button>
      </div>

      {isLoading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>}
      {!isLoading && replies.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No canned replies yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="canned-replies-list">
        {replies.map((r) => (
          <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.title}</span>
                {r.category && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.category}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.body}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>Edit</Button>
              <Button variant="secondary" size="sm" disabled={deleteMut.isPending} onClick={() => { if (window.confirm(`Delete "${r.title}"?`)) deleteMut.mutate(r.id); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={creating || !!editing} title={editing ? 'Edit canned reply' : 'New canned reply'} onClose={closeModal}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '0 10px', fontSize: 13, color: 'var(--foreground)' }}
          />
          <input
            placeholder="Category (optional)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '0 10px', fontSize: 13, color: 'var(--foreground)' }}
          />
          <textarea
            placeholder="Reply body"
            rows={5}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            style={{ resize: 'vertical', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '8px 10px', fontSize: 13, color: 'var(--foreground)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary" size="sm"
              disabled={!formValid || createMut.isPending || updateMut.isPending}
              onClick={() => (editing ? updateMut.mutate() : createMut.mutate())}
            >
              {editing ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [tab, setTab] = useState<TabId>('channel');

  // Pre-fetch system settings so Channel tab has tier data immediately
  const { data: sysSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  });

  const tabs: { value: TabId; label: string }[] = [
    { value: 'channel', label: 'Channel' },
    { value: 'autopilot', label: 'Autopilot' },
    { value: 'team', label: 'Team & Roles' },
    { value: 'languages', label: 'Languages' },
    { value: 'canned', label: 'Canned replies' },
  ];

  return (
    <Page>
      <PageHead
        title="Settings"
        subtitle="Manage your channel, autopilot, team, and language settings."
      />

      <div className="space-y-6">
        <Tabs value={tab} onChange={setTab} tabs={tabs} />

        {tab === 'channel' && (
          <ChannelTab messagingTier={sysSettings?.currentMessagingTier ?? 10000} />
        )}
        {tab === 'autopilot' && <AutopilotTab />}
        {tab === 'team' && (
          <TeamTab />
        )}
        {tab === 'languages' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <IcGlobe size={16} className="text-foreground-muted" />
              <span className="text-[13px] text-foreground-muted">
                Map Malaysian states to language preferences for campaign blasting.
              </span>
            </div>
            <StateLanguageMappingCard />
          </div>
        )}
        {tab === 'canned' && <CannedRepliesTab />}
      </div>
    </Page>
  );
}
