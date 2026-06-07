-- 위치 이력 7일 만료 배치 + Row Level Security
-- 출처: 03.구현문서/데이터베이스설계서.md (DOC-12 v1.0) 7장·8장
-- 비고: 본 서비스는 Vercel Route Handler 에서 service_role 키로 권한을 검증하므로,
--       RLS 는 publishable(anon) 키 직접 접근을 차단하는 안전망 역할이다.

-- =========================================================
-- 7장: 위치 이력 7일 만료 배치 (pg_cron)
-- =========================================================
create extension if not exists pg_cron;

-- 중복 등록 방지 후 재등록
select cron.unschedule('purge-old-locations')
  where exists (select 1 from cron.job where jobname = 'purge-old-locations');

select cron.schedule(
    'purge-old-locations',
    '0 3 * * *',
    $$ delete from locations where measured_at < now() - interval '7 days'; $$
);

-- =========================================================
-- 8장: Row Level Security
-- =========================================================
alter table users             enable row level security;
alter table groups            enable row level security;
alter table group_members     enable row level security;
alter table locations         enable row level security;
alter table location_consents enable row level security;
alter table device_tokens     enable row level security;
alter table sos_events        enable row level security;
alter table messages          enable row level security;
alter table geofences         enable row level security;
alter table geofence_events   enable row level security;
alter table sms_logs          enable row level security;
alter table alimtalk_logs     enable row level security;

-- service_role(백엔드)은 RLS 를 우회하므로 별도 정책이 필요 없다.
-- publishable 키로 직접 접근하는 경우를 대비해 그룹 단위 격리 정책만 정의한다.
-- (Supabase Auth 의 auth.uid() 를 사용하는 구성으로 확장할 때 활성화)

-- 그룹 구성원만 위치 조회
drop policy if exists locations_group_select on locations;
create policy locations_group_select on locations
    for select using (
        group_id in (select group_id from group_members where user_id = auth.uid())
    );

-- 그룹 구성원만 채팅 조회·작성
drop policy if exists messages_group_select on messages;
create policy messages_group_select on messages
    for select using (
        group_id in (select group_id from group_members where user_id = auth.uid())
    );
drop policy if exists messages_group_insert on messages;
create policy messages_group_insert on messages
    for insert with check (
        group_id in (select group_id from group_members where user_id = auth.uid())
    );

-- 그룹 구성원만 SOS 이력 조회
drop policy if exists sos_group_select on sos_events;
create policy sos_group_select on sos_events
    for select using (
        group_id in (select group_id from group_members where user_id = auth.uid())
    );

-- 그룹 구성원만 안전 구역 조회·수정
drop policy if exists geofences_group_all on geofences;
create policy geofences_group_all on geofences
    for all using (
        group_id in (select group_id from group_members where user_id = auth.uid())
    );

-- 관리자만 발송 로그 접근
drop policy if exists sms_logs_admin_only on sms_logs;
create policy sms_logs_admin_only on sms_logs
    for all using (
        (select role from users where id = auth.uid()) = 'admin'
    );
drop policy if exists alimtalk_logs_admin_only on alimtalk_logs;
create policy alimtalk_logs_admin_only on alimtalk_logs
    for all using (
        (select role from users where id = auth.uid()) = 'admin'
    );
