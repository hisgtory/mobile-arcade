import type { NextConfig } from 'next';

const config: NextConfig = {
  // Cloudflare Pages 정적 호스팅용 export. 빌드 결과는 web/site/out/ 에 생성됨.
  output: 'export',
  reactStrictMode: true,
  images: {
    // export 모드에서는 next/image 최적화가 동작 안 함.
    // 사용 시 unoptimized: true 또는 외부 loader 필요.
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
  },
  // 모든 라우트 끝에 / 붙여 정적 호스트와 호환성 향상.
  trailingSlash: true,
};

export default config;
