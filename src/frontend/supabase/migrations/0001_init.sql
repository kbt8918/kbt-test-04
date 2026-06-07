-- 안심맵(AnsimMap) 초기 스키마
-- 출처: 03.구현문서/데이터베이스설계서.md (DOC-12 v1.0)
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣어 실행하거나 supabase CLI(db push) 사용
-- 비고: users 에 password_hash/name 추가 (bcryptjs 기반 휴대폰+비밀번호 로그인, lib/jwt.ts)

-- =========================================================
-- ENUM 타입
-- =========================================================
do $$ begin
  create type user_role AS ENUM ('parent', 'family', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type member_role AS ENUM ('owner', 'member');
exception when duplicate_object then null; end $$;
do $$ begin
  create type consent_action AS ENUM ('grant', 'revoke');
exception when duplicate_object then null; end $$;
do $$ begin
  create type geofence_event_type AS ENUM ('exit', 'enter');
exception when duplicate_object then null; end $$;
do $$ begin
  create type message_channel AS ENUM ('sms', 'lms');
exception when duplicate_object then null; end $$;
do $$ begin
  create type send_status AS ENUM ('success', 'fail', 'partial');
exception when duplicate_object then null; end $$;

-- =========================================================
-- users (회원)
-- =========================================================
create table if not exists users (
    id                  uuid primary key default gen_random_uuid(),
    phone               varchar(11) unique not null,
    password_hash       text not null,
    name                varchar(30),
    role                user_role not null,
    location_sharing    boolean not null default false,
    location_consent_at timestamptz,
    privacy_agreed_at   timestamptz,
    terms_agreed_at     timestamptz,
    location_interval   smallint not null default 30 check (location_interval in (30, 180)),
    last_seen_at        timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    deleted_at          timestamptz
);
create index if not exists idx_users_role on users(role);

-- =========================================================
-- groups (가족 그룹)
-- =========================================================
create table if not exists groups (
    id              uuid primary key default gen_random_uuid(),
    name            varchar(20) not null,
    invite_code     char(6) unique not null,
    created_by      uuid not null references users(id) on delete restrict,
    plan            varchar(10) not null default 'free',
    max_members     smallint not null default 5,
    last_active_at  timestamptz,
    created_at      timestamptz not null default now(),
    deleted_at      timestamptz
);
create index if not exists idx_groups_created_by on groups(created_by);

-- =========================================================
-- group_members (그룹 구성원)
-- =========================================================
create table if not exists group_members (
    id          uuid primary key default gen_random_uuid(),
    group_id    uuid not null references groups(id) on delete cascade,
    user_id     uuid not null references users(id) on delete cascade,
    role        member_role not null default 'member',
    joined_at   timestamptz not null default now(),
    unique (group_id, user_id)
);
create index if not exists idx_gm_user_id on group_members(user_id);

-- =========================================================
-- locations (위치 이력)
-- =========================================================
create table if not exists locations (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references users(id) on delete cascade,
    group_id    uuid not null references groups(id) on delete cascade,
    latitude    numeric(10,7) not null,
    longitude   numeric(10,7) not null,
    accuracy    real not null check (accuracy <= 100),
    measured_at timestamptz not null,
    created_at  timestamptz not null default now()
);
create index if not exists idx_loc_group_measured on locations(group_id, measured_at desc);
create index if not exists idx_loc_measured_at on locations(measured_at);

-- =========================================================
-- location_consents (위치정보 동의 이력)
-- =========================================================
create table if not exists location_consents (
    id                        uuid primary key default gen_random_uuid(),
    user_id                   uuid not null references users(id) on delete cascade,
    action                    consent_action not null,
    location_consent_required boolean not null,
    marketing_consent         boolean not null default false,
    consent_version           varchar(10) not null,
    ip_address                inet,
    created_at                timestamptz not null default now()
);
create index if not exists idx_consent_user on location_consents(user_id, created_at desc);

-- =========================================================
-- device_tokens (FCM 디바이스 토큰)
-- =========================================================
create table if not exists device_tokens (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references users(id) on delete cascade,
    fcm_token   text unique not null,
    platform    varchar(10) not null default 'web',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create index if not exists idx_token_user on device_tokens(user_id);

-- =========================================================
-- sos_events (SOS 발송 이력)
-- =========================================================
create table if not exists sos_events (
    id              uuid primary key default gen_random_uuid(),
    group_id        uuid not null references groups(id) on delete cascade,
    sender_id       uuid not null references users(id) on delete cascade,
    latitude        numeric(10,7),
    longitude       numeric(10,7),
    notified_count  smallint not null default 0,
    failed_count    smallint not null default 0,
    sent_at         timestamptz not null default now()
);
create index if not exists idx_sos_group_sent on sos_events(group_id, sent_at desc);

-- =========================================================
-- messages (채팅 메시지)
-- =========================================================
create table if not exists messages (
    id          uuid primary key default gen_random_uuid(),
    group_id    uuid not null references groups(id) on delete cascade,
    sender_id   uuid not null references users(id) on delete cascade,
    content     varchar(500) not null,
    sent_at     timestamptz not null default now()
);
create index if not exists idx_msg_group_sent on messages(group_id, sent_at desc);

-- =========================================================
-- geofences (안전 구역)
-- =========================================================
create table if not exists geofences (
    id          uuid primary key default gen_random_uuid(),
    group_id    uuid not null references groups(id) on delete cascade,
    name        varchar(20) not null,
    latitude    numeric(10,7) not null,
    longitude   numeric(10,7) not null,
    radius      integer not null check (radius between 100 and 5000),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    deleted_at  timestamptz
);
create index if not exists idx_geo_group on geofences(group_id);

-- =========================================================
-- geofence_events (안전 구역 이탈/복귀 이력)
-- =========================================================
create table if not exists geofence_events (
    id          uuid primary key default gen_random_uuid(),
    geofence_id uuid not null references geofences(id) on delete cascade,
    user_id     uuid not null references users(id) on delete cascade,
    event_type  geofence_event_type not null,
    latitude    numeric(10,7),
    longitude   numeric(10,7),
    created_at  timestamptz not null default now()
);
create index if not exists idx_geoevt_geofence on geofence_events(geofence_id, created_at desc);

-- =========================================================
-- sms_logs (SMS 발송 이력)
-- =========================================================
create table if not exists sms_logs (
    id              uuid primary key default gen_random_uuid(),
    admin_id        uuid not null references users(id) on delete restrict,
    channel         message_channel not null,
    content         text not null,
    recipients      jsonb not null,
    total_count     smallint not null default 0,
    success_count   smallint not null default 0,
    fail_count      smallint not null default 0,
    status          send_status not null,
    sent_at         timestamptz not null default now()
);
create index if not exists idx_sms_sent on sms_logs(sent_at desc);

-- =========================================================
-- alimtalk_logs (카카오 알림톡 발송 이력)
-- =========================================================
create table if not exists alimtalk_logs (
    id              uuid primary key default gen_random_uuid(),
    admin_id        uuid not null references users(id) on delete restrict,
    template_code   varchar(50) not null,
    variables       jsonb,
    recipient_count smallint not null default 0,
    success_count   smallint not null default 0,
    fail_count      smallint not null default 0,
    status          send_status not null,
    sent_at         timestamptz not null default now()
);
create index if not exists idx_alimtalk_sent on alimtalk_logs(sent_at desc);
