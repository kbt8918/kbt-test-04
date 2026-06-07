# Google OAuth 로컬 테스트 가이드

## 개요
안심맵 프론트엔드에 Google OAuth 로그인 기능이 구현되었습니다. 이 가이드는 로컬 개발 환경에서 Google 소셜 로그인을 테스트하는 방법을 설명합니다.

---

## 1단계: Google Cloud Console 설정

### 1.1 Google Cloud 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 상단의 프로젝트 선택기에서 "새 프로젝트" 클릭
3. 프로젝트 이름: `ansimmap-local` (또는 원하는 이름)
4. 생성 후 대기 (1-2분)

### 1.2 Google OAuth 설정
1. 왼쪽 메뉴에서 **API 및 서비스** → **OAuth 동의 화면** 클릭
2. **User Type: 외부** 선택 후 "만들기" 클릭
3. 다음 정보 입력:
   - **앱 이름**: ansimmap
   - **사용자 지원 이메일**: (자신의 Gmail 주소)
   - **개발자 연락처 정보**: (자신의 Gmail 주소)
4. "저장 후 계속" 클릭
5. **범위(Scopes)** 단계:
   - "범위 추가 또는 제거" 클릭
   - `userinfo.email`, `userinfo.profile` 선택
   - "업데이트" 클릭
6. "저장 후 계속" → "대시보드로 돌아가기"

### 1.3 OAuth 클라이언트 ID 발급
1. **API 및 서비스** → **사용자 인증 정보** 클릭
2. "사용자 인증 정보 만들기" → **OAuth 2.0 클라이언트 ID** 선택
3. **애플리케이션 유형**: 웹 애플리케이션
4. **이름**: ansimmap-local
5. **승인된 JavaScript 원본** 추가:
   ```
   http://localhost:3000
   ```
6. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:3000
   http://localhost:3000/callback
   ```
7. "만들기" 클릭
8. **클라이언트 ID** 복사 (예: `123456789.apps.googleusercontent.com`)

---

## 2단계: 로컬 환경변수 설정

### 2.1 .env.local 파일 수정
파일: `src/frontend/.env.local`

이전에 생성된 클라이언트 ID를 다음과 같이 입력합니다:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_COPIED_CLIENT_ID.apps.googleusercontent.com
```

**예시:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghij.apps.googleusercontent.com
```

### 2.2 검증
`src/frontend/components/GoogleAuthProvider.tsx`에서 클라이언트 ID가 올바르게 읽혀지는지 확인:
```typescript
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";
```

---

## 3단계: 로컬 서버 실행

### 3.1 의존성 설치
```bash
cd src/frontend
npm install
```

### 3.2 개발 서버 시작
```bash
npm run dev
```

서버가 `http://localhost:3000`에서 시작됩니다.

---

## 4단계: Google 로그인 테스트

### 4.1 로그인 화면 접속
1. 브라우저에서 `http://localhost:3000` 접속
2. "로그인" 탭 선택
3. "Google로 계속하기" 버튼 클릭

### 4.2 Google 인증 팝업
1. Google 계정 선택 팝업이 나타남
2. 테스트용 Google 계정 선택 (Gmail 계정)
3. 권한 요청 화면에서 "계속" 클릭

### 4.3 로그인 완료
성공하면:
- ✅ 가족 화면(Family View)으로 자동 이동
- ✅ 사용자 이메일이 표시됨
- ✅ 브라우저 콘솔에 오류 없음

---

## 5단계: 회원가입 탭에서 Google 계정 연동 테스트

### 5.1 회원가입 탭 선택
1. "회원가입" 탭 클릭
2. "Google로 계속하기" 버튼 클릭

### 5.2 Google 계정 연동
1. Google 인증 완료
2. 화면에 다음이 표시되어야 함:
   ```
   ✓ 연동된 Google 계정 정보 카드
   - Google 프로필 이미지 (또는 기본 이모지)
   - 이메일 주소
   - "최초 구글 계정 연동 완료" 메시지
   - "해제" 버튼
   ```
3. 역할 선택 및 약관 동의 후 "동의하고 시작하기" 클릭

---

## 6단계: 오류 해결

### 오류: "클라이언트 ID 없음"
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=dummy-client-id.apps.googleusercontent.com
```
**해결**: `.env.local`에 실제 클라이언트 ID 입력 후 서버 재시작

### 오류: "Origin mismatch"
```
Error: origin_mismatch
Expected: [클라이언트ID]
Got: http://localhost:3000
```
**해결**: Google Cloud Console에서 **승인된 JavaScript 원본** 재확인
- `http://localhost:3000` 이 정확히 등록되어 있는지 확인
- 대시보드 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 수정

### 오류: "리디렉션 URI 불일치"
**해결**: Google Cloud Console에서 **승인된 리디렉션 URI** 확인
- `http://localhost:3000/callback` 추가

### 팝업 차단
- 브라우저의 팝업 차단 설정 확인
- `http://localhost:3000` 허용 목록에 추가

---

## 7단계: 브라우저 콘솔 확인

### 개발자 도구 열기
```
F12 또는 Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (Mac)
```

### Console 탭에서 다음 메시지 확인
```
✓ Google OAuth 로그인 성공
✓ 사용자 정보 조회 완료: {email: "...", name: "...", picture: "..."}
✓ API 호출 성공: /api/auth/google (201 또는 200)
```

---

## 8단계: 백엔드 동작 확인

### 8.1 API 응답 확인
**개발자 도구** → **Network** 탭 → `google` 요청 확인

성공 응답 (201 신규 사용자):
```json
{
  "status": "success",
  "data": {
    "userId": "user_1699999999_abcdefg",
    "phone": null,
    "role": "family",
    "locationSharing": false,
    "groupId": null
  }
}
```

기존 사용자 응답 (200):
```json
{
  "status": "success",
  "data": {
    "userId": "user_existing_id",
    "phone": "01012345678",
    "role": "family",
    "locationSharing": true,
    "groupId": "group_xyz"
  }
}
```

### 8.2 에러 응답 확인
```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "Google 토큰 검증에 실패했습니다."
}
```

---

## 주의사항

### 보안
- **production 배포 시**:
  - `NEXT_PUBLIC_SKIP_TOKEN_VERIFY=true` → `false` 로 변경
  - 실제 Google Cloud Console에 Vercel 도메인 등록
  - JWT_SECRET을 강력한 32자 이상 문자열로 설정

### 토큰 검증
- 로컬 개발: `NEXT_PUBLIC_SKIP_TOKEN_VERIFY=true` → 토큰 검증 스킵
- production: 항상 `https://www.googleapis.com/oauth2/v3/tokeninfo`로 검증

### CORS 이슈
- Google OAuth 팝업은 CORS 보호 대상이 아님
- `/api/auth/google` 엔드포인트는 서버에서 Google API 호출 (안전함)

---

## 참고 자료

| 항목 | 링크 |
|------|------|
| Google Cloud Console | https://console.cloud.google.com |
| Google OAuth 2.0 문서 | https://developers.google.com/identity/protocols/oauth2 |
| @react-oauth/google | https://github.com/react-oauth/react-oauth.google |
| 안심맵 프로젝트 | http://localhost:3000 |

---

## 다음 단계

✅ 로컬 테스트 완료 후:
1. GitHub에 커밋
2. Vercel에 배포
3. production Google Cloud 설정 적용
4. 실제 휴대폰에서 테스트 (모바일 반응형 확인)
