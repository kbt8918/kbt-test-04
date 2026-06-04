// API-014 역지오코딩 — GET /api/location/address?lat&lng
// 카카오맵 REST API 사용. 키 미설정 시 데모 응답. 동일 좌표(±50m) 30분 캐시.
import { NextRequest } from "next/server";
import { handler, ok, fail, requireAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KAKAO_KEY = process.env.KAKAO_MAP_API_KEY ?? "";
const CACHE_TTL_MS = (Number(process.env.GEOCODING_CACHE_TTL ?? 1800)) * 1000;

interface CacheEntry {
  roadAddress: string;
  jibunAddress: string;
  at: number;
}
// 모듈 스코프 인메모리 캐시 (서버리스 콜드스타트 시 초기화됨 — 베스트에포트)
const cache = new Map<string, CacheEntry>();

function cacheKey(lat: number, lng: number): string {
  // ±50m ~ 소수점 3자리(약 111m)보다 촘촘하게 4자리(약 11m)로 반올림
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export const GET = handler(async (req: NextRequest) => {
  requireAuth(req);
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return fail("BAD_REQUEST", "lat, lng 값이 필요합니다.");

  const key = cacheKey(lat, lng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return ok({ roadAddress: hit.roadAddress, jibunAddress: hit.jibunAddress, cached: true });
  }

  if (!KAKAO_KEY) {
    // 데모: 키 미설정 시 좌표 기반 더미 주소
    const demo = {
      roadAddress: "서울특별시 마포구 창전로 12",
      jibunAddress: "서울특별시 마포구 창전동 12-4",
    };
    cache.set(key, { ...demo, at: Date.now() });
    return ok({ ...demo, cached: false });
  }

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  if (!res.ok) return fail("NOT_FOUND", "해당 좌표의 주소를 찾을 수 없습니다.");
  const json = (await res.json()) as {
    documents?: { road_address?: { address_name?: string }; address?: { address_name?: string } }[];
  };
  const doc = json.documents?.[0];
  if (!doc) return fail("NOT_FOUND", "해당 좌표의 주소를 찾을 수 없습니다.");

  const result = {
    roadAddress: doc.road_address?.address_name ?? "",
    jibunAddress: doc.address?.address_name ?? "",
  };
  cache.set(key, { ...result, at: Date.now() });
  return ok({ ...result, cached: false });
});
