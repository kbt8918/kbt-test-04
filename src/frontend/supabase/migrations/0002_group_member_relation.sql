-- 0002 group_members.relation (호칭/관계) 추가
-- 출처: 05.리포트/부모-가족-매핑-설계.md
-- 목적: 가족이 그룹 내에서 부모님 멤버의 호칭(어머니/아버지 등)을 지정할 수 있도록 한다.
-- 비고: NULL 허용이므로 기존 데이터와 하위 호환. 부모 식별은 users.role='parent' 로 유지.

alter table group_members
    add column if not exists relation varchar(20);

comment on column group_members.relation is '그룹 내 호칭/관계 라벨 (예: 어머니, 아버지). 가족이 지정. NULL=미지정';
