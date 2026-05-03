#!/usr/bin/env bash
#
# arcade-api CloudFront + Lambda 보안 bootstrap (1회 실행).
#
# 동작:
#  1. CloudFront Origin Access Control(OAC) 생성
#  2. CloudFront distribution 생성 (Lambda Function URL을 origin으로)
#  3. Lambda Function URL → AuthType=AWS_IAM 으로 잠금
#  4. 기존 public-invoke 정책 제거
#  5. CloudFront OAC만 invoke 허용하는 정책으로 교체
#
# 결과: arcade-api.hisgtory.com → CloudFront → Lambda (CF만 통과 가능)
#
# 사용:
#   1. 아래 변수 채우기 (CERT_ARN 만 새로 받아 채우면 됨)
#   2. 529040228357 계정 자격증명으로 본 스크립트 실행
#      예: AWS_PROFILE=arcade ./cloudfront-bootstrap.sh
#         또는 AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... ./cloudfront-bootstrap.sh
#   3. 끝나면 출력된 distribution 도메인을 Cloudflare DNS arcade-api CNAME 에 박기

set -euo pipefail

# ============================================================
# 설정 — 본인 환경 값으로 채우기
# ============================================================
CERT_ARN="arn:aws:acm:ap-northeast-2:529040228357:certificate/443ad93a-d3df-4ed5-9000-38e0d177fd3a"
LAMBDA_NAME="arcade-api"
LAMBDA_REGION="ap-northeast-2"
LAMBDA_HOST="w7z2kkou4qq7m7kzgxah6zr4yi0pukrq.lambda-url.ap-northeast-2.on.aws"
DOMAIN="arcade-api.hisgtory.com"

# ============================================================
# 인자 파싱 (CERT_ARN을 첫 인자로 넘겨도 됨)
# ============================================================
if [[ -z "$CERT_ARN" && "${1:-}" != "" ]]; then
  CERT_ARN="$1"
fi

if [[ -z "$CERT_ARN" ]]; then
  echo "ERROR: CERT_ARN이 필요합니다." >&2
  echo "사용법: $0 <ACM_CERT_ARN>" >&2
  echo "  또는: CERT_ARN=arn:aws:acm:us-east-1:... $0" >&2
  exit 1
fi

# ============================================================
# 사전 검증
# ============================================================
echo "==> AWS 계정 확인"
aws sts get-caller-identity --profile hisgtory

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq 가 필요합니다. brew install jq 또는 apt install jq" >&2
  exit 1
fi

# ============================================================
# Step 1: Origin Access Control (있으면 재사용, 없으면 생성)
# ============================================================
echo
echo "==> Step 1: Origin Access Control(OAC) 확보"

OAC_ID=$(aws cloudfront list-origin-access-controls --output json \
  | jq -r '.OriginAccessControlList.Items[]? | select(.Name == "arcade-api-oac") | .Id' \
  | head -n1)

if [[ -n "$OAC_ID" ]]; then
  echo "    기존 OAC 재사용: $OAC_ID"
else
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config '{
      "Name": "arcade-api-oac",
      "OriginAccessControlOriginType": "lambda",
      "SigningBehavior": "always",
      "SigningProtocol": "sigv4"
    }' \
    --query 'OriginAccessControl.Id' --output text)
  echo "    새 OAC 생성: $OAC_ID"
fi

# ============================================================
# Step 2: Distribution (있으면 재사용, 없으면 생성)
# ============================================================
echo
echo "==> Step 2: CloudFront distribution 확보"

DIST_INFO=$(aws cloudfront list-distributions --output json \
  | jq --arg domain "$DOMAIN" -r '
      .DistributionList.Items[]?
      | select(.Aliases.Items // [] | index($domain))
      | "\(.Id)|\(.ARN)|\(.DomainName)"' \
  | head -n1)

if [[ -n "$DIST_INFO" ]]; then
  DIST_ID="${DIST_INFO%%|*}"
  rest="${DIST_INFO#*|}"
  DIST_ARN="${rest%%|*}"
  DIST_DOMAIN="${rest#*|}"
  echo "    기존 distribution 재사용: $DIST_ID"
  echo "    Domain: $DIST_DOMAIN"
else

DIST_CONFIG=$(mktemp)
trap 'rm -f "$DIST_CONFIG"' EXIT

cat > "$DIST_CONFIG" <<EOF
{
  "CallerReference": "arcade-api-$(date +%s)",
  "Comment": "arcade-api Lambda Function URL proxy",
  "Aliases": { "Quantity": 1, "Items": ["$DOMAIN"] },
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "lambda-fnurl",
      "DomainName": "$LAMBDA_HOST",
      "OriginAccessControlId": "$OAC_ID",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only",
        "OriginSslProtocols": { "Quantity": 1, "Items": ["TLSv1.2"] },
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5
      },
      "CustomHeaders": { "Quantity": 0 },
      "OriginShield": { "Enabled": false },
      "ConnectionAttempts": 3,
      "ConnectionTimeout": 10
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "lambda-fnurl",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET","HEAD","OPTIONS","PUT","POST","PATCH","DELETE"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] }
    },
    "Compress": true,
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
    "OriginRequestPolicyId": "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_200",
  "Enabled": true,
  "HttpVersion": "http2"
}
EOF

