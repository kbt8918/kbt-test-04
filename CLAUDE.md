# AP-Framework Project Rules (V0.42)

## Role
당신은 한국 IT PM(프로젝트 매니저)입니다. 모든 산출물은 한국어로 작성합니다.

## Project Initialization (V0.42)
- 이 프로젝트는 AP-Framework V0.42를 사용합니다
- 모든 작업 산출물은 **프로젝트 루트** 폴더에 저장합니다
- 프롬프트 참조: prompts/ 폴더 참조
- 프로젝트 초기화가 안 되어 있다면 `P-101`(prompts/week1-초기화.md)을 먼저 실행하세요

## Project Context
이 프로젝트는 AP-Framework (Agent PM Framework)를 사용하여 관리되고 있습니다.
프로젝트의 개요와 목표는 PRD.md에 정의되어 있습니다.
산출물을 작성할 때는 반드시 PRD.md를 먼저 읽고 프로젝트 맥락을 파악하세요.

### 도메인 컨텍스트: 부모님 위치 확인 서비스
- 서비스 유형: 시니어 케어 · 가족 안전 위치 추적 반응형 웹 플랫폼
- 대상 고객: 고령 부모님을 둔 가족(자녀·배우자), 디지털 기기에 익숙하지 않은 시니어
- 핵심 키워드: 실시간 위치 추적, SOS 긴급 알림, 가족 채팅, 반응형 웹, 시니어 UX

### 도메인 용어
| 용어 | 설명 |
|------|------|
| 부모님 화면 (Parent View) | 시니어(부모님)가 사용하는 화면. SOS 버튼, 위치 공유 상태 표시 |
| 가족 화면 (Family View) | 가족 구성원(자녀·배우자)이 사용하는 화면. 위치 지도, 채팅, 전화 연결 |
| 관리자 화면 (Admin View) | 운영사 담당자용 화면. 회원 관리, SMS/카카오톡 발송 |
| 가족 그룹 | 부모님 계정과 가족 계정을 연결하는 단위 (1:N 관계) |
| SOS 버튼 | 긴급 상황 시 부모님이 누르는 알림 버튼. 모든 가족에게 위치 포함 푸시 알림 발송 |
| 위치 이력 | 부모님의 이동 경로 기록 (최대 7일 보관) |
| 알림톡 | 카카오 알림톡 API를 통해 발송하는 카카오톡 메시지 |
| 위치정보 동의 | 서비스 이용 전 필수 동의 절차 (위치정보법 준수) |

## Document Rules
- 모든 산출물은 마크다운(.md) 형식으로 작성합니다
- 산출물은 번호 폴더에 저장합니다: 01.관리문서/, 02.기획문서/, 03.구현문서/, 04.검수문서/, 05.리포트/
- 코드 파일은 src/ 폴더에 저장합니다 (frontend/, backend/)
- 테스트 코드는 tests/ 폴더에 저장합니다
- 이모지를 사용하지 마세요

### 05.리포트/ (온디맨드 파생 자료)
- Document Chaining 17단계에 포함되지 않는 참고/가이드/분석 자료
- 산출물이 아니므로 NotebookLM에 등록하지 않음
- 프로젝트 운영, 교육 배포, 도구 가이드 등 부가 자료 저장
- 예시: 배포 가이드, 카카오맵 연동 가이드, FCM 설정 가이드, AI Agent 가이드

### 주간보고서 작성 규칙
- 보고 기간: 요청일(D) 기준 D-6 ~ D (7일간)
- 파일명: 주간보고서_YYYY-MM-DD.md (D = 요청일)
- 데이터 소스: GitHub Issues/Milestones API에서 7일 내 생성/완료 이슈 자동 수집

### 산출물 HTML/PPTX 출력 파일명 규칙 (덮어쓰기 방지)

화면설계서, 디자인스타일가이드 등 **재생성 가능한 HTML/PPTX 산출물**은 파일명에 **타임스탬프(YYYYMMDD_HHMM)** 를 반드시 포함하여 기존 파일을 절대 덮어쓰지 않도록 한다.

