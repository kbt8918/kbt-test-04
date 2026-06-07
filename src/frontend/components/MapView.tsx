"use client";
// MapView.tsx — 카카오맵 실 SDK / FakeMap 자동 폴백 래퍼
// 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 있고 로드에 성공하면 실제 카카오맵, 아니면 FakeMap.
// 실 지도용 좌표(geo*)가 주어지면 그걸로, 없으면 FakeMap 의 뷰포트 좌표만 사용한다.
import * as React from "react";
import { FakeMap, MapDot, type MapMarker, type MapCircle } from "./FakeMap";
import { loadKakaoMaps } from "../lib/kakaoLoader";

export interface GeoPoint {
  lat: number;
  lng: number;
}
export interface GeoMarker extends GeoPoint {
  emoji?: string;
  label?: string;
  color?: string;
}
export interface GeoCircle extends GeoPoint {
  radius: number; // meters
  tone?: "safe" | "danger";
}

interface MapViewProps {
  // FakeMap 폴백용(0~100 뷰포트) — 기존 호출부 호환
  markers?: MapMarker[];
  path?: { x: number; y: number }[] | null;
  circle?: MapCircle | null;
  dim?: boolean;
  grey?: boolean;
  showControls?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  // 실 카카오맵용(실좌표) — 있으면 실 SDK 렌더에 사용
  geoCenter?: GeoPoint;
  geoMarkers?: GeoMarker[];
  geoPath?: GeoPoint[];
  geoCircle?: GeoCircle | null;
  geoLevel?: number; // 카카오맵 확대 레벨(작을수록 확대)
}

const DEFAULT_CENTER: GeoPoint = { lat: 37.5665, lng: 126.978 }; // 서울 시청

export function MapView(props: MapViewProps) {
  const { geoCenter, geoMarkers, geoPath, geoCircle, geoLevel = 4 } = props;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [useKakao, setUseKakao] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadKakaoMaps().then((ok) => {
      if (alive) setUseKakao(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 실 카카오맵 렌더링
  React.useEffect(() => {
    if (useKakao !== true || !containerRef.current || typeof window === "undefined") return;
    const kakao = window.kakao;
    if (!kakao?.maps) return;

    const center = geoCenter ?? geoMarkers?.[0] ?? geoPath?.[0] ?? DEFAULT_CENTER;
    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: geoLevel,
    });

    // 마커 (이모지 커스텀 오버레이)
    (geoMarkers ?? []).forEach((m) => {
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(m.lat, m.lng),
        yAnchor: 1,
        content: `<div style="transform:translateY(-6px);background:${
          m.color ?? "#2E7D32"
        };border:2.5px solid #fff;border-radius:50% 50% 50% 0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.3);"><span style="transform:rotate(0);font-size:20px;">${
          m.emoji ?? "📍"
        }</span></div>`,
      });
      overlay.setMap(map);
    });

    // 경로 폴리라인
    if (geoPath && geoPath.length > 1) {
      const line = new kakao.maps.Polyline({
        path: geoPath.map((p) => new kakao.maps.LatLng(p.lat, p.lng)),
        strokeWeight: 5,
        strokeColor: "#1976D2",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });
      line.setMap(map);
    }

    // 지오펜스 원
    if (geoCircle) {
      const isDanger = geoCircle.tone === "danger";
      const circle = new kakao.maps.Circle({
        center: new kakao.maps.LatLng(geoCircle.lat, geoCircle.lng),
        radius: geoCircle.radius,
        strokeWeight: 2,
        strokeColor: isDanger ? "#D32F2F" : "#2E7D32",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
        fillColor: isDanger ? "#D32F2F" : "#2E7D32",
        fillOpacity: 0.15,
      });
      circle.setMap(map);
    }
  }, [useKakao, geoCenter, geoMarkers, geoPath, geoCircle, geoLevel]);

  // 로딩 중이거나 키 없음/실패 → FakeMap 폴백 (기존 동작 유지)
  if (useKakao !== true) {
    return (
      <FakeMap
        markers={props.markers}
        path={props.path}
        circle={props.circle}
        dim={props.dim}
        grey={props.grey}
        showControls={props.showControls}
        style={props.style}
      >
        {props.children}
      </FakeMap>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, ...props.style }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {props.dim && <div style={{ position: "absolute", inset: 0, background: "rgba(120,124,120,0.32)" }} />}
    </div>
  );
}

export { MapDot };
