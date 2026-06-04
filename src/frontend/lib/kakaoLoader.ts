"use client";
// kakaoLoader.ts — 카카오맵 JS SDK 동적 로더
// NEXT_PUBLIC_KAKAO_MAP_KEY 가 설정된 경우에만 SDK 를 1회 로드한다.
// 키가 없으면 즉시 "unavailable" 을 반환하여 호출부가 FakeMap 으로 폴백하도록 한다.

export const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

type LoadState = "idle" | "loading" | "ready" | "unavailable";

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (cb: () => void) => void;
        Map: new (container: HTMLElement, options: unknown) => unknown;
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (options: unknown) => { setMap: (m: unknown) => void };
        Circle: new (options: unknown) => { setMap: (m: unknown) => void };
        Polyline: new (options: unknown) => { setMap: (m: unknown) => void };
        LatLngBounds: new () => { extend: (latlng: unknown) => void };
        CustomOverlay: new (options: unknown) => { setMap: (m: unknown) => void };
      };
    };
  }
}

let state: LoadState = "idle";
let promise: Promise<boolean> | null = null;

/** 카카오맵 SDK 로드. 성공 시 true, 키 없음/실패 시 false (→ FakeMap 폴백) */
export function loadKakaoMaps(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!KAKAO_KEY) {
    state = "unavailable";
    return Promise.resolve(false);
  }
  if (state === "ready") return Promise.resolve(true);
  if (promise) return promise;

  state = "loading";
  promise = new Promise<boolean>((resolve) => {
    // 이미 로드된 경우
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        state = "ready";
        resolve(true);
      });
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        state = "unavailable";
        resolve(false);
        return;
      }
      window.kakao.maps.load(() => {
        state = "ready";
        resolve(true);
      });
    };
    script.onerror = () => {
      state = "unavailable";
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return promise;
}

export function isKakaoConfigured(): boolean {
  return !!KAKAO_KEY;
}
