// env.ts — 상용/데모 환경 플래그
//
// 데모(둘러보기) 진입과 하드코딩 샘플 데이터는 상용 서비스에서 노출되면 안 된다.
// 기본 정책: 상용(production) 빌드에서는 데모 기능을 끈다.
// 로컬·프리뷰에서는 켜둔 채로 두어 화면 검토에 활용한다.
// NEXT_PUBLIC_ENABLE_DEMO 로 명시 제어할 수 있다("true"/"false").

const explicit = process.env.NEXT_PUBLIC_ENABLE_DEMO;

export const DEMO_ENABLED: boolean =
  explicit === "true" ? true : explicit === "false" ? false : process.env.NODE_ENV !== "production";
