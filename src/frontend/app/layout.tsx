import type { Metadata, Viewport } from "next";
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "안심맵 — 부모님 위치 확인 서비스",
  description:
    "별도 앱 설치 없이 스마트폰 브라우저만으로 부모님 위치를 실시간 공유하고, 가족이 언제든 확인하며 즉시 소통할 수 있는 시니어 케어 통합 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2E7D32",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <GoogleAuthProvider>
          {children}
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
