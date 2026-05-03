import type { Metadata } from 'next';
import Link from 'next/link';
import { AppIcon, ComingSoonIcon } from '@/components/AppIcon';
import { APPS, COMING_SOON_SLOTS } from '@/data/apps';

export const metadata: Metadata = {
  title: 'Arcade — 모바일 미니게임',
  description: '매일매일 새로운 미니게임을 만나보세요. 첫 번째 게임 Juicy Fruits 출시!',
  openGraph: {
    title: 'Arcade',
    description: '매일매일 새로운 미니게임을 만나보세요.',
  },
};

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="font-display text-5xl tracking-wide text-slate-900">
          ARCADE
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          매일매일 새로운 미니게임
        </p>
      </header>

      <section
        aria-label="앱 목록"
        className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4"
      >
        {APPS.map((app) => (
          <AppIcon key={app.slug} app={app} />
        ))}
        {Array.from({ length: COMING_SOON_SLOTS }).map((_, i) => (
          <ComingSoonIcon key={`soon-${i}`} />
        ))}
      </section>

      <footer className="mt-auto pt-16 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} hisgtory</p>
        <p className="mt-1">
          <a
            href="mailto:support@hisgtory.com"
            className="underline-offset-2 hover:underline"
          >
            support@hisgtory.com
          </a>
        </p>
        <p className="mt-2 space-x-2">
          <Link
            href="/juicy-fruits/privacy"
            className="underline-offset-2 hover:underline"
          >
            개인정보 처리방침
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/juicy-fruits/terms"
            className="underline-offset-2 hover:underline"
          >
            이용약관
          </Link>
        </p>
      </footer>
    </main>
  );
}
