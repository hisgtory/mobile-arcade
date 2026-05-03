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

      <Section title="개인정보 처리방침" anchor="privacy">
        <PrivacyPolicy />
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
        © {new Date().getFullYear()} hisgtory · <Link href="/" className="hover:underline">Arcade 홈</Link>
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

function PrivacyPolicy() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-700">
      <p>
        Juicy Fruits(이하 "앱")는 사용자의 개인정보를 소중히 다룹니다. 본 방침은
        앱이 어떤 정보를 수집·이용하는지를 설명합니다.
      </p>
      <Sub heading="1. 수집하는 정보">
        <ul className="ml-5 list-disc space-y-1">
          <li>광고 식별자(IDFA / Android 광고 ID)</li>
          <li>기기 정보(OS 버전, 모델, 언어)</li>
          <li>앱 사용 통계 및 충돌 로그</li>
        </ul>
        <p className="mt-2">앱은 이름·이메일·전화번호 등 개인 식별 정보를 직접 수집하지 않습니다.</p>
      </Sub>
      <Sub heading="2. 이용 목적">
        <ul className="ml-5 list-disc space-y-1">
          <li>맞춤형 광고 송출 및 광고 성과 측정</li>
          <li>앱 안정성 개선 및 버그 진단</li>
          <li>이용 통계 분석을 통한 게임 개선</li>
        </ul>
      </Sub>
      <Sub heading="3. 제3자 제공">
        <p>
          앱은 광고 송출을 위해 <strong>Google AdMob</strong>를 사용합니다. AdMob의
          개인정보 처리방침은{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cherry underline-offset-2 hover:underline"
          >
            여기
          </a>
          에서 확인할 수 있습니다.
        </p>
      </Sub>
      <Sub heading="4. 사용자 권리 및 광고 추적 거부">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>iOS</strong>: 설정 → 개인정보 보호 및 보안 → 추적에서
            앱별 추적을 끌 수 있습니다.
          </li>
          <li>
            <strong>Android</strong>: 설정 → Google → 광고에서 광고 ID 재설정
            또는 맞춤 광고 옵트아웃을 선택할 수 있습니다.
          </li>
        </ul>
      </Sub>
      <Sub heading="5. 데이터 보관">
        <p>
          앱은 자체 서버에 사용자 데이터를 저장하지 않습니다. 충돌 로그·이용 통계는
          제3자 분석 서비스에서 표준 보관 기간(통상 90일~2년)에 따라 처리됩니다.
        </p>
      </Sub>
      <Sub heading="6. 어린이 개인정보 보호">
        <p>
          본 앱은 13세 미만 어린이로부터 개인 식별 정보를 의도적으로 수집하지
          않습니다. 어린이가 정보를 제공한 사실을 인지한 경우 즉시 삭제합니다.
        </p>
      </Sub>
      <Sub heading="7. 방침 변경">
        <p>
          본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 본
          페이지를 통해 공지합니다.
        </p>
      </Sub>
      <Sub heading="8. 연락처">
        <p>
          개인정보 관련 문의는{' '}
          <a
            href="mailto:support@hisgtory.com"
            className="text-cherry underline-offset-2 hover:underline"
          >
            support@hisgtory.com
          </a>
          으로 보내주세요.
        </p>
      </Sub>
      <p className="mt-6 text-xs text-slate-400">
        최종 업데이트: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}

function Sub({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-slate-900">{heading}</h3>
      <div className="mt-1">{children}</div>
    </div>
  );
}
