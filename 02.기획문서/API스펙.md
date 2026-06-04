# API 스펙

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 부모님 위치 확인 서비스 (안심맵, AnsimMap) |
| 문서 번호 | DOC-07 |
| 문서 버전 | v1.0 |
| 작성일 | 2026-05-31 |
| 최종 수정일 | 2026-05-31 |
| 작성자 | PM |
| 참조 문서 | 기능명세서.md (v1.0) |

---

## API 공통 사항

| 항목 | 내용 |
|------|------|
| Base URL (개발) | `http://localhost:3000/api` |
| Base URL (운영) | `https://ansimmap.vercel.app/api` |
| API 위치 | Next.js App Router Route Handlers (`src/frontend/app/api/*`) |
| 인증 방식 | JWT — httpOnly 쿠키 (`access_token`) 자동 전송 |
| 응답 형식 | JSON |
| 문자 인코딩 | UTF-8 |
| 날짜 형식 | ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) |

### 공통 응답 구조

**성공**
```json
{
  "status": "success",
  "data": {}
}
```

**실패**
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "사람이 읽을 수 있는 오류 메시지"
}
```

### 공통 에러 코드

| HTTP 상태 코드 | 에러 코드 | 설명 |
|----------------|-----------|------|
| 400 | `BAD_REQUEST` | 요청 파라미터 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 토큰 없음 또는 만료 |
| 403 | `FORBIDDEN` | 권한 없음 (역할 불일치) |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복 데이터 충돌 |
| 422 | `UNPROCESSABLE` | 비즈니스 규칙 위반 |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |

---

## API 엔드포인트 목록

| API-ID | Method | URL | 기능명 | 관련 기능 ID |
|--------|--------|-----|--------|-------------|
| API-001 | POST | `/api/auth/register` | 회원가입 | F-001 |
| API-002 | POST | `/api/auth/login` | 로그인 | F-002 |
| API-003 | POST | `/api/auth/logout` | 로그아웃 | F-002 |
| API-004 | GET | `/api/auth/me` | 내 정보 조회 | F-002 |
| API-005 | POST | `/api/groups` | 가족 그룹 생성 | F-003 |
| API-006 | POST | `/api/groups/join` | 가족 그룹 참여 | F-004 |
| API-007 | GET | `/api/groups/:id` | 그룹 정보 조회 | F-004 |
| API-008 | POST | `/api/location/consent` | 위치정보 동의 저장 | F-006 |
| API-009 | DELETE | `/api/location/consent` | 위치정보 동의 철회 | F-008 |
| API-010 | POST | `/api/location` | 위치 데이터 전송 | F-009 |
| API-011 | PATCH | `/api/users/me/location-sharing` | 위치 공유 ON/OFF | F-010 |
| API-012 | GET | `/api/location/current/:groupId` | 현재 위치 조회 | F-011 |
| API-013 | GET | `/api/location/history` | 위치 이력 조회 | F-012 |
| API-014 | GET | `/api/location/address` | 역지오코딩 | F-013 |
| API-015 | POST | `/api/sos` | SOS 알림 발송 | F-016 |
| API-016 | GET | `/api/sos/history` | SOS 수신 이력 조회 | F-017 |
| API-017 | GET | `/api/chat/:groupId/messages` | 채팅 메시지 조회 | F-018 |
| API-018 | POST | `/api/chat/:groupId/messages` | 채팅 메시지 전송 | F-018, F-019 |
| API-019 | POST | `/api/geofence` | 안전 구역 생성 | F-020 |
| API-020 | PUT | `/api/geofence/:id` | 안전 구역 수정 | F-020 |
| API-021 | DELETE | `/api/geofence/:id` | 안전 구역 삭제 | F-020 |
| API-022 | GET | `/api/geofence/:groupId` | 안전 구역 목록 조회 | F-021 |
| API-023 | GET | `/api/admin/groups` | 관리자 그룹 목록 조회 | F-022 |
| API-024 | GET | `/api/admin/groups/:id` | 관리자 그룹 상세 조회 | F-023 |
| API-025 | POST | `/api/admin/sms` | SMS 발송 | F-024 |
| API-026 | POST | `/api/admin/alimtalk` | 카카오 알림톡 발송 | F-025 |
| API-027 | GET | `/api/admin/alimtalk/history` | 알림톡 발송 이력 조회 | F-025 |
| API-028 | GET | `/api/admin/stats` | 통계 조회 | F-026 |
| API-029 | PATCH | `/api/users/me/settings` | 사용자 설정 저장 | F-027 |
| WS-001 | WebSocket | `/ws` | 실시간 위치·채팅 | F-009, F-011, F-018 |

---

## API 상세

---

### API-001. 회원가입

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/auth/register` |
| 인증 | 불필요 |
| 설명 | 휴대폰 번호와 역할(parent/family)로 회원가입. 성공 시 JWT를 httpOnly 쿠키로 설정한다. |
| 관련 기능 | F-001, F-007 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `phone` | string | Y | 휴대폰 번호 (숫자 11자리, 예: `01012345678`) |
| `role` | string | Y | 역할 (`parent` 또는 `family`) |
| `termsAgreed` | boolean | Y | 서비스 이용약관 동의 여부 (`true` 필수) |
| `privacyAgreed` | boolean | Y | 개인정보처리방침 동의 여부 (`true` 필수) |

