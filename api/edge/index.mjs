// Lambda@Edge: CloudFront origin-request에서 Lambda Function URL(AuthType=AWS_IAM)을
// 호출하기 위한 SigV4 서명만 추가. 다른 read-only 헤더(cloudfront-viewer-*, x-amz-cf-*)는
// 절대 건드리지 않음 — 건드리면 LambdaValidationError 발생.

import { createHash, createHmac } from 'node:crypto';

const TARGET_HOST = 'w7z2kkou4qq7m7kzgxah6zr4yi0pukrq.lambda-url.ap-northeast-2.on.aws';
const TARGET_REGION = 'ap-northeast-2';
const SERVICE = 'lambda';

const sha256hex = (data) => createHash('sha256').update(data).digest('hex');
const hmacBytes = (key, data) => createHmac('sha256', key).update(data).digest();

function deriveSigningKey(secret, dateStamp, region, service) {
  const kDate    = hmacBytes(`AWS4${secret}`, dateStamp);
  const kRegion  = hmacBytes(kDate, region);
  const kService = hmacBytes(kRegion, service);
  return hmacBytes(kService, 'aws4_request');
}

export const handler = async (event) => {
  const request = event.Records[0].cf.request;

  // body 추출 (CloudFront → base64 인코딩)
  let bodyBytes = Buffer.alloc(0);
  if (request.body?.data) {
    bodyBytes = request.body.encoding === 'base64'
      ? Buffer.from(request.body.data, 'base64')
      : Buffer.from(request.body.data);
  }
  const bodyHash = sha256hex(bodyBytes);

  // SigV4 metadata
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // 20260503T120000Z
  const dateStamp = amzDate.slice(0, 8);
  const accessKey    = process.env.AWS_ACCESS_KEY_ID;
  const secretKey    = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  // 서명에 포함할 최소 헤더 — host + x-amz-date + x-amz-content-sha256 (+ session token)
  const signingHeaders = {
    'host': TARGET_HOST,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': bodyHash,
  };
  if (sessionToken) signingHeaders['x-amz-security-token'] = sessionToken;

  // canonical request
  const pathOnly = request.uri || '/';
  const canonicalQuery = (request.querystring || '')
    .split('&').filter(Boolean)
    .map((kv) => {
      const [k, v = ''] = kv.split('=');
      return `${encodeURIComponent(decodeURIComponent(k))}=${encodeURIComponent(decodeURIComponent(v))}`;
    })
    .sort().join('&');

  const sortedHeaderNames = Object.keys(signingHeaders).sort();
  const canonicalHeaders = sortedHeaderNames
    .map((k) => `${k}:${String(signingHeaders[k]).trim().replace(/\s+/g, ' ')}`)
    .join('\n') + '\n';
  const signedHeadersStr = sortedHeaderNames.join(';');

  const canonicalRequest = [
    request.method, pathOnly, canonicalQuery,
    canonicalHeaders, signedHeadersStr, bodyHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${TARGET_REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join('\n');

  const signingKey = deriveSigningKey(secretKey, dateStamp, TARGET_REGION, SERVICE);
  const signature  = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

  // 기존 request.headers를 mutate (재구성 X) — read-only 헤더 보존
  request.headers['x-amz-date'] = [{ key: 'X-Amz-Date', value: amzDate }];
  request.headers['x-amz-content-sha256'] = [{ key: 'X-Amz-Content-Sha256', value: bodyHash }];
  if (sessionToken) {
    request.headers['x-amz-security-token'] = [{ key: 'X-Amz-Security-Token', value: sessionToken }];
  }
  request.headers['authorization'] = [{ key: 'Authorization', value: authHeader }];

  return request;
};
