import type { Metadata } from 'next';
import { LegalSection, LegalShell } from '@/components/legal/LegalShell';

const LAST_UPDATED = '2026-05-03';

export const metadata: Metadata = {
  title: 'Juicy Fruits 개인정보 처리방침',
  description:
    'Juicy Fruits 앱이 수집·이용하는 개인정보의 항목, 목적, 보관 기간 및 사용자 권리에 대한 안내입니다.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      title="개인정보 처리방침"
      subtitle="Juicy Fruits"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        hisgtory(이하 "회사")는 Juicy Fruits(이하 "앱") 사용자의 개인정보를
        소중히 다룹니다. 본 방침은 앱이 어떤 정보를 수집하고, 어떤 목적으로
        이용하며, 어떻게 보관·삭제하는지를 설명합니다.
      </p>

      <LegalSection heading="1. 수집하는 정보">
        <p>앱은 이름·이메일·전화번호·주소 등 직접적인 개인 식별 정보를 수집하지 않습니다. 다음 항목만 수집합니다.</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>익명 식별자</strong>: 앱 첫 실행 시 기기 안에서 임의로
            생성되는 21자 익명 ID(이하 "userId"). 이름·이메일과 연결되지
            않습니다.
          </li>
          <li>
            <strong>게임 진행 데이터</strong>: 클리어한 스테이지 번호, 클리어
            소요 시간(초), 보드 타일 배치(서버에 캐시된 변형이 없는 경우에 한해
            기여 목적으로 전송).
          </li>
          <li>
            <strong>분석 이벤트</strong>: 앱 실행, 스테이지 클리어/실패, 아이템
            사용, 광고 보상 수령, 음소거/볼륨 변경 등 게임 사용 패턴.
          </li>
          <li>
            <strong>광고 식별자</strong>: iOS의 IDFA, Android의 광고 ID(AAID).
          </li>
          <li>
            <strong>기기 정보</strong>: OS 버전, 모델, 언어, 충돌 로그.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. 수집·이용 목적">
        <ul className="ml-5 list-disc space-y-1">
          <li>게임 진행도 저장 및 동기화</li>
          <li>리더보드 및 랭킹 산출, 글로벌 클리어 순위 표시</li>
          <li>맞춤형 광고 송출 및 광고 성과 측정</li>
          <li>서비스 안정성 개선, 버그 진단, 성능 분석</li>
          <li>이용 통계 분석을 통한 게임 디자인 개선</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. 다른 사용자에게 공개되는 정보">
        <p>
          리더보드 화면에서 다음 정보가 다른 사용자에게 공개될 수 있습니다.
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>익명 식별자(userId)</li>
          <li>도달한 최고 스테이지</li>
          <li>스테이지별 최단 클리어 시간</li>
        </ul>
        <p>
          공개되는 항목에는 이름·이메일·기기 정보 등 개인을 직접 식별할 수 있는
          데이터가 포함되지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="4. 제3자 제공 및 처리 위탁">
        <p>다음 제3자에게 정보가 처리·전달됩니다.</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Google AdMob</strong> — 광고 송출 및 측정. 자세한 내용은{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cherry underline-offset-2 hover:underline"
            >
              Google 개인정보 처리방침
            </a>{' '}
            참고.
          </li>
          <li>
            <strong>Amazon Web Services(AWS DynamoDB)</strong> — 게임 진행 및
            분석 데이터의 저장.
          </li>
          <li>
            <strong>Railway</strong> — API 서버 호스팅(국외 서버 포함될 수
            있음).
          </li>
        </ul>
        <p>
          제3자 서비스에 전달되는 정보는 본 방침에서 정의한 목적 범위 내에서만
          사용되며, 제3자가 자체 마케팅에 활용하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="5. 보관 기간">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>분석 이벤트</strong>: 수집일로부터 90일 후 자동 삭제(DynamoDB
            TTL).
          </li>
          <li>
            <strong>익명 식별자, 게임 진행도, 클리어 기록</strong>: 사용자가
            삭제를 요청하기 전까지 보관. 통계·분석 목적상 영구 보관할 수 있는
            비식별 집계는 예외.
          </li>
          <li>
            <strong>충돌 로그</strong>: 제3자 분석 서비스의 표준 보관 기간(통상
            90일~2년)을 따릅니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. 데이터 삭제 요청">
        <p>
          사용자는 언제든지 자신의 익명 식별자(userId)에 연결된 모든 데이터의
          삭제를 요청할 수 있습니다. 요청 방법:
        </p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>앱 → 설정 또는 디버그 메뉴에서 익명 ID 확인</li>
          <li>
            <a
              href="mailto:support@hisgtory.com?subject=Data%20Deletion%20Request"
              className="text-cherry underline-offset-2 hover:underline"
            >
              support@hisgtory.com
            </a>
            으로 익명 ID와 함께 삭제 요청
          </li>
          <li>접수일로부터 영업일 기준 7일 이내 처리 후 회신</li>
        </ol>
      </LegalSection>

      <LegalSection heading="7. 사용자 권리 및 광고 추적 거부">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>iOS</strong>: 설정 → 개인정보 보호 및 보안 → 추적에서 앱별
            추적을 끌 수 있습니다.
          </li>
          <li>
            <strong>Android</strong>: 설정 → Google → 광고에서 광고 ID 재설정
            또는 맞춤 광고 옵트아웃을 선택할 수 있습니다.
          </li>
          <li>
            EEA / UK 거주자: GDPR에 따라 처리 정지·삭제·이전 요청권을 가집니다.
            상기 이메일로 요청해 주세요.
          </li>
          <li>
            캘리포니아 거주자: CCPA에 따른 알 권리 및 삭제권을 행사할 수
            있습니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="8. 어린이 개인정보 보호">
        <p>
          본 앱은 만 13세 미만 어린이로부터 개인 식별 정보를 의도적으로 수집하지
          않습니다. 어린이가 정보를 제공한 사실을 인지한 경우 즉시 삭제합니다.
          보호자는 자녀의 익명 식별자에 연결된 데이터의 삭제를 위 6항의 절차로
          요청할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="9. 보안">
        <p>
          전송 구간은 TLS로 암호화되며, 저장 데이터는 AWS 표준 암호화로
          보호됩니다. 다만 인터넷을 통한 전송에서 절대적 보안을 보장할 수
          있는 방법은 없으므로, 회사는 합리적인 보호 조치 의무만 부담합니다.
        </p>
      </LegalSection>

      <LegalSection heading="10. 방침 변경">
        <p>
          본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 본
          페이지에 게시일과 함께 공지합니다. 중요한 변경의 경우 앱 내 알림 또는
          이메일로 별도 안내할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="11. 연락처">
        <p>
          개인정보 처리 관련 문의 및 권리 행사 요청은 아래로 연락해
          주세요.
        </p>
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
