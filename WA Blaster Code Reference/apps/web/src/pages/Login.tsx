import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AIOrb } from '../components/ui/AIOrb';
import { Button } from '../components/ui/Button';
import { IcLock, IcShield, IcUser } from '../components/ui/icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null); // role being signed in
  const [forgot, setForgot] = useState(false);
  const [remember, setRemember] = useState(true);

  async function doLogin(loginEmail: string, loginPassword: string, role: string) {
    setError(null);
    setSubmitting(role);
    try {
      await login(loginEmail, loginPassword, remember);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await doLogin(email.trim(), password.trim(), 'main');
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--canvas, var(--color-background-sunken))' }}
    >
      <div
        className="w-full max-w-[404px] rounded-xl border border-border bg-background p-8"
        style={{ boxShadow: 'var(--shadow-pop, 0 8px 32px rgba(0,0,0,.12))' }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-1 mb-7">
          <AIOrb size={56} breathe style={{ borderRadius: 16, marginBottom: 8 }} />
          <div className="text-[22px] font-bold tracking-[-0.02em] text-heading">WhatsApp Blaster</div>
          <div className="text-[13px] text-foreground-muted">eAuto · dealer outreach control room</div>
        </div>

        {!forgot ? (
          <>
            <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">Work email</label>
                <input
                  type="email"
                  value={email}
                  autoFocus
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                  placeholder="you@eauto.my"
                  required
                  className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                  data-testid="email"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                  placeholder="••••••••"
                  required
                  className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                  data-testid="password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[13px] text-foreground-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    data-testid="remember-me"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  className="text-[13px] font-medium text-accent bg-transparent border-none cursor-pointer p-0"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <p className="text-[12px] text-red-500" data-testid="login-error">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                data-testid="submit"
                disabled={!!submitting}
                className="w-full mt-0.5"
              >
                {submitting === 'main' ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {/* Demo role divider */}
            <div className="flex items-center gap-2.5 my-5">
              <span className="flex-1 h-px bg-border" />
              <span className="text-[11.5px] text-foreground-muted">or try a demo role</span>
              <span className="flex-1 h-px bg-border" />
            </div>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={<IcShield size={15} />}
                disabled={!!submitting}
                className="flex-1"
                onClick={() => doLogin('admin@example.com', 'ChangeMe123!', 'admin-demo')}
              >
                {submitting === 'admin-demo' ? 'Signing in…' : 'Admin'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={<IcUser size={15} />}
                disabled={!!submitting}
                className="flex-1"
                onClick={() => doLogin('support@example.com', 'ChangeMe123!', 'support-demo')}
              >
                {submitting === 'support-demo' ? 'Signing in…' : 'Customer Support'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center" style={{ animation: 'fadeIn .15s ease' }}>
            <div
              className="w-12 h-12 rounded-[13px] mx-auto mb-3.5 flex items-center justify-center"
              style={{ background: 'var(--brand-soft, color-mix(in srgb, var(--color-accent) 12%, transparent))', color: 'var(--brand-700, var(--color-accent))' }}
            >
              <IcLock size={22} />
            </div>
            <h3 className="text-base font-semibold text-heading mb-1.5">Password help</h3>
            <p className="text-[13.5px] text-foreground-muted mb-4 leading-relaxed max-w-[280px] mx-auto">
              Account access is managed by your team. Please contact your admin to reset your password.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => setForgot(false)}
            >
              Back to sign in
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
