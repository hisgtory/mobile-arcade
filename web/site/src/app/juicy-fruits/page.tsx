import type { Metadata } from 'next';
import Link from 'next/link';
import { StoreBadge } from '@/components/StoreBadge';
import { APPS } from '@/data/apps';

const APP = APPS.find((a) => a.slug === 'juicy-fruits')!;

export const metadata: Metadata = {
  title: `${APP.title} — ${APP.subtitle}`,
  description: APP.tagline,
  openGraph: {
    title: APP.title,
    description: APP.tagline,
    type: 'website',
  },
};

export default function JuicyFruitsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 sm:py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        ← Arcade
      </Link>

      <section className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        <div
          className="flex size-28 shrink-0 items-center justify-center rounded-[2rem] text-6xl shadow-pop sm:size-32"
          style={{ background: APP.iconBg }}
          aria-hidden
        >
          {APP.iconEmoji}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-4xl text-slate-900 sm:text-5xl">
            {APP.title}
          </h1>
          <p className="mt-1 text-base font-semibold text-slate-500 sm:text-lg">
            {APP.subtitle}
          </p>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            {APP.tagline}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <StoreBadge store="app-store" url={APP.appStoreUrl} />
            <StoreBadge store="play-store" url={APP.playStoreUrl} />
          </div>
        </div>
      </section>

      <Section title="이런 게임이에요">
        <ul className="space-y-2 text-slate-700">
          {APP.description.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-cherry">●</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="앱 정보">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Info label="카테고리" value={APP.category} />
          <Info label="언어" value="한국어, 영어" />
          <Info label="연령" value="전체 이용가" />
          <Info label="개발자" value="hisgtory" />
          <Info label="가격" value="무료 (광고 포함)" />
          <Info label="플랫폼" value="iOS, Android" />
        </dl>
      </Section>

      <Section title="법적 고지" anchor="legal">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/juicy-fruits/privacy"
            className="group flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 transition-colors hover:border-cherry"
          >
            <div>
              <p className="font-bold text-slate-800 group-hover:text-cherry">
                개인정보 처리방침
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                수집 항목 · 이용 목적 · 삭제 요청
              </p>
            </div>
            <span aria-hidden className="text-slate-400 group-hover:text-cherry">
              →
            </span>
          </Link>
          <Link
            href="/juicy-fruits/terms"
            className="group flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 transition-colors hover:border-cherry"
          >
            <div>
              <p className="font-bold text-slate-800 group-hover:text-cherry">
                이용약관
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                서비스 이용 조건 · 면책 · 분쟁
              </p>
            </div>
            <span aria-hidden className="text-slate-400 group-hover:text-cherry">
              →
            </span>
          </Link>
        </div>
      </Section>

      <Section title="고객 지원" anchor="support">
        <p className="text-slate-700">
          문의나 버그 신고는 아래 이메일로 보내주세요. 평일 기준 영업일 2~3일 안에
          답변드립니다.
        </p>
        <p className="mt-3">
          <a
            href="mailto:support@hisgtory.com"
            className="font-display text-2xl text-cherry hover:underline"
          >
            support@hisgtory.com
          </a>
        </p>
      </Section>

      <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} hisgtory ·{' '}
        <Link href="/" className="hover:underline">Arcade 홈</Link>
        {' · '}
        <Link href="/juicy-fruits/privacy" className="hover:underline">개인정보 처리방침</Link>
        {' · '}
        <Link href="/juicy-fruits/terms" className="hover:underline">이용약관</Link>
      </footer>
    </main>
  );
}

function Section({
  title,
  anchor,
  children,
}: {
  title: string;
  anchor?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={anchor} className="mt-12 scroll-mt-8">
      <h2 className="font-display text-2xl text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

