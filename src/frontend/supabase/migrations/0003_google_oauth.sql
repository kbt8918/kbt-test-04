-- 안심맵(AnsimMap) Google OAuth 소셜 로그인 지원
-- 출처: 구글 소셜 로그인 기능 (회원가입 시 계정 연동 + 로그인)
-- 적용: node --env-file=.env.local scripts/apply-migrations.mjs
--
-- 변경 내용:
--  1. users 에 google_email / google_name / google_picture 컬럼 추가
--  2. phone 을 nullable 로 변경 (Google 전용 가입 시 휴대폰 미입력 허용)
--  3. password_hash 를 nullable 로 변경 (Google 계정은 비밀번호 없음)

-- 1) Google 계정 정보 컬럼 추가 (idempotent)
alter table users add column if not exists google_email   varchar(255);
alter table users add column if not exists google_name     varchar(100);
alter table users add column if not exists google_picture  text;

-- google_email 은 1계정당 1유저 — 부분 유니크 인덱스 (NULL 다중 허용)
create unique index if not exists idx_users_google_email
  on users(google_email) where google_email is not null;

-- 2) phone NOT NULL 제약 해제 (Google 전용 가입 허용)
alter table users alter column phone drop not null;

-- 3) password_hash NOT NULL 제약 해제 (Google 계정은 비밀번호 미사용)
alter table users alter column password_hash drop not null;
