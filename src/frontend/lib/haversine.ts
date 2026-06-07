// 지오펜싱 거리 계산 — Haversine 공식 (F-021). 순수 함수, 단위 테스트 대상.

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 두 좌표 간 거리(미터) */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 안전 구역 내부 여부. buffer(m)는 GPS 오차로 인한 경계 진동 방지용 (F-021) */
export function isInsideGeofence(
  point: LatLng,
  center: LatLng,
  radiusM: number,
  bufferM = 0
): boolean {
  return distanceMeters(point, center) <= radiusM + bufferM;
}
