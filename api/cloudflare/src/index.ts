import { Container } from '@cloudflare/containers';

export interface Env {
  API: DurableObjectNamespace<ArcadeApi>;
  /** Cloudflare wrangler `[vars]` */
  AWS_REGION: string;
  DDB_TABLE: string;
  RUST_LOG?: string;
  /** Cloudflare secrets (`wrangler secret put`) */
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

/**
 * arcade-api Rust 바이너리를 wrap하는 Durable Object 컨테이너.
 *
 * - Worker가 모든 HTTP 요청을 단일 DO 인스턴스로 보냄 → DO가 컨테이너 fetch.
 * - sleepAfter: idle 5분 후 컨테이너 정지(scale-to-zero) → 비용 절감.
 * - max_instances=5 (wrangler.toml)에 따라 트래픽이 늘어나면 DO 단위로 수평 분산.
 */
export class ArcadeApi extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = '5m';
  envVars: Record<string, string> = {};

  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    this.envVars = {
      PORT: '8080',
      DDB_TABLE: env.DDB_TABLE,
      AWS_REGION: env.AWS_REGION,
      AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
      RUST_LOG: env.RUST_LOG ?? 'arcade_api=info,tower_http=info',
    };
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // 단일 named ID로 모든 요청 라우팅. 트래픽이 늘면 max_instances 까지 DO가 자동 분산.
    const id = env.API.idFromName('singleton');
    const stub = env.API.get(id);
    return stub.fetch(req);
  },
};