DIST_RAW=$(aws cloudfront create-distribution --distribution-config "file://$DIST_CONFIG")
DIST_ID=$(echo "$DIST_RAW"   | jq -r '.Distribution.Id')
DIST_ARN=$(echo "$DIST_RAW"  | jq -r '.Distribution.ARN')
DIST_DOMAIN=$(echo "$DIST_RAW" | jq -r '.Distribution.DomainName')

echo "    새 distribution 생성: $DIST_ID"
echo "    Domain: $DIST_DOMAIN"

fi  # if distribution exists / not

# ============================================================
# Step 3: Lambda Function URL → AuthType=AWS_IAM
# ============================================================
echo
echo "==> Step 3: Lambda Function URL AuthType=AWS_IAM 으로 잠금"
aws lambda update-function-url-config \
  --function-name "$LAMBDA_NAME" \
  --region "$LAMBDA_REGION" \
  --auth-type AWS_IAM \
  --query AuthType --output text

# ============================================================
# Step 4: 기존 public-invoke 정책 제거
# ============================================================
echo
echo "==> Step 4: 기존 public-invoke 정책 제거"

# 우리가 알고 있는 statement IDs
for sid in PublicInvokeFunctionUrl PublicInvokeFunction FunctionURLAllowPublicAccess; do
  if aws lambda remove-permission \
        --function-name "$LAMBDA_NAME" \
        --region "$LAMBDA_REGION" \
        --statement-id "$sid" 2>/dev/null; then
    echo "    removed: $sid"
  fi
done

# AWS auto-attached statements (FunctionUrlAllowPublicAccess-{uuid})
existing=$(aws lambda get-policy \
  --function-name "$LAMBDA_NAME" \
  --region "$LAMBDA_REGION" \
  --query Policy --output text 2>/dev/null \
  | jq -r '.Statement[]?.Sid // empty' \
  | grep -E '^FunctionUrlAllowPublicAccess-' || true)

if [[ -n "$existing" ]]; then
  while read -r sid; do
    aws lambda remove-permission \
      --function-name "$LAMBDA_NAME" \
      --region "$LAMBDA_REGION" \
      --statement-id "$sid"
    echo "    removed: $sid"
  done <<<"$existing"
fi

# ============================================================
# Step 5: CloudFront OAC만 invoke 허용
# ============================================================
echo
echo "==> Step 5: CloudFront OAC invoke 허용 정책 추가"

# 기존 AllowCloudFrontOAC 있으면 제거 후 새로 추가 (DIST_ARN이 바뀌었을 수 있으므로)
aws lambda remove-permission \
  --function-name "$LAMBDA_NAME" \
  --region "$LAMBDA_REGION" \
  --statement-id AllowCloudFrontOAC 2>/dev/null && echo "    removed stale: AllowCloudFrontOAC" || true

aws lambda add-permission \
  --function-name "$LAMBDA_NAME" \
  --region "$LAMBDA_REGION" \
  --statement-id AllowCloudFrontOAC \
  --action lambda:InvokeFunctionUrl \
  --principal cloudfront.amazonaws.com \
  --source-arn "$DIST_ARN" \
  --function-url-auth-type AWS_IAM \
  --query Statement --output text >/dev/null
echo "    added: AllowCloudFrontOAC"

# ============================================================
# 마무리
# ============================================================
echo
echo "============================================================"
echo " ✅ Bootstrap 완료"
echo "============================================================"
echo
echo " 다음 단계 (Cloudflare DNS):"
echo "   arcade-api 레코드를 다음으로 수정/생성:"
echo "     Type:   CNAME"
echo "     Target: $DIST_DOMAIN"
echo "     Proxy:  DNS only (회색 구름)"
echo
echo " CloudFront 배포 상태 확인 (5~15분 propagation):"
echo "   aws cloudfront get-distribution \\"
echo "     --id $DIST_ID --query 'Distribution.Status'"
echo
echo " 검증:"
echo "   curl -i https://$DOMAIN/health"
echo
