import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, LegalShell } from '@/components/legal/LegalShell';

const LAST_UPDATED = '2026-05-03';

export const metadata: Metadata = {
  title: 'Juicy Fruits 이용약관',
  description:
    'Juicy Fruits 앱 이용에 관한 사용자와 회사의 권리·의무·책임을 정한 약관입니다.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalShell
      title="이용약관"
      subtitle="Juicy Fruits"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        본 약관(이하 "약관")은 hisgtory(이하 "회사")가 제공하는 모바일 게임
        Juicy Fruits(이하 "앱") 서비스의 이용 조건을 정합니다. 사용자가 앱을
        설치·실행함으로써 본 약관에 동의한 것으로 간주합니다. 본 약관에 동의하지
        않는 경우 앱 이용을 중단하고 삭제해 주세요.
      </p>

      <LegalSection heading="1. 정의">
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>"앱"</strong> — Juicy Fruits 모바일 애플리케이션</li>
          <li>
            <strong>"사용자"</strong> — 앱을 설치·실행하는 모든 자연인
          </li>
          <li>
            <strong>"콘텐츠"</strong> — 앱에서 제공되는 게임 스테이지, 그래픽,
            음악, 텍스트, 코드 등 일체
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. 서비스 내용">
        <p>
          앱은 과일 매치 3 퍼즐 게임 콘텐츠와 글로벌 리더보드, 인앱 광고 보상
          기능을 무료로 제공합니다. 회사는 사전 예고 후 또는 불가피한 경우 사후
          공지로 서비스의 일부 또는 전부를 변경·중단할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="3. 이용 가능 조건">
        <ul className="ml-5 list-disc space-y-1">
          <li>만 13세 이상 또는 거주 국가 법령상 디지털 서비스 이용이 가능한 연령 이상이어야 합니다.</li>
          <li>만 13세 미만은 보호자의 동의·감독 하에서만 이용해 주세요.</li>
          <li>거주 국가의 법령이 앱 이용을 금지하는 경우 이용할 수 없습니다.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. 사용자의 의무 및 금지 행위">
        <p>사용자는 다음 행위를 하지 않기로 합니다.</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>앱 또는 서버를 자동화 도구·치트로 부정 조작하는 행위</li>
          <li>앱의 코드 분해, 리버스 엔지니어링, 디컴파일</li>
          <li>리더보드 점수의 위조·조작 또는 다른 사용자 사칭</li>
          <li>API 엔드포인트에 대한 비정상적 트래픽(DoS, 스크레이핑 등)</li>
          <li>회사·제3자의 권리를 침해하거나 법령에 위반되는 행위</li>
        </ul>
        <p>
          위반 시 회사는 사전 통지 없이 익명 식별자를 차단하거나 데이터를
          무효 처리할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="5. 광고 및 보상">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            앱은 Google AdMob 등을 통해 배너·전면·보상형 광고를 표시합니다.
          </li>
          <li>
            보상형 광고를 끝까지 시청한 경우 게임 내 가상 재화(코인 등)가
            지급됩니다. 가상 재화는 현금 가치가 없으며 환전·환불 대상이
            아닙니다.
          </li>
          <li>
            광고 콘텐츠 자체에 대한 책임은 광고주에게 있으며, 회사는 광고로
            발생한 손해에 대해 책임지지 않습니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. 가상 재화 및 진행 데이터">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            코인, 아이템, 스테이지 진행도 등 게임 내 데이터는 회사에 귀속되며,
            사용자는 약관 범위 안에서 이용권만을 가집니다.
          </li>
          <li>
            서비스 종료, 약관 위반, 기술적 사유로 데이터가 소실될 수 있으며
            이에 대한 보상 의무는 없습니다.
          </li>
          <li>
            기기 변경 시 진행 데이터는 익명 식별자에 연동된 만큼만 복원되며,
            기기 초기화 등으로 식별자가 사라진 경우 복원이 어려울 수 있습니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. 지적 재산권">
        <p>
          앱과 콘텐츠의 모든 지적 재산권은 회사 또는 정당한 권리자에게
          귀속됩니다. 사용자는 개인적·비상업적 용도로만 앱을 사용할 수 있으며,
          서면 동의 없이 콘텐츠를 복제·배포·2차 가공·상업적 이용할 수 없습니다.
        </p>
      </LegalSection>

      <LegalSection heading="8. 면책 및 책임 제한">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            앱은 "있는 그대로(as-is)" 제공되며, 특정 목적 적합성·결함 부재·중단
            없는 작동을 보장하지 않습니다.
          </li>
          <li>
            천재지변, 전쟁, 통신망 장애, 제3자 서비스(AWS, AdMob 등) 장애 등
            회사의 합리적 통제 범위를 벗어난 사유로 발생한 손해에 대해 책임을
            지지 않습니다.
          </li>
          <li>
            관련 법령이 허용하는 최대 범위에서, 회사의 책임은 사용자가 앱
            이용으로 직접 회사에 지급한 금액(무료 앱의 경우 0원)을 한도로
            합니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="9. 서비스 변경 및 종료">
        <p>
          회사는 운영상·기술상 필요에 따라 서비스의 일부 또는 전부를 변경하거나
          종료할 수 있습니다. 종료 시 최소 30일 전에 앱 내 또는 본 사이트를
          통해 공지합니다.
        </p>
      </LegalSection>

      <LegalSection heading="10. 약관 변경">
        <p>
          회사는 본 약관을 변경할 수 있으며, 변경 시 변경 사항 및 시행일을
          본 페이지에 게시합니다. 사용자가 시행일 이후 앱을 계속 이용하는 경우
          변경된 약관에 동의한 것으로 봅니다. 사용자에게 불리한 중요한 변경의
          경우 시행일 7일 전부터 앱 내 알림으로 안내합니다.
        </p>
      </LegalSection>

      <LegalSection heading="11. 준거법 및 분쟁 해결">
        <p>
          본 약관은 대한민국 법에 따라 해석·적용됩니다. 회사와 사용자 사이에
          발생한 분쟁은 우선 상호 협의로 해결하며, 협의가 이루어지지 않을 경우
          민사소송법상 관할 법원을 제1심 관할 법원으로 합니다.
        </p>
      </LegalSection>

      <LegalSection heading="12. 개인정보">
        <p>
          개인정보 수집·이용에 관한 사항은 별도의{' '}
          <Link
            href="/juicy-fruits/privacy"
            className="text-cherry underline-offset-2 hover:underline"
          >
            개인정보 처리방침
          </Link>
          을 따릅니다.
        </p>
      </LegalSection>

      <LegalSection heading="13. 연락처">
        <p>본 약관 또는 서비스에 관한 문의는 아래로 연락해 주세요.</p>
        <p className="mt-2">
          <a
            href="mailto:support@hisgtory.com"
            className="font-display text-xl text-cherry hover:underline"
          >
            support@hisgtory.com
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
