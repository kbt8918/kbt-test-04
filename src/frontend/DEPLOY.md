# 안심맵(AnsimMap) 배포 가이드 — Supabase + Vercel

프론트엔드(Next.js App Router) + 백엔드(API Route Handlers)가 한 프로젝트(`src/frontend`)에 통합되어 있습니다.

## 1. Supabase 스키마 적용

`.env.local` 에 `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 가 채워져 있어야 합니다 (`.AP-key.md` 6번 항목 기준 — 이미 설정됨).

```bash
cd src/frontend
npm install
npm run db:check     # 연결 확인 (마이그레이션 전이면 count: null)
npm run db:migrate   # supabase/migrations/*.sql 순서대로 적용
npm run db:check     # 적용 후 users 테이블 count: 0
```

- `db:migrate` 는 `supabase/migrations/0001_init.sql`(테이블·인덱스), `0002_retention_and_rls.sql`(7일 만료 배치 + RLS)을 적용합니다.
- `pg_cron` 확장이 없는 플랜에서는 0002 의 위치 만료 배치 블록만 SKIP 되고 RLS 는 정상 적용됩니다.
- 백엔드는 `service_role` 키로 동작하여 RLS 를 우회하므로, RLS 는 publishable 키 직접 접근을 막는 안전망입니다.

> 또는 Supabase 대시보드 > SQL Editor 에 두 .sql 파일 내용을 순서대로 붙여넣어 실행해도 됩니다.

## 2. Vercel 프로젝트 연결

### 방법 A — CLI 자동 배포 (권장, 토큰 1개만 필요)

```bash
# 1) https://vercel.com/account/tokens 에서 토큰 발급
# 2) 토큰을 환경변수로 넣고 deploy 스크립트 실행 (PowerShell)
$env:VERCEL_TOKEN="vercel_xxx"; npm run deploy
#    (bash:  VERCEL_TOKEN=vercel_xxx npm run deploy)
```

`scripts/deploy-vercel.mjs` 가 ① 프로젝트 link ② `.env.local` 값으로 Production 환경변수 등록 ③ `vercel --prod` 배포까지 한 번에 수행합니다. 시크릿은 코드에 하드코딩하지 않고 `.env.local` 에서 읽습니다.

### 방법 B — 대시보드 수동 연결

1. Vercel 대시보드 > Add New > Project > GitHub 저장소(`kbt8918/kbt-test-04`) 선택
2. **Root Directory** 를 `부모님위치확인서비스/src/frontend` 로 지정 (모노레포 구조)
3. Framework Preset: **Next.js** (자동 감지)
4. 아래 환경변수 등록 후 Deploy

### Vercel 환경변수 (Settings > Environment Variables)

| 키 | 값 출처 | 비고 |
|----|---------|------|
| `SUPABASE_URL` | `.AP-key.md` 6 | |
| `SUPABASE_KEY` | `.AP-key.md` 6 (publishable) | |
| `SUPABASE_SERVICE_ROLE_KEY` | `.AP-key.md` 6 (service_role) | **백엔드 전용·비공개** |
| `DATABASE_URL` | `postgresql://postgres:[PW]@db.<ref>.supabase.co:5432/postgres` | 마이그레이션 스크립트용(선택) |
| `JWT_SECRET` | 32자 이상 랜덤 문자열 | 로컬과 동일/별도 무관, 비공개 |
| `NEXT_PUBLIC_APP_URL` | `https://<project>.vercel.app` | 초대 링크/QR 생성 |
| `KAKAO_MAP_API_KEY` | 카카오 REST 키 | 역지오코딩(미설정 시 데모 주소) |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오 JS 키 | 지도 SDK(선택) |
| `FCM_SERVER_KEY` | Firebase | SOS/알림 푸시(미설정 시 stub) |
| `KAKAO_ALIMTALK_API_KEY` | 카카오 비즈 | 알림톡(미설정 시 stub) |
| `SMS_API_KEY` / `SMS_SENDER_NUMBER` | NHN Cloud | SMS(미설정 시 stub) |

> `NEXT_PUBLIC_*` 만 클라이언트 번들에 노출됩니다. service_role·JWT·발송 키는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## 3. 외부 연동 키 (단계적 활성화)

FCM·SMS·알림톡 키가 비어 있으면 `lib/notify.ts` 가 **graceful stub** 으로 동작합니다(발송 대상 수만 집계, 실제 전송 생략). 운영 키 등록 시 `notify.ts` 의 해당 함수만 실제 호출로 확장하면 됩니다.

### 카카오맵 (지도 SDK + 역지오코딩)

- `NEXT_PUBLIC_KAKAO_MAP_KEY`(JS 키)가 **있으면** 가족 실시간 지도(SCR-006)가 실제 카카오맵 SDK 로 렌더링됩니다. **없으면** 자동으로 스타일맵(FakeMap)으로 폴백합니다 — `components/MapView.tsx` + `lib/kakaoLoader.ts`.
  - 카카오 개발자센터에서 JS 키 발급 후 **플랫폼 > Web > 사이트 도메인**에 `http://localhost:3000` 과 배포 도메인을 등록해야 합니다.
- `KAKAO_MAP_API_KEY`(REST 키)는 역지오코딩(주소 변환)용입니다. 미설정 시 데모 주소를 반환합니다.

## 3-1. 관리자(admin) 계정 시드

회원가입 API 는 parent/family 만 허용하므로, 관리자 화면 로그인 테스트는 admin 계정을 직접 시드합니다.

```bash
npm run db:seed-admin 010XXXXXXXX   # 해당 번호를 admin 으로 생성/승격
# 이후 로그인 화면에서 그 번호로 로그인하면 관리자 어드민으로 진입
```

## 4. 로컬 실행

```bash
cd src/frontend
npm install
npm run dev      # http://localhost:3000  (프론트 + /api/* 백엔드)
```

## 5. 배포 리전

`vercel.json` 에서 `icn1`(서울) 리전으로 고정되어 한국 사용자 지연을 최소화합니다. API 함수 최대 실행 시간은 15초입니다.