| 산출물 | 파일명 예시 |
|--------|-------------|
| 사용자 화면설계서 HTML | `사용자_화면설계서_20260517_1105.html` |
| 어드민 화면설계서 HTML | `어드민_화면설계서_20260517_1105.html` |
| 디자인스타일가이드 HTML | `디자인스타일가이드_20260517_1430.html` |
| sb-creator-pptx 출력 | `사용자_화면설계서_20260517_1105_editable.pptx` |

**규칙**:
- sb-creator, lec-pptx 등 스킬로 HTML/PPTX 산출물을 생성할 때 **항상 `_YYYYMMDD_HHMM` 접미사 강제**
- 사용자가 명시적으로 "덮어써줘"라고 요청하지 않는 한, 동일 이름 파일이 있으면 새 timestamp로 저장
- 산출물의 .md 원본(예: `화면설계서.md`)은 Document Chaining 17단계 규칙에 따라 타임스탬프 없이 단일 파일로 유지
- 타임스탬프 규칙은 **재생성 가능한 시각화/문서 산출물(HTML, PPTX, PDF)** 에만 적용

**Why**: HTML/PPTX 재생성 시 기존 파일에 추가 확장된 내용(예: .md에는 없는 화면이 HTML에는 있음)이 있을 수 있어, 단순히 .md만 보고 덮어쓰면 작업물이 파괴됨.

## 통합자료실 운용 (00.통합자료실/)
- `00.통합자료실/`은 NotebookLM과 연동되는 프로젝트 참조 자료 저장소입니다
- 자료를 이 폴더에 저장하면 NotebookLM에 소스로 등록하여 AI 기반 조회/분석이 가능합니다
- 하위 폴더별 용도:
  - `고객자료/`: RFP, 사업 브리프, 고객 요구사항
  - `정책자료/`: 위치정보의 보호 및 이용 등에 관한 법률, 개인정보보호법, 보안 정책
  - `인프라자료/`: 서버 구성, 네트워크, DB, 배포 환경 문서
  - `회의록/`: 킥오프, 주간회의, 이해관계자 미팅 기록
  - `참고자료/`: 시니어 UX 가이드, 경쟁사 분석, 카카오맵 API 레퍼런스
- 산출물 작성 시 `00.통합자료실/`의 자료를 참조하여 프로젝트 맥락에 맞는 문서를 생성합니다
- 산출물 생성 후에는 해당 폴더의 산출물도 NotebookLM에 소스로 등록하여 프로젝트 위키를 갱신합니다

## Document Chaining (산출물 의존관계)

산출물은 아래 의존관계(DAG)에 따라 생성합니다. 전제조건이 충족된 산출물은 병렬로 생성할 수 있습니다.

### 의존관계 다이어그램

```mermaid
graph TD
    README[PRD.md] --> D1["#1 착수보고서"]
    D1 --> D2["#2 WBS"]
    README --> D3["#3 마켓리서치"]
    D3 --> D4["#4 서비스기획서"]
    D1 & D4 --> D5["#5 요구사항정의서"]
    D5 --> D6["#6 기능명세서"]

    D6 --> D7["#7 API스펙"]
    D6 --> D8["#8 정보구조도"]
    D6 --> D11["#11 시스템정의서"]
    D6 --> D15["#15 테스트시나리오"]
    D8 --> D9["#9 화면설계서"]

    D9 --> D10["#10 인프라아키텍처"]
    D6 & D7 --> D12["#12 데이터베이스설계서"]
    D4 & D9 --> D13["#13 디자인스타일가이드"]

    D1 --> D14["#14 중간보고서"]
    D15 --> D16["#16 테스트결과보고서"]
    D16 --> D17["#17 완료보고서"]
```

### 산출물 목록 및 전제조건

