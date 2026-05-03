#!/usr/bin/env bash
#
# Lambda@Edge SigV4 signer 배포 + CloudFront 통합.
#
# 배경:
#   CloudFront OAC가 Lambda Function URL의 POST body를 제대로 서명 못 하는
#   알려진 제약 때문에, Lambda@Edge로 origin-request를 가로채 직접 SigV4 서명.
#
# 동작:
#   1. us-east-1에 IAM role 생성 (Lambda@Edge용)
#   2. Lambda@Edge 함수 배포 (api/edge/index.mjs)
#   3. 버전 publish (Lambda@Edge는 versioned ARN 필요)
#   4. CloudFront distribution 업데이트:
#      - origin에서 OAC 제거
#      - DefaultCacheBehavior에 LambdaFunctionAssociations(origin-request) 추가
#   5. target Lambda resource policy 정리 (OAC 항목 제거 + edge role 허용 추가)
#
# 사용:
#   AWS_PROFILE=hisgtory ./api/scripts/edge-signer-bootstrap.sh

set -euo pipefail
export AWS_PROFILE="${AWS_PROFILE:-hisgtory}"

# ============================================================
# 설정
# ============================================================
EDGE_NAME="arcade-api-edge-signer"
EDGE_REGION="us-east-1"          # Lambda@Edge 필수
EDGE_ROLE_NAME="arcade-api-edge-role"

LAMBDA_NAME="arcade-api"
LAMBDA_REGION="ap-northeast-2"
LAMBDA_HOST="w7z2kkou4qq7m7kzgxah6zr4yi0pukrq.lambda-url.ap-northeast-2.on.aws"
DOMAIN="arcade-api.hisgtory.com"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_ARN="arn:aws:lambda:${LAMBDA_REGION}:${ACCOUNT_ID}:function:${LAMBDA_NAME}"

EDGE_DIR="$(cd "$(dirname "$0")/../edge" && pwd)"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq 필요" >&2; exit 1
fi
if ! command -v zip >/dev/null 2>&1; then
  echo "ERROR: zip 필요" >&2; exit 1
fi

echo "==> 계정: $ACCOUNT_ID"

# ============================================================
# Step 1: IAM role for Lambda@Edge
# ============================================================
echo
echo "==> Step 1: Lambda@Edge IAM role 확보"

TRUST_POLICY=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": ["lambda.amazonaws.com", "edgelambda.amazonaws.com"] },
    "Action": "sts:AssumeRole"
  }]
}
EOF
)

if ROLE_ARN=$(aws iam get-role --role-name "$EDGE_ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null); then
  echo "    기존 role 재사용: $ROLE_ARN"
else
  ROLE_ARN=$(aws iam create-role \
    --role-name "$EDGE_ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --query 'Role.Arn' --output text)
  echo "    새 role 생성: $ROLE_ARN"

  # 기본 실행 권한 (CloudWatch Logs)
  aws iam attach-role-policy \
    --role-name "$EDGE_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  # IAM propagation wait
  echo "    role propagation 대기 (10s)..."
  sleep 10
fi

# Edge가 target Lambda Function URL을 invoke할 권한.
# AWS_IAM Function URL은 InvokeFunctionUrl + InvokeFunction 둘 다 필요.
INLINE_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["lambda:InvokeFunctionUrl", "lambda:InvokeFunction"],
    "Resource": "$LAMBDA_ARN"
  }]
}
EOF
)
aws iam put-role-policy \
  --role-name "$EDGE_ROLE_NAME" \
  --policy-name InvokeArcadeApi \
  --policy-document "$INLINE_POLICY"
echo "    inline policy InvokeArcadeApi 적용"

# ============================================================
# Step 2: Edge 함수 코드 zip 생성 (host/region 자동 주입)
# ============================================================
echo
echo "==> Step 2: Edge 함수 코드 패키징"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

cp "$EDGE_DIR/index.mjs" "$WORK/index.mjs"
cp "$EDGE_DIR/package.json" "$WORK/package.json"

# host/region 주입 (스크립트 변수로 덮어쓰기)
python3 - "$WORK/index.mjs" "$LAMBDA_HOST" "$LAMBDA_REGION" <<'PY'
import sys, re
path, host, region = sys.argv[1:4]
with open(path) as f: src = f.read()
src = re.sub(r"const TARGET_HOST = '[^']*';", f"const TARGET_HOST = '{host}';", src)
src = re.sub(r"const TARGET_REGION = '[^']*';", f"const TARGET_REGION = '{region}';", src)
with open(path, 'w') as f: f.write(src)
PY

cd "$WORK"
zip -q -r function.zip index.mjs package.json
ZIP_PATH="$WORK/function.zip"
echo "    패키지: $ZIP_PATH ($(wc -c <"$ZIP_PATH") bytes)"
cd - >/dev/null

# ============================================================
# Step 3: Lambda@Edge 함수 배포 (us-east-1)
# ============================================================
echo
echo "==> Step 3: Lambda@Edge 함수 배포 (region=$EDGE_REGION)"

