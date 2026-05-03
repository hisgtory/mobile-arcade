import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  /** ISO date string used for "최종 업데이트" footer. */
  lastUpdated: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function LegalShell({
  title,
  subtitle,
  lastUpdated,
  children,
  backHref = '/juicy-fruits',
  backLabel = '← Juicy Fruits',
}: Props) {
  const formatted = new Date(lastUpdated).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 sm:py-12">
      <Link
        href={backHref}
        className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        {backLabel}
      </Link>
      <header className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm font-semibold text-slate-500 sm:text-base">
            {subtitle}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          최종 업데이트: {formatted}
        </p>
      </header>
      <article className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
        {children}
      </article>
      <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} hisgtory ·{' '}
        <Link href="/" className="hover:underline">
          Arcade 홈
        </Link>{' '}
        ·{' '}
        <Link href="/juicy-fruits" className="hover:underline">
          앱 상세
        </Link>
      </footer>
    </main>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg text-slate-900 sm:text-xl">
        {heading}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