```json
{
  "phone": "01012345678",
  "role": "parent",
  "termsAgreed": true,
  "privacyAgreed": true
}
```

**Response (201 Created)**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid-xxxx",
    "phone": "01012345678",
    "role": "parent",
    "createdAt": "2026-05-31T10:00:00Z"
  }
}
```

Set-Cookie 헤더: `access_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | phone 형식 오류 (11자리 숫자 아님) |
| 400 | `BAD_REQUEST` | role이 `parent` 또는 `family` 아님 |
| 400 | `BAD_REQUEST` | termsAgreed 또는 privacyAgreed가 false |
| 409 | `CONFLICT` | 이미 가입된 휴대폰 번호 |

---

### API-002. 로그인

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/auth/login` |
| 인증 | 불필요 |
| 설명 | 등록된 휴대폰 번호로 로그인하고 JWT 쿠키를 갱신한다. |
| 관련 기능 | F-002 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `phone` | string | Y | 휴대폰 번호 (숫자 11자리) |

```json
{
  "phone": "01012345678"
}
```

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid-xxxx",
    "phone": "01012345678",
    "role": "parent",
    "locationSharing": true,
    "groupId": "uuid-yyyy"
  }
}
```

Set-Cookie 헤더: `access_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | phone 형식 오류 |
| 404 | `NOT_FOUND` | 등록되지 않은 번호 |

---

### API-003. 로그아웃

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/auth/logout` |
| 인증 | 필요 (JWT 쿠키) |
| 설명 | JWT 쿠키를 만료 처리하여 세션을 종료한다. |
| 관련 기능 | F-002 |

**Request Body** — 없음

**Response (200 OK)**

```json
{
  "status": "success",
  "data": null
}
```

Set-Cookie 헤더: `access_token=; HttpOnly; Secure; Max-Age=0`

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 유효한 토큰 없음 |

---

### API-004. 내 정보 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/auth/me` |
| 인증 | 필요 (JWT 쿠키) |
| 설명 | 현재 로그인한 사용자의 프로필과 그룹 소속 정보를 반환한다. |
| 관련 기능 | F-002 |

**Request** — 없음 (쿠키 자동 전송)

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid-xxxx",
    "phone": "01012345678",
    "role": "parent",
    "locationSharing": true,
    "locationConsentAt": "2026-05-31T10:00:00Z",
    "locationInterval": 30,
    "groupId": "uuid-yyyy",
    "groupName": "우리 가족",
    "createdAt": "2026-05-31T10:00:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 토큰 없음 또는 만료 |

---

### API-005. 가족 그룹 생성

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/groups` |
| 인증 | 필요 (JWT 쿠키, role: `family`) |
| 설명 | 가족 그룹을 생성하고 6자리 초대 코드와 QR 코드 URL을 반환한다. |
| 관련 기능 | F-003 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupName` | string | Y | 그룹명 (1~20자) |

