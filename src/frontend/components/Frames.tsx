"use client";
// Frames.tsx — iOS 기기 프레임 + 브라우저 창(관리자 PC) 프레임
import * as React from "react";

/** 콘텐츠를 사용 가능 공간에 맞춰 축소(scale)하는 스테이지 */
export function FitStage({
  w,
  h,
  children,
}: {
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => {
      const availH = window.innerHeight - 150;
      const availW = window.innerWidth - 64;
      setScale(Math.min(1, availH / h, availW / w));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [w, h]);
  return (
    <div style={{ width: w * scale, height: h * scale, flexShrink: 0 }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

/** 아이폰 기기 프레임 (402×874) */
export function IOSDevice({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 402,
        height: 874,
        borderRadius: 56,
        background: "#0c0c0c",
        padding: 12,
        boxShadow: "0 30px 80px rgba(0,0,0,.35), inset 0 0 0 2px #2a2a2a",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 44,
          overflow: "hidden",
          background: "#fff",
          position: "relative",
        }}
      >
        {/* status bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            zIndex: 50,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "16px 28px 0",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--g900)" }}>9:41</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--g900)" }}>
            {/* signal / wifi / battery glyphs */}
            ▪▪▪ ▾ 🔋
          </span>
        </div>
        {/* dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 34,
            borderRadius: 999,
            background: "#000",
            zIndex: 60,
          }}
        />
        {children}
        {/* home indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 134,
            height: 5,
            borderRadius: 999,
            background: "rgba(0,0,0,.32)",
            zIndex: 60,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

/** 브라우저 창 프레임 (관리자 PC) */
export function ChromeWindow({
  width,
  height,
  url = "admin.ansimmap.kr",
  title = "안심맵 관리자 어드민",
  children,
}: {
  width: number;
  height: number;
  url?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 30px 80px rgba(0,0,0,.3)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* title bar */}
      <div
        style={{
          height: 44,
          background: "#e8eaed",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 14px",
          flexShrink: 0,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff5f57" }} />
        <span style={{ width: 12, height: 12, borderRadius: 999, background: "#febc2e" }} />
        <span style={{ width: 12, height: 12, borderRadius: 999, background: "#28c840" }} />
        <div
          style={{
            marginLeft: 14,
            background: "#fff",
            borderRadius: 8,
            height: 28,
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            color: "var(--g600)",
            fontSize: 13,
            fontWeight: 600,
            maxWidth: 360,
            flexShrink: 0,
          }}
          title={title}
        >
          🔒 {url}
        </div>
      </div>
      {/* address bar / tab strip */}
      <div style={{ flex: 1, position: "relative" }}>{children}</div>
    </div>
  );
}
