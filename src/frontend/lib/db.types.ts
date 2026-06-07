// Supabase 데이터베이스 타입 — 데이터베이스설계서.md (DOC-12 v1.0) 기준 수기 정의
// 스키마 변경 시 supabase/migrations 와 함께 갱신할 것.

export type UserRole = "parent" | "family" | "admin";
export type MemberRole = "owner" | "member";
export type ConsentAction = "grant" | "revoke";
export type GeofenceEventType = "exit" | "enter";
export type MessageChannel = "sms" | "lms";
export type SendStatus = "success" | "fail" | "partial";

// 교차(intersection) 타입을 평탄한 객체 타입으로 정규화 — postgrest-js GenericTable 제약 충족용
type Flatten<T> = { [K in keyof T]: T[K] };

// 공통 헬퍼: Row(조회), Insert(삽입), Update(갱신) 타입을 한 번에 정의
// Relationships 는 postgrest-js 제네릭이 요구하는 필드(외래키 관계). 수기 정의에서는 빈 배열로 둔다.
type TableShape<Row, Insert, Update> = {
  Row: Flatten<Row>;
  Insert: Flatten<Insert>;
  Update: Flatten<Update>;
  Relationships: [];
};

export interface UsersRow {
  id: string;
  phone: string | null;
  password_hash: string | null;
  name: string | null;
  role: UserRole;
  location_sharing: boolean;
  location_consent_at: string | null;
  privacy_agreed_at: string | null;
  terms_agreed_at: string | null;
  location_interval: number;
  last_seen_at: string | null;
  google_email: string | null;
  google_name: string | null;
  google_picture: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GroupsRow {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  plan: string;
  max_members: number;
  last_active_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface GroupMembersRow {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface LocationsRow {
  id: string;
  user_id: string;
  group_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  measured_at: string;
  created_at: string;
}

export interface LocationConsentsRow {
  id: string;
  user_id: string;
  action: ConsentAction;
  location_consent_required: boolean;
  marketing_consent: boolean;
  consent_version: string;
  ip_address: string | null;
  created_at: string;
}

export interface DeviceTokensRow {
  id: string;
  user_id: string;
  fcm_token: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface SosEventsRow {
  id: string;
  group_id: string;
  sender_id: string;
  latitude: number | null;
  longitude: number | null;
  notified_count: number;
  failed_count: number;
  sent_at: string;
}

export interface MessagesRow {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}

export interface GeofencesRow {
  id: string;
  group_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GeofenceEventsRow {
  id: string;
  geofence_id: string;
  user_id: string;
  event_type: GeofenceEventType;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface SmsLogsRow {
  id: string;
  admin_id: string;
  channel: MessageChannel;
  content: string;
  recipients: unknown;
  total_count: number;
  success_count: number;
  fail_count: number;
  status: SendStatus;
  sent_at: string;
}

export interface AlimtalkLogsRow {
  id: string;
  admin_id: string;
  template_code: string;
  variables: unknown | null;
  recipient_count: number;
  success_count: number;
  fail_count: number;
  status: SendStatus;
  sent_at: string;
}

// PK·기본값이 있는 컬럼은 Insert 시 선택값
type WithDefaults<Row, Optional extends keyof Row> = Omit<Row, Optional> &
  Partial<Pick<Row, Optional>>;

export interface Database {
  public: {
    Tables: {
      users: TableShape<
        UsersRow,
        WithDefaults<
          UsersRow,
          | "id"
          | "phone"
          | "password_hash"
          | "name"
          | "location_sharing"
          | "location_consent_at"
          | "privacy_agreed_at"
          | "terms_agreed_at"
          | "location_interval"
          | "last_seen_at"
          | "google_email"
          | "google_name"
          | "google_picture"
          | "created_at"
          | "updated_at"
          | "deleted_at"
        >,
        Partial<UsersRow>
      >;
      groups: TableShape<
        GroupsRow,
        WithDefaults<
          GroupsRow,
          "id" | "plan" | "max_members" | "last_active_at" | "created_at" | "deleted_at"
        >,
        Partial<GroupsRow>
      >;
      group_members: TableShape<
        GroupMembersRow,
        WithDefaults<GroupMembersRow, "id" | "role" | "joined_at">,
        Partial<GroupMembersRow>
      >;
      locations: TableShape<
        LocationsRow,
        WithDefaults<LocationsRow, "id" | "created_at">,
        Partial<LocationsRow>
      >;
      location_consents: TableShape<
        LocationConsentsRow,
        WithDefaults<LocationConsentsRow, "id" | "marketing_consent" | "ip_address" | "created_at">,
        Partial<LocationConsentsRow>
      >;
      device_tokens: TableShape<
        DeviceTokensRow,
        WithDefaults<DeviceTokensRow, "id" | "platform" | "created_at" | "updated_at">,
        Partial<DeviceTokensRow>
      >;
      sos_events: TableShape<
        SosEventsRow,
        WithDefaults<
          SosEventsRow,
          "id" | "latitude" | "longitude" | "notified_count" | "failed_count" | "sent_at"
        >,
        Partial<SosEventsRow>
      >;
      messages: TableShape<
        MessagesRow,
        WithDefaults<MessagesRow, "id" | "sent_at">,
        Partial<MessagesRow>
      >;
      geofences: TableShape<
        GeofencesRow,
        WithDefaults<GeofencesRow, "id" | "created_at" | "updated_at" | "deleted_at">,
        Partial<GeofencesRow>
      >;
      geofence_events: TableShape<
        GeofenceEventsRow,
        WithDefaults<GeofenceEventsRow, "id" | "latitude" | "longitude" | "created_at">,
        Partial<GeofenceEventsRow>
      >;
      sms_logs: TableShape<
        SmsLogsRow,
        WithDefaults<
          SmsLogsRow,
          "id" | "total_count" | "success_count" | "fail_count" | "sent_at"
        >,
        Partial<SmsLogsRow>
      >;
      alimtalk_logs: TableShape<
        AlimtalkLogsRow,
        WithDefaults<
          AlimtalkLogsRow,
          | "id"
          | "variables"
          | "recipient_count"
          | "success_count"
          | "fail_count"
          | "sent_at"
        >,
        Partial<AlimtalkLogsRow>
      >;
    };
    // postgrest-js GenericSchema 제약 충족용 (수기 스키마이므로 비어 있음)
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      member_role: MemberRole;
      consent_action: ConsentAction;
      geofence_event_type: GeofenceEventType;
      message_channel: MessageChannel;
      send_status: SendStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