```json
{
  "groupName": "우리 가족"
}
```

**Response (201 Created)**

```json
{
  "status": "success",
  "data": {
    "groupId": "uuid-yyyy",
    "groupName": "우리 가족",
    "inviteCode": "AB12CD",
    "qrCodeUrl": "https://ansimmap.vercel.app/join?code=AB12CD",
    "memberCount": 1,
    "createdAt": "2026-05-31T10:00:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | groupName 미입력 또는 20자 초과 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 500 | `INTERNAL_ERROR` | 초대 코드 생성 3회 충돌 |

---

### API-006. 가족 그룹 참여

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/groups/join` |
| 인증 | 필요 (JWT 쿠키) |
| 설명 | 6자리 초대 코드로 가족 그룹에 참여한다. Free 플랜 기준 최대 5명 제한. |
| 관련 기능 | F-004 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `inviteCode` | string | Y | 초대 코드 (6자리 영숫자) |

```json
{
  "inviteCode": "AB12CD"
}
```

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "groupId": "uuid-yyyy",
    "groupName": "우리 가족",
    "memberCount": 3,
    "role": "member"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | inviteCode 형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 404 | `NOT_FOUND` | 유효하지 않은 초대 코드 |
| 409 | `CONFLICT` | 이미 참여 중인 그룹 |
| 422 | `UNPROCESSABLE` | 그룹 정원 초과 (5명) |

---

### API-007. 그룹 정보 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/groups/:id` |
| 인증 | 필요 (JWT 쿠키, 해당 그룹 구성원) |
| 설명 | 특정 가족 그룹의 기본 정보와 구성원 목록을 반환한다. |
| 관련 기능 | F-004 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | string | Y | 그룹 UUID |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "groupId": "uuid-yyyy",
    "groupName": "우리 가족",
    "inviteCode": "AB12CD",
    "memberCount": 3,
    "members": [
      {
        "userId": "uuid-xxxx",
        "role": "parent",
        "locationSharing": true,
        "lastSeenAt": "2026-05-31T10:00:00Z"
      }
    ],
    "createdAt": "2026-05-31T09:00:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |
| 404 | `NOT_FOUND` | 존재하지 않는 그룹 |

---

### API-008. 위치정보 동의 저장

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/location/consent` |
| 인증 | 필요 (JWT 쿠키, role: `parent`) |
| 설명 | 위치정보법 제15조에 따라 부모님의 위치정보 수집 동의를 저장한다. |
| 관련 기능 | F-006 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `locationConsentRequired` | boolean | Y | 위치정보 수집·이용 필수 동의 (`true` 필수) |
| `marketingConsent` | boolean | N | 마케팅 활용 선택 동의 |
| `consentVersion` | string | Y | 동의 약관 버전 (예: `v1.0`) |

```json
{
  "locationConsentRequired": true,
  "marketingConsent": false,
  "consentVersion": "v1.0"
}
```

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "consentId": "uuid-zzzz",
    "locationConsentAt": "2026-05-31T10:00:00Z",
    "marketingConsent": false,
    "consentVersion": "v1.0"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | locationConsentRequired가 false |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 parent 아님 |

---

### API-009. 위치정보 동의 철회

| 항목 | 내용 |
|------|------|
| Method | DELETE |
| URL | `/api/location/consent` |
| 인증 | 필요 (JWT 쿠키, role: `parent`) |
| 설명 | 부모님이 위치정보 제공 동의를 철회한다. 즉시 위치 수집을 중단하고 가족에게 FCM 알림을 발송한다. |
| 관련 기능 | F-008 |

**Request Body** — 없음

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "revokedAt": "2026-05-31T11:00:00Z",
    "notifiedMembers": 2
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 parent 아님 |
| 404 | `NOT_FOUND` | 동의 이력 없음 |

---

### API-010. 위치 데이터 전송

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/location` |
| 인증 | 필요 (JWT 쿠키, role: `parent`) |
| 설명 | 부모님 단말기의 GPS 좌표를 서버에 저장하고 WebSocket으로 그룹 전체에 실시간 전파한다. |
| 관련 기능 | F-009 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `latitude` | number | Y | 위도 (소수점 7자리, 예: 37.5665350) |
| `longitude` | number | Y | 경도 (소수점 7자리, 예: 126.9780020) |
| `accuracy` | number | Y | 정확도 (미터 단위) |
| `timestamp` | string | Y | 측정 시각 (ISO 8601) |