if aws lambda get-function --function-name "$EDGE_NAME" --region "$EDGE_REGION" >/dev/null 2>&1; then
  echo "    기존 함수 코드 업데이트"
  aws lambda update-function-code \
    --function-name "$EDGE_NAME" \
    --region "$EDGE_REGION" \
    --zip-file "fileb://$ZIP_PATH" \
    --publish \
    --query 'Version' --output text > /tmp/edge-ver
else
  echo "    새 함수 생성"
  aws lambda create-function \
    --function-name "$EDGE_NAME" \
    --region "$EDGE_REGION" \
    --runtime nodejs20.x \
    --role "$ROLE_ARN" \
    --handler index.handler \
    --zip-file "fileb://$ZIP_PATH" \
    --memory-size 128 \
    --timeout 5 \
    --publish \
    --query 'Version' --output text > /tmp/edge-ver
fi

EDGE_VERSION=$(cat /tmp/edge-ver)
EDGE_VERSIONED_ARN="arn:aws:lambda:${EDGE_REGION}:${ACCOUNT_ID}:function:${EDGE_NAME}:${EDGE_VERSION}"
echo "    versioned ARN: $EDGE_VERSIONED_ARN"

# ============================================================
# Step 4: CloudFront distribution 업데이트
# ============================================================
echo
echo "==> Step 4: CloudFront distribution 업데이트"

DIST_ID=$(aws cloudfront list-distributions --output json \
  | jq -r --arg d "$DOMAIN" '
      .DistributionList.Items[]?
      | select(.Aliases.Items // [] | index($d))
      | .Id' \
  | head -n1)

if [[ -z "$DIST_ID" ]]; then
  echo "ERROR: $DOMAIN 에 매핑된 distribution 없음. 먼저 cloudfront-bootstrap.sh 실행." >&2
  exit 1
fi

aws cloudfront get-distribution-config --id "$DIST_ID" > /tmp/dist.json
ETAG=$(jq -r '.ETag' /tmp/dist.json)

# 1) origin에서 OAC 제거 (빈 문자열로)
# 2) DefaultCacheBehavior에 LambdaFunctionAssociations 주입
jq --arg arn "$EDGE_VERSIONED_ARN" '
    .DistributionConfig
    | .Origins.Items |= map(
        if .Id == "lambda-fnurl" then .OriginAccessControlId = "" else . end
      )
    | .DefaultCacheBehavior.LambdaFunctionAssociations = {
        Quantity: 1,
        Items: [{
          LambdaFunctionARN: $arn,
          EventType: "origin-request",
          IncludeBody: true
        }]
      }
  ' /tmp/dist.json > /tmp/dist-new.json

aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --if-match "$ETAG" \
  --distribution-config file:///tmp/dist-new.json \
  --query 'Distribution.{Id:Id,Status:Status}'

# ============================================================
# Step 5: target Lambda resource policy 정리
# ============================================================
echo
echo "==> Step 5: target Lambda resource policy 정리"

# OAC 시절의 statements 제거
for sid in AllowCloudFrontOAC AllowCloudFrontOAC2 TempPublic1 TempPublic2; do
  if aws lambda remove-permission \
        --function-name "$LAMBDA_NAME" \
        --region "$LAMBDA_REGION" \
        --statement-id "$sid" 2>/dev/null; then
    echo "    removed: $sid"
  fi
done

# Edge role 명시 권한 — AWS_IAM Function URL은 두 액션 모두 필요.
# (identity policy만으로 충분하지만 명시해두면 회복력↑)
POLICY_JSON=$(aws lambda get-policy --function-name "$LAMBDA_NAME" --region "$LAMBDA_REGION" \
              --query Policy --output text 2>/dev/null || echo '{"Statement":[]}')

if ! echo "$POLICY_JSON" | jq -e '.Statement[]? | select(.Sid == "AllowEdgeSigner")' >/dev/null 2>&1; then
  aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --region "$LAMBDA_REGION" \
    --statement-id AllowEdgeSigner \
    --action lambda:InvokeFunctionUrl \
    --principal "$ROLE_ARN" \
    --function-url-auth-type AWS_IAM \
    --query Statement --output text >/dev/null
  echo "    added: AllowEdgeSigner (InvokeFunctionUrl)"
fi

if ! echo "$POLICY_JSON" | jq -e '.Statement[]? | select(.Sid == "AllowEdgeSignerInvoke")' >/dev/null 2>&1; then
  aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --region "$LAMBDA_REGION" \
    --statement-id AllowEdgeSignerInvoke \
    --action lambda:InvokeFunction \
    --principal "$ROLE_ARN" \
    --query Statement --output text >/dev/null
  echo "    added: AllowEdgeSignerInvoke (InvokeFunction)"
fi

# ============================================================
# 완료
# ============================================================
echo
echo "============================================================"
echo " ✅ Edge signer 배포 완료"
echo "============================================================"
echo
echo " Distribution propagation 대기 (5~15분)"
echo "   aws cloudfront get-distribution --id $DIST_ID --query 'Distribution.Status'"
echo "   → \"Deployed\" 떠야 함"
echo
echo " 검증:"
echo "   curl -i https://$DOMAIN/health"
echo "   curl -X POST https://$DOMAIN/v1/jf/stage/tiles \\"
echo "     -H 'content-type: application/json' \\"
echo "     -d '{\"stage\":1,\"objects\":2}'"
echo
