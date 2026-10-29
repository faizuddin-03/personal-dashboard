import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap rounded-md ' +
  'border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white border-accent hover:bg-accent-hover',
  secondary: 'bg-background text-foreground border-border-strong hover:bg-background-hover',
  ghost: 'bg-transparent text-foreground-muted border-transparent hover:bg-background-hover hover:text-foreground',
  destructive: 'bg-red-500 text-white border-red-500 hover:brightness-110',
};
const sizes: Record<Size, string> = {
  sm: 'h-[26px] px-2.5 text-xs',
  md: 'h-8 px-3 text-[13px]',
  lg: 'h-9 px-3.5 text-[13px]',
};

export function Button({
  variant = 'secondary', size = 'md', icon, children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {icon}{children}
    </button>
  );
}

export function IconButton({
  icon, title, size = 'md', className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; title: string; size?: Size }) {
  const dim = size === 'sm' ? 'h-[26px] w-[26px]' : 'h-8 w-8';
  return (
    <button title={title} aria-label={title}
      className={`${base} ${variants.ghost} ${dim} p-0 ${className}`} {...rest}>
      {icon}
    </button>
  );
}
