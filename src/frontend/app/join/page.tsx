"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PrototypeShell } from "@/components/PrototypeShell";

function JoinContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || undefined;
  return <PrototypeShell initialInviteCode={code} />;
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }}>초대 링크 확인 중...</div>}>
      <JoinContent />
    </Suspense>
  );
}