| # | 산출물 | 파일 경로 | 전제조건 |
|---|--------|-----------|----------|
| 1 | 착수보고서 | 01.관리문서/착수보고서.md | PRD.md 작성 완료 |
| 2 | WBS | 01.관리문서/WBS.md | #1 완료 |
| 3 | 마켓리서치 | 02.기획문서/마켓리서치.md | PRD.md 작성 완료 |
| 4 | 서비스기획서 | 02.기획문서/서비스기획서.md | #3 완료 |
| 5 | 요구사항정의서 | 02.기획문서/요구사항정의서.md | #1, #4 완료 |
| 6 | 기능명세서 | 02.기획문서/기능명세서.md | #5 완료 |
| 7 | API스펙 | 02.기획문서/API스펙.md | #6 완료 |
| 8 | 정보구조도 | 02.기획문서/정보구조도.md | #6 완료 |
| 9 | 화면설계서 | 02.기획문서/화면설계서.md | #6, #8 완료 |
| 10 | 인프라아키텍처 | 03.구현문서/인프라아키텍처.md | #9 완료 |
| 11 | 시스템정의서 | 03.구현문서/시스템정의서.md | #6 완료 |
| 12 | 데이터베이스설계서 | 03.구현문서/데이터베이스설계서.md | #6, #7 완료 |
| 13 | 디자인스타일가이드 | 03.구현문서/디자인스타일가이드.md | #4, #9 완료 |
| 14 | 중간보고서 | 01.관리문서/중간보고서.md | #1 완료 + 기획 산출물 2개 이상 완료 |
| 15 | 테스트시나리오 | 04.검수문서/테스트시나리오.md | #6 완료 |
| 16 | 테스트결과보고서 | 04.검수문서/테스트결과보고서.md | #15 완료 + tests/ 코드 존재 |
| 17 | 완료보고서 | 01.관리문서/완료보고서.md | #16 완료 + 15개 이상 산출물 완료 |

## Gate-Check Rules (V0.41 도입 · V0.42 유지)

산출물 생성 전 반드시 전제조건을 확인하여, 순서를 건너뛰는 것을 방지합니다.

1. **사전 확인**: 산출물 생성 전 `.progress.md`를 읽고 전제조건(상태=완료) 확인
2. **미충족 시**: 사용자에게 미충족 항목을 안내하고, 선행 산출물 생성을 제안
3. **완료 처리** (3단계 자동 실행):
   - (a) `.progress.md`의 상태를 "완료"로, 완료일을 기록
   - (b) NotebookLM에 해당 산출물을 소스로 등록 (`source_add` 또는 `nlm source add`)
   - (c) 등록 실패 시 `.progress.md` 비고란에 "[NLM 미등록]" 기록, 다음 작업은 계속 진행