```json
{
  "latitude": 37.5665350,
  "longitude": 126.9780020,
  "accuracy": 15.0,
  "timestamp": "2026-05-31T10:30:00Z"
}
```

**Response (201 Created)**

```json
{
  "status": "success",
  "data": {
    "locationId": "uuid-aaaa",
    "savedAt": "2026-05-31T10:30:01Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | 위도·경도 범위 오류 또는 필드 누락 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 parent 아님 또는 위치정보 미동의 |
| 422 | `UNPROCESSABLE` | accuracy > 100m (GPS 신호 불량, 저장 제외) |

---

### API-011. 위치 공유 ON/OFF

| 항목 | 내용 |
|------|------|
| Method | PATCH |
| URL | `/api/users/me/location-sharing` |
| 인증 | 필요 (JWT 쿠키, role: `parent`) |
| 설명 | 부모님이 위치 공유 상태를 토글한다. 변경 시 가족 전원에게 FCM 알림을 발송한다. |
| 관련 기능 | F-010 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `locationSharing` | boolean | Y | `true` = ON, `false` = OFF |

```json
{
  "locationSharing": false
}
```

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "locationSharing": false,
    "updatedAt": "2026-05-31T10:35:00Z",
    "notifiedMembers": 2
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | locationSharing 필드 누락 또는 타입 오류 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 parent 아님 |
| 422 | `UNPROCESSABLE` | 위치정보 동의가 철회된 상태에서 ON 시도 |

---

### API-012. 현재 위치 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/location/current/:groupId` |
| 인증 | 필요 (JWT 쿠키, 해당 그룹 구성원) |
| 설명 | 그룹 내 부모님의 가장 최근 위치 데이터를 반환한다. 초기 지도 렌더링 시 사용한다. |
| 관련 기능 | F-011 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupId` | string | Y | 그룹 UUID |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid-xxxx",
    "latitude": 37.5665350,
    "longitude": 126.9780020,
    "accuracy": 15.0,
    "locationSharing": true,
    "timestamp": "2026-05-31T10:30:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |
| 404 | `NOT_FOUND` | 위치 데이터 없음 (위치 공유 OFF 또는 미전송) |

---

### API-013. 위치 이력 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/location/history` |
| 인증 | 필요 (JWT 쿠키, role: `family`, 해당 그룹 구성원) |
| 설명 | 선택한 날짜의 부모님 이동 경로를 반환한다. 최대 7일 이내 조회 가능. 100건 초과 시 10분 간격 샘플링 적용. |
| 관련 기능 | F-012 |

**Query 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupId` | string | Y | 그룹 UUID |
| `date` | string | Y | 조회 날짜 (YYYY-MM-DD 형식) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "date": "2026-05-31",
    "totalPoints": 48,
    "sampled": false,
    "locations": [
      {
        "locationId": "uuid-aaaa",
        "latitude": 37.5665350,
        "longitude": 126.9780020,
        "accuracy": 15.0,
        "timestamp": "2026-05-31T08:00:00Z"
      }
    ]
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | date 형식 오류 또는 groupId 누락 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |
| 422 | `UNPROCESSABLE` | 7일 초과 날짜 조회 시도 |

---

### API-014. 역지오코딩

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/location/address` |
| 인증 | 필요 (JWT 쿠키) |
| 설명 | GPS 좌표를 카카오맵 Geocoding API를 통해 도로명 주소로 변환한다. 동일 좌표(±50m) 30분 캐시 적용. |
| 관련 기능 | F-013 |

**Query 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `lat` | number | Y | 위도 |
| `lng` | number | Y | 경도 |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "roadAddress": "서울특별시 중구 세종대로 110",
    "jibunAddress": "서울특별시 중구 태평로1가 31",
    "cached": false
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | lat 또는 lng 누락·형식 오류 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 404 | `NOT_FOUND` | 해당 좌표의 주소 없음 |