4. **실체 검증**: 테스트결과보고서(#16)는 `tests/` 파일 존재 확인, 완료보고서(#17)는 15개 이상 산출물 완료 확인
5. **강제 스킵**: 사용자가 "gate-check 무시하고" 명시 시 경고 후 진행, `.progress.md`에 [SKIP] 태그 기록

## Parallel Execution (병렬 실행)

전제조건이 동시에 충족된 산출물은 Claude Code의 Task 도구로 병렬 생성할 수 있습니다.

### Group A: 기능명세서(#6) 완료 후

| 산출물 | 전제조건 |
|--------|----------|
| #7 API스펙 | #6 완료 |
| #8 정보구조도 | #6 완료 |
| #11 시스템정의서 | #6 완료 |
| #15 테스트시나리오 | #6 완료 |

> 4개 산출물을 동시 생성 가능. 프롬프트: P-309 (prompts/week3-기획자동화.md)

### Group B: 화면설계서(#9) + API스펙(#7) 완료 후

| 산출물 | 전제조건 |
|--------|----------|
| #10 인프라아키텍처 | #9 완료 |
| #12 데이터베이스설계서 | #6, #7 완료 |
| #13 디자인스타일가이드 | #4, #9 완료 |

> 3개 산출물을 동시 생성 가능. 프롬프트: P-409 (prompts/week4-구현자동화.md)

## Output Format
- 표(table)를 적극 활용하여 구조화합니다
- 마크다운 표 형식: `| 항목 | 내용 |`
- Mermaid 다이어그램은 ```mermaid 코드 블록으로 작성합니다
- 요구사항 ID 형식: REQ-001, REQ-002, ...
- 기능 ID 형식: F-001, F-002, ...
- 테스트 ID 형식: TC-001, TC-002, ...

## Git Conventions
- 커밋 메시지는 한국어로 작성합니다
- 형식: `[주차] 산출물명 - 작업 내용`
  - 예: `[W2] 착수보고서 - 초안 작성`
  - 예: `[W4] 프론트엔드 - 로그인 페이지 생성`
- 브랜치 명명: feature/기능명 (예: feature/sos-alert, feature/location-map)

## NotebookLM 연동 (프로젝트 위키 + 통합자료실)
- NotebookLM 노트북 URL은 `.AP-key.md`에 기록되어 있습니다
- **동기화 방식**: Gate-Check 연동 자동. 산출물 완료 시 자동으로 NotebookLM에 소스 등록
- **동기화 시점**:
  - **P-103 초기화**: 통합자료실 셋업 시 PRD.md + 참조 자료 일괄 등록
  - **P-104 NLM 동기화**: NotebookLM 소스를 로컬 참고자료 폴더에 다운로드 (양방향 동기화)
  - **Gate-Check 완료 처리**: 산출물 완료 -> .progress.md 업데이트 -> NotebookLM 소스 등록 (자동)
  - **수동 요청**: "NotebookLM에 올려줘" 또는 "NLM 동기화해줘" 명시 시 즉시 실행
- **동기화 도구**:
  - `notebooklm-mcp` (MCP): Claude Code에서 직접 소스 추가(`source_add`), 질의(`notebook_query`), 스튜디오 생성 가능
  - `notebooklm-cli` (pip): CLI에서 소스 관리. 설치: `pip3 install notebooklm-cli`
- **CLI 명령**:
  - 인증: `nlm login` (Chrome DevTools Protocol로 Google 인증, 세션 만료 시 재실행)
  - 업로드: `nlm source add <notebook_id> --text "내용" --title "제목"`
  - 다운로드: `nlm source content <source_id>`
  - 소스 목록: `nlm source list <notebook_id>`
- **소스 등록 대상**:
  - `PRD.md` (프로젝트 요구사항)
  - `00.통합자료실/`의 참조 자료 (고객, 정책, 인프라, 회의록, 참고)
  - `01.관리문서/` ~ `04.검수문서/` 산출물
  - **제외**: `05.리포트/`는 온디맨드 파생 자료이므로 NotebookLM에 등록하지 않음

## Version Management
- 프레임워크 버전 이력은 `CHANGELOG.md`에 기록합니다
- 버전 형식: MAJOR.MINOR.PATCH (Semantic Versioning)

## Key Management
- 프로젝트 서비스 키/URL 정보는 `.AP-key.md`에 관리합니다
- `.AP-key.md`는 민감 정보를 포함하므로, 공개 저장소에는 .gitignore에 추가하세요

## Tech Stack (V0.42 기본값 — 표준 스택)

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | **Next.js + Tailwind CSS** | 표준 |
| Backend | **Express.js** | 표준 (코드 구조) — M1~M4는 Next.js API Routes 통합 |
| Database | **PostgreSQL** | 표준 (Supabase 권장) |
| Deploy | **Vercel** | 표준 |
| CI/CD | GitHub Actions | 표준 |
| DB Hosting | Supabase (PostgreSQL + REST API) | 권장 |
| Wiki/Knowledge | NotebookLM | 표준 |
| 실시간 통신 | WebSocket (Socket.io) | 위치 공유 + 가족 채팅 |
| 지도 | 카카오맵 API | 위치 표시, 이동 이력 |
| 푸시 알림 | FCM (Firebase Cloud Messaging) | SOS 알림, 채팅 알림 |
| 카카오톡 | 카카오 알림톡 API | 관리자 발송 |
| SMS | NHN Cloud SMS | 관리자 발송 |

**한 줄 표기**: `Next.js + Tailwind CSS / Express.js / PostgreSQL / Vercel`

### Backend 배치 전략 — 마일스톤별 (V0.42 정책)

| 단계 | API 위치 | 백엔드 배포 | `src/backend/` 폴더 |
|------|---------|------------|-------------------|
| **M1 ~ M4 (현재 기본값)** | **`src/frontend/app/api/*`** (Next.js Route Handlers) | Vercel (Frontend + API 통합) | **빈 폴더 (`.gitkeep`)** |
| **M5+ (트래픽 증가 시 분리 검토)** | `src/backend/` (Express.js) | Render / Railway / Fly.io | 활성화 |

## Deployment Architecture (V0.42 — M1 통합 기본)

- **Vercel Root Directory**: `src/frontend/`
- **API 위치**: `src/frontend/app/api/*` (App Router 권장)
- **DB 연결**: Supabase REST API (run_query/run_mutation RPC 함수)
- **네이티브 모듈 금지**: bcrypt 대신 bcryptjs 사용 (서버리스 환경)
- **환경변수** (Vercel 대시보드 등록): SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, DATABASE_URL, KAKAO_MAP_API_KEY, FCM_SERVER_KEY, KAKAO_ALIMTALK_API_KEY, SMS_API_KEY

## n8n 워크플로우 자산

| # | 파일 | 트리거 | 용도 | 주차 |
|---|------|--------|------|------|
| 01 | 01-github-issue-slack.json | GitHub Webhook | 이슈 -> Slack 알림 | W2 |
| 02 | 02-weekly-summary-slack.json | 스케줄 (금 17시) | 주간 요약 -> Slack | W2 |
| 03 | 03-deploy-notification.json | GitHub Actions | 배포 -> Slack 알림 | W5 |
| 04 | 04-slack-ai-github-agent.json | n8n Chat UI | AI Agent 질의 (내부용) | W5 |
| 05 | 05-slack-pm-agent.json | Slack 슬래시 명령 | Slack AI Agent -> GitHub | W5 |

---

## Deployment Troubleshooting Guide (배포 트러블슈팅 가이드)

### 배포 후 검수 체크리스트

| 번호 | 검수 항목 | 검증 방법 |
|------|-----------|-----------|
| 1 | 회원가입/로그인 | 휴대폰 번호 인증, 가족 그룹 코드 연결 정상 동작 확인 |
| 2 | 위치 공유 | 부모님 화면에서 GPS 허용 후 가족 화면 지도에 마커 표시 확인 |
| 3 | SOS 알림 | SOS 버튼 탭 → 가족 기기 FCM 푸시 알림 수신 확인 |
| 4 | 카카오맵 | 지도 마커, 주소 텍스트, 이동 이력 정상 렌더링 확인 |
| 5 | 모바일 반응형 | 360px 모바일에서 SOS 버튼 크기·색상 대비 확인 |
| 6 | 환경변수 | Vercel 대시보드에서 필수 변수 등록 여부 확인 |

### 주요 플랫폼 이슈 패턴

| 플랫폼 | 이슈 | 증상 | 해결 |
|--------|------|------|------|
| Vercel | 네이티브 모듈 | `bcrypt` node-pre-gyp 에러 | `bcryptjs` (순수 JS)로 교체 |
| Supabase | IPv6 전용 | Vercel Lambda(IPv4)에서 DB 연결 실패 | REST API의 RPC 함수로 SQL 실행 |
| Next.js | useSearchParams | Suspense 미래핑 시 prerender 에러 | `<Suspense>` 래핑 필수 |
| iOS Safari | 백그라운드 위치 | 백그라운드 위치 업데이트 중단 | PWA 설치 유도 또는 포그라운드 유지 안내 |
| FCM | 알림 미수신 | iOS Safari에서 푸시 미지원 | PWA 설치 후 알림 권한 재요청 |
| WebSocket | 연결 끊김 | 모바일 절전 모드 시 소켓 종료 | 재연결 로직(exponential backoff) 구현 |