---

### API-015. SOS 알림 발송

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/sos` |
| 인증 | 필요 (JWT 쿠키, role: `parent`) |
| 설명 | SOS 확정 시 가족 그룹 전원에게 FCM 푸시 알림과 현재 위치를 3초 이내에 발송한다. |
| 관련 기능 | F-016 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `latitude` | number | N | 현재 위도 (없을 경우 위치 불명으로 발송) |
| `longitude` | number | N | 현재 경도 |

```json
{
  "latitude": 37.5665350,
  "longitude": 126.9780020
}
```

**Response (201 Created)**

```json
{
  "status": "success",
  "data": {
    "sosEventId": "uuid-bbbb",
    "sentAt": "2026-05-31T10:40:00Z",
    "notifiedCount": 2,
    "failedCount": 0
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 parent 아님 |
| 500 | `INTERNAL_ERROR` | FCM 발송 완전 실패 (1회 재시도 후) |

---

### API-016. SOS 수신 이력 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/sos/history` |
| 인증 | 필요 (JWT 쿠키, 해당 그룹 구성원) |
| 설명 | 그룹의 SOS 발생 이력을 최신순으로 반환한다. |
| 관련 기능 | F-017 |

**Query 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupId` | string | Y | 그룹 UUID |
| `limit` | number | N | 조회 건수 (기본값: 20) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "total": 3,
    "events": [
      {
        "sosEventId": "uuid-bbbb",
        "latitude": 37.5665350,
        "longitude": 126.9780020,
        "sentAt": "2026-05-31T10:40:00Z",
        "notifiedCount": 2
      }
    ]
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |

---

### API-017. 채팅 메시지 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/chat/:groupId/messages` |
| 인증 | 필요 (JWT 쿠키, 해당 그룹 구성원) |
| 설명 | 가족 채팅방의 이전 메시지를 커서 기반 페이지네이션으로 조회한다. |
| 관련 기능 | F-018 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupId` | string | Y | 그룹 UUID |

**Query 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `before` | string | N | 이 메시지 ID 이전 메시지 조회 (커서) |
| `limit` | number | N | 조회 건수 (기본값: 30, 최대: 50) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "messageId": "uuid-cccc",
        "senderId": "uuid-xxxx",
        "content": "어머니 잘 계시죠?",
        "sentAt": "2026-05-31T10:20:00Z"
      }
    ],
    "hasMore": true,
    "nextCursor": "uuid-dddd"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |

---

### API-018. 채팅 메시지 전송

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/chat/:groupId/messages` |
| 인증 | 필요 (JWT 쿠키, 해당 그룹 구성원) |
| 설명 | 채팅 메시지를 DB에 저장하고 WebSocket으로 그룹에 broadcast, 미접속 구성원에게 FCM 알림을 발송한다. |
| 관련 기능 | F-018, F-019 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupId` | string | Y | 그룹 UUID |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `content` | string | Y | 메시지 내용 (1~500자) |

```json
{
  "content": "어머니 잘 계시죠?"
}
```

**Response (201 Created)**

```json
{
  "status": "success",
  "data": {
    "messageId": "uuid-cccc",
    "senderId": "uuid-xxxx",
    "content": "어머니 잘 계시죠?",
    "sentAt": "2026-05-31T10:20:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | content 누락 또는 500자 초과 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |

---

### API-019. 안전 구역 생성

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/geofence` |
| 인증 | 필요 (JWT 쿠키, role: `family`) |
| 설명 | 안전 구역을 생성한다. Free 플랜 1개, Pro 플랜 2개 한도. |
| 관련 기능 | F-020 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupId` | string | Y | 그룹 UUID |
| `name` | string | Y | 구역명 (1~20자) |
| `latitude` | number | Y | 중심점 위도 |
| `longitude` | number | Y | 중심점 경도 |
| `radius` | number | Y | 반경 (미터, 100~5000) |

```json
{
  "groupId": "uuid-yyyy",
  "name": "자택",
  "latitude": 37.5665350,
  "longitude": 126.9780020,
  "radius": 200
}
```

**Response (201 Created)**

```json
{
  "status": "success",
  "data": {
    "geofenceId": "uuid-eeee",
    "name": "자택",
    "latitude": 37.5665350,
    "longitude": 126.9780020,
    "radius": 200,
    "createdAt": "2026-05-31T10:50:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | 필드 누락 또는 radius 범위 오류 (100 미만 / 5000 초과) |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 family 아님 |
| 422 | `UNPROCESSABLE` | 플랜별 구역 한도 초과 |

---

### API-020. 안전 구역 수정

| 항목 | 내용 |
|------|------|
| Method | PUT |
| URL | `/api/geofence/:id` |
| 인증 | 필요 (JWT 쿠키, role: `family`, 해당 그룹 구성원) |
| 설명 | 기존 안전 구역의 이름, 중심점, 반경을 수정한다. |
| 관련 기능 | F-020 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | string | Y | 안전 구역 UUID |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `name` | string | N | 구역명 (1~20자) |
| `latitude` | number | N | 중심점 위도 |
| `longitude` | number | N | 중심점 경도 |
| `radius` | number | N | 반경 (미터, 100~5000) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "geofenceId": "uuid-eeee",
    "name": "자택(수정)",
    "latitude": 37.5665350,
    "longitude": 126.9780020,
    "radius": 300,
    "updatedAt": "2026-05-31T11:00:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | radius 범위 오류 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |
| 404 | `NOT_FOUND` | 존재하지 않는 안전 구역 |

---

### API-021. 안전 구역 삭제

| 항목 | 내용 |
|------|------|
| Method | DELETE |
| URL | `/api/geofence/:id` |
| 인증 | 필요 (JWT 쿠키, role: `family`, 해당 그룹 구성원) |
| 설명 | 안전 구역을 삭제하고 이탈 감지를 비활성화한다. |
| 관련 기능 | F-020 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | string | Y | 안전 구역 UUID |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "deletedAt": "2026-05-31T11:05:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |
| 404 | `NOT_FOUND` | 존재하지 않는 안전 구역 |

---

### API-022. 안전 구역 목록 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/geofence/:groupId` |
| 인증 | 필요 (JWT 쿠키, 해당 그룹 구성원) |
| 설명 | 그룹에 등록된 안전 구역 목록을 반환한다. 서버 사이드 위치 이탈 감지 시에도 사용한다. |
| 관련 기능 | F-021 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `groupId` | string | Y | 그룹 UUID |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "geofences": [
      {
        "geofenceId": "uuid-eeee",
        "name": "자택",
        "latitude": 37.5665350,
        "longitude": 126.9780020,
        "radius": 200,
        "createdAt": "2026-05-31T10:50:00Z"
      }
    ]
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 해당 그룹 구성원 아님 |

---

### API-023. 관리자 그룹 목록 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/admin/groups` |
| 인증 | 필요 (JWT 쿠키, role: `admin`) |
| 설명 | 전체 가족 그룹 목록을 검색·정렬·페이지네이션하여 반환한다. 페이지당 20건. |
| 관련 기능 | F-022 |

**Query 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `search` | string | N | 그룹명 또는 구성원 이름 검색어 |
| `sort` | string | N | 정렬 기준 (`createdAt` \| `memberCount` \| `lastActiveAt`, 기본값: `createdAt`) |
| `order` | string | N | 정렬 방향 (`asc` \| `desc`, 기본값: `desc`) |
| `page` | number | N | 페이지 번호 (기본값: 1) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "total": 125,
    "page": 1,
    "perPage": 20,
    "groups": [
      {
        "groupId": "uuid-yyyy",
        "groupName": "우리 가족",
        "memberCount": 3,
        "createdAt": "2026-05-01T09:00:00Z",
        "lastActiveAt": "2026-05-31T10:30:00Z"
      }
    ]
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 admin 아님 |

---

### API-024. 관리자 그룹 상세 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/admin/groups/:id` |
| 인증 | 필요 (JWT 쿠키, role: `admin`) |
| 설명 | 특정 가족 그룹의 구성원 목록과 각 구성원의 활동 상태를 반환한다. |
| 관련 기능 | F-023 |

**Path 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | string | Y | 그룹 UUID |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "groupId": "uuid-yyyy",
    "groupName": "우리 가족",
    "createdAt": "2026-05-01T09:00:00Z",
    "members": [
      {
        "userId": "uuid-xxxx",
        "phone": "01012345678",
        "role": "parent",
        "locationSharing": true,
        "lastSeenAt": "2026-05-31T10:30:00Z"
      }
    ]
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 admin 아님 |
| 404 | `NOT_FOUND` | 존재하지 않는 그룹 |

---

### API-025. SMS 발송

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/admin/sms` |
| 인증 | 필요 (JWT 쿠키, role: `admin`) |
| 설명 | NHN Cloud SMS API로 선택된 회원에게 문자를 발송한다. 90자 이하 SMS, 91자 이상 LMS 자동 분류. |
| 관련 기능 | F-024 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `recipients` | string[] | Y | 수신 대상 휴대폰 번호 배열 (최소 1개) |
| `content` | string | Y | 메시지 내용 (최대 2000자) |

```json
{
  "recipients": ["01012345678", "01098765432"],
  "content": "안심맵 서비스 점검 안내: 5월 31일 오전 2시~4시 서비스가 일시 중단됩니다."
}
```

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "messageType": "SMS",
    "totalCount": 2,
    "successCount": 2,
    "failCount": 0,
    "sentAt": "2026-05-31T11:10:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | recipients 누락 또는 content 누락 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 admin 아님 |
| 500 | `INTERNAL_ERROR` | NHN Cloud API 오류 |

---

### API-026. 카카오 알림톡 발송

| 항목 | 내용 |
|------|------|
| Method | POST |
| URL | `/api/admin/alimtalk` |
| 인증 | 필요 (JWT 쿠키, role: `admin`) |
| 설명 | 카카오 알림톡 템플릿 기반으로 메시지를 발송한다. |
| 관련 기능 | F-025 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `recipients` | string[] | Y | 수신 대상 휴대폰 번호 배열 |
| `templateCode` | string | Y | 알림톡 템플릿 코드 |
| `variables` | object | N | 템플릿 변수 키-값 쌍 |

```json
{
  "recipients": ["01012345678"],
  "templateCode": "ANSIM_WELCOME",
  "variables": {
    "userName": "홍길동",
    "serviceName": "안심맵"
  }
}
```

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "failCount": 0,
    "sentAt": "2026-05-31T11:15:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | recipients 또는 templateCode 누락 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 admin 아님 |
| 404 | `NOT_FOUND` | 존재하지 않는 템플릿 코드 |
| 422 | `UNPROCESSABLE` | 월 발송 한도 초과 |
| 500 | `INTERNAL_ERROR` | 카카오 알림톡 API 오류 |

---

### API-027. 알림톡 발송 이력 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/admin/alimtalk/history` |
| 인증 | 필요 (JWT 쿠키, role: `admin`) |
| 설명 | 카카오 알림톡 발송 이력을 최신순으로 반환한다. |
| 관련 기능 | F-025 |

**Query 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `page` | number | N | 페이지 번호 (기본값: 1) |
| `limit` | number | N | 조회 건수 (기본값: 20) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "total": 50,
    "page": 1,
    "perPage": 20,
    "records": [
      {
        "logId": "uuid-ffff",
        "templateCode": "ANSIM_WELCOME",
        "recipientCount": 10,
        "successCount": 10,
        "failCount": 0,
        "sentAt": "2026-05-31T11:15:00Z"
      }
    ]
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 admin 아님 |

---

### API-028. 통계 조회

| 항목 | 내용 |
|------|------|
| Method | GET |
| URL | `/api/admin/stats` |
| 인증 | 필요 (JWT 쿠키, role: `admin`) |
| 설명 | DAU, 가족 그룹 수, SOS 발생 건수 등 운영 지표를 일·주·월 단위로 반환한다. |
| 관련 기능 | F-026 |

**Query 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `type` | string | Y | 지표 유형 (`dau` \| `groups` \| `sos` \| `all`) |
| `period` | string | Y | 기간 단위 (`day` \| `week` \| `month`) |
| `from` | string | N | 시작일 (YYYY-MM-DD, 기본값: 30일 전) |
| `to` | string | N | 종료일 (YYYY-MM-DD, 기본값: 오늘) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "period": "day",
    "from": "2026-05-01",
    "to": "2026-05-31",
    "summary": {
      "totalDau": 150,
      "totalGroups": 45,
      "totalSosEvents": 3
    },
    "series": [
      {
        "date": "2026-05-31",
        "dau": 80,
        "newGroups": 5,
        "sosEvents": 1
      }
    ]
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | type 또는 period 누락·범위 오류 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 admin 아님 |

---

### API-029. 사용자 설정 저장

| 항목 | 내용 |
|------|------|
| Method | PATCH |
| URL | `/api/users/me/settings` |
| 인증 | 필요 (JWT 쿠키, role: `parent`) |
| 설명 | 배터리 절약 모드 설정 등 사용자 설정을 저장한다. 위치 전송 주기를 30초 또는 180초로 변경한다. |
| 관련 기능 | F-027 |

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `locationInterval` | number | N | 위치 전송 주기 (초, `30` 또는 `180`) |

```json
{
  "locationInterval": 180
}
```

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "locationInterval": 180,
    "updatedAt": "2026-05-31T11:20:00Z"
  }
}
```

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|-----------|-----------|------|
| 400 | `BAD_REQUEST` | locationInterval이 30 또는 180 아닌 값 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | role이 parent 아님 |

---

## WebSocket 명세

### WS-001. 실시간 위치·채팅

| 항목 | 내용 |
|------|------|
| 프로토콜 | WebSocket (Socket.io) |
| URL | `/ws` |
| 인증 | 연결 시 JWT 쿠키 또는 `auth.token` 핸드셰이크 파라미터 |
| 설명 | 그룹 채널(room)에 join하여 실시간 위치 데이터와 채팅 메시지를 송수신한다. |
| 관련 기능 | F-009, F-011, F-018 |

### 클라이언트 → 서버 이벤트

| 이벤트 | 설명 | Payload |
|--------|------|---------|
| `room:join` | 그룹 채널 구독 | `{ groupId: string }` |
| `room:leave` | 그룹 채널 구독 해제 | `{ groupId: string }` |
| `chat:message` | 채팅 메시지 전송 | `{ groupId: string, content: string }` |

### 서버 → 클라이언트 이벤트

| 이벤트 | 설명 | Payload |
|--------|------|---------|
| `location:update` | 부모님 위치 갱신 | `{ userId: string, latitude: number, longitude: number, accuracy: number, timestamp: string }` |
| `location:sharing_changed` | 위치 공유 ON/OFF 변경 | `{ userId: string, locationSharing: boolean, timestamp: string }` |
| `chat:message` | 새 채팅 메시지 수신 | `{ messageId: string, senderId: string, content: string, sentAt: string }` |
| `sos:triggered` | SOS 알림 수신 | `{ sosEventId: string, userId: string, latitude: number, longitude: number, sentAt: string }` |
| `geofence:event` | 안전 구역 이탈/복귀 | `{ geofenceId: string, name: string, eventType: "exit" \| "enter", timestamp: string }` |

### 재연결 정책

- 연결 끊김 시 exponential backoff로 자동 재연결: 1초 → 2초 → 4초 (최대 5회)
- 5회 실패 시 클라이언트에서 "채팅 연결이 끊겼습니다. 새로고침 해주세요." 안내 표시
- 재연결 성공 시 `GET /api/chat/:groupId/messages` 호출하여 미수신 메시지 동기화

---

## 변경 이력

| 버전 | 변경일 | 변경자 | 변경 내용 |
|------|--------|--------|-----------|
| v1.0 | 2026-05-31 | PM | 최초 작성 — 기능명세서 v1.0 기반 API-001~API-029 및 WS-001 전체 정의 |
