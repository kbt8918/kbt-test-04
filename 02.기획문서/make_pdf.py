"""
정보구조도.md -> PDF 변환 스크립트
- Mermaid 다이어그램: mermaid.ink API PNG 렌더링
- 한국어 폰트: Malgun Gothic (Windows 내장)
- 레이아웃: reportlab Platypus (A4)
"""

import re, base64, urllib.request, tempfile, os
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── 폰트 등록 ──────────────────────────────────────────────────────────────
FONT_DIR = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Malgun",     FONT_DIR / "malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBold", FONT_DIR / "malgunbd.ttf"))
pdfmetrics.registerFont(TTFont("NanumGothic",     FONT_DIR / "NanumGothic.ttf"))
pdfmetrics.registerFont(TTFont("NanumGothicBold", FONT_DIR / "NanumGothicBold.ttf"))

BASE_FONT   = "Malgun"
BOLD_FONT   = "MalgunBold"

# ── 스타일 정의 ────────────────────────────────────────────────────────────
def make_styles():
    s = {}
    s["h1"] = ParagraphStyle(
        "h1", fontName=BOLD_FONT, fontSize=18, leading=26,
        textColor=colors.HexColor("#1a237e"),
        spaceAfter=8, spaceBefore=4,
    )
    s["h2"] = ParagraphStyle(
        "h2", fontName=BOLD_FONT, fontSize=13, leading=20,
        textColor=colors.HexColor("#283593"),
        spaceAfter=6, spaceBefore=14,
        borderPad=4,
    )
    s["h3"] = ParagraphStyle(
        "h3", fontName=BOLD_FONT, fontSize=11, leading=17,
        textColor=colors.HexColor("#37474f"),
        spaceAfter=4, spaceBefore=10,
    )
    s["body"] = ParagraphStyle(
        "body", fontName=BASE_FONT, fontSize=9, leading=15,
        textColor=colors.HexColor("#212121"),
        spaceAfter=4,
    )
    s["meta_label"] = ParagraphStyle(
        "meta_label", fontName=BOLD_FONT, fontSize=8.5, leading=13,
        textColor=colors.HexColor("#455a64"),
    )
    s["meta_value"] = ParagraphStyle(
        "meta_value", fontName=BASE_FONT, fontSize=8.5, leading=13,
        textColor=colors.HexColor("#212121"),
    )
    s["caption"] = ParagraphStyle(
        "caption", fontName=BASE_FONT, fontSize=8, leading=12,
        textColor=colors.HexColor("#546e7a"),
        alignment=TA_CENTER, spaceAfter=6,
    )
    s["th"] = ParagraphStyle(
        "th", fontName=BOLD_FONT, fontSize=8.5, leading=13,
        textColor=colors.white,
    )
    s["td"] = ParagraphStyle(
        "td", fontName=BASE_FONT, fontSize=8.5, leading=13,
        textColor=colors.HexColor("#212121"),
    )
    return s

# ── mermaid.ink 이미지 렌더링 (JPEG 반환) ─────────────────────────────────
def render_mermaid(code: str, idx: int, tmp_dir: str) -> str | None:
    VALID_MAGIC = (b"\xff\xd8\xff", b"\x89PNG", b"GIF8", b"RIFF")

    def _fetch(encoded: str) -> bytes | None:
        url = f"https://mermaid.ink/img/{encoded}?bgColor=white&width=1000"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            resp = urllib.request.urlopen(req, timeout=25)
            data = resp.read()
            return data if any(data[:4].startswith(m) for m in VALID_MAGIC) else None
        except Exception:
            return None

    encoded = base64.urlsafe_b64encode(code.encode("utf-8")).decode("utf-8")
    data = _fetch(encoded)

    if data is None:
        print(f"  [경고] 다이어그램 {idx} 렌더링 실패")
        return None

    # JPEG 또는 PNG 확장자로 저장
    ext  = "jpg" if data[:3] == b"\xff\xd8\xff" else "png"
    path = os.path.join(tmp_dir, f"mermaid_{idx}.{ext}")
    with open(path, "wb") as f:
        f.write(data)
    return path

# ── 마크다운 테이블 파싱 ────────────────────────────────────────────────────
def parse_md_table(lines: list[str]) -> list[list[str]]:
    rows = []
    for line in lines:
        line = line.strip()
        if not line or set(line.replace("|", "").replace("-", "").replace(" ", "")) == set():
            continue                 # 구분선 스킵
        if re.match(r"^\|[-| :]+\|$", line):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        rows.append(cells)
    return rows

def build_table_flowable(rows: list[list[str]], styles: dict):
    if not rows:
        return None
    page_w = A4[0] - 30 * mm
    col_n  = len(rows[0])
    col_w  = [page_w / col_n] * col_n

    data = []
    for r_idx, row in enumerate(rows):
        style = styles["th"] if r_idx == 0 else styles["td"]
        data.append([Paragraph(cell, style) for cell in row])

    t = Table(data, colWidths=col_w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0),  colors.HexColor("#283593")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.HexColor("#f5f5f5"), colors.white]),
        ("GRID",        (0, 0), (-1, -1), 0.4, colors.HexColor("#bdbdbd")),
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",  (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",(0, 0), (-1, -1), 6),
    ]))
    return t

# ── 마크다운 파싱 → Flowable 목록 변환 ────────────────────────────────────
def md_to_flowables(md_text: str, styles: dict, tmp_dir: str) -> list:
    story = []
    lines = md_text.splitlines()
    i = 0
    mermaid_idx = 0

    while i < len(lines):
        line = lines[i]

        # ── Mermaid 블록 ──
        if line.strip().startswith("```mermaid"):
            mermaid_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                mermaid_lines.append(lines[i])
                i += 1
            i += 1  # closing ```
            code = "\n".join(mermaid_lines).strip()
            mermaid_idx += 1
            print(f"  다이어그램 {mermaid_idx} 렌더링 중...")
            img_path = render_mermaid(code, mermaid_idx, tmp_dir)
            if img_path:
                max_w = A4[0] - 32 * mm
                raw   = Image(img_path)
                ratio = raw.imageHeight / raw.imageWidth if raw.imageWidth else 1
                img   = Image(img_path, width=max_w, height=max_w * ratio)
                story.append(Spacer(1, 4))
                story.append(img)
                story.append(Spacer(1, 4))
            else:
                story.append(Paragraph(
                    f"[다이어그램 {mermaid_idx} — 렌더링 불가]",
                    styles["caption"]
                ))
            continue

        # ── 일반 코드 블록 (스킵) ──
        if line.strip().startswith("```"):
            while i < len(lines) and not lines[i].strip().startswith("```"):
                i += 1
            i += 1
            continue

        # ── HR ──
        if re.match(r"^-{3,}$", line.strip()):
            story.append(HRFlowable(width="100%", thickness=0.5,
                                     color=colors.HexColor("#90a4ae")))
            story.append(Spacer(1, 3))
            i += 1
            continue

        # ── H1 ──
        if line.startswith("# ") and not line.startswith("## "):
            story.append(Paragraph(line[2:].strip(), styles["h1"]))
            i += 1
            continue

        # ── H2 ──
        if line.startswith("## ") and not line.startswith("### "):
            story.append(Spacer(1, 4))
            story.append(Paragraph(line[3:].strip(), styles["h2"]))
            story.append(HRFlowable(width="100%", thickness=1,
                                     color=colors.HexColor("#3f51b5"), spaceAfter=4))
            i += 1
            continue

        # ── H3 ──
        if line.startswith("### "):
            story.append(Paragraph(line[4:].strip(), styles["h3"]))
            i += 1
            continue

        # ── 테이블 블록 ──
        if line.strip().startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            rows = parse_md_table(table_lines)
            if rows:
                tbl = build_table_flowable(rows, styles)
                if tbl:
                    story.append(tbl)
                    story.append(Spacer(1, 6))
            continue

        # ── 빈 줄 ──
        if not line.strip():
            story.append(Spacer(1, 3))
            i += 1
            continue

        # ── 일반 텍스트 ──
        safe = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        # 볼드 **text** 처리
        safe = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", safe)
        # 인라인 코드 `text` 처리
        safe = re.sub(r"`([^`]+)`", r"<font name='MalgunBold'>\1</font>", safe)
        story.append(Paragraph(safe, styles["body"]))
        i += 1

    return story

# ── 메인 ────────────────────────────────────────────────────────────────────
def main():
    md_path = Path("c:/Users/kbt test-03/부모님위치확인서비스/02.기획문서/정보구조도.md")
    out_path = md_path.parent / "정보구조도.pdf"

    print(f"입력: {md_path}")
    print(f"출력: {out_path}")

    md_text = md_path.read_text(encoding="utf-8")
    styles  = make_styles()

    with tempfile.TemporaryDirectory() as tmp_dir:
        print("Mermaid 다이어그램 렌더링 중...")
        story = md_to_flowables(md_text, styles, tmp_dir)

        doc = SimpleDocTemplate(
            str(out_path),
            pagesize=A4,
            leftMargin=15 * mm,
            rightMargin=15 * mm,
            topMargin=16 * mm,
            bottomMargin=16 * mm,
            title="정보구조도 — 안심맵",
            author="PM",
            subject="부모님 위치 확인 서비스 정보구조도",
        )

        def on_page(canvas, doc):
            canvas.saveState()
            # 헤더 라인
            canvas.setStrokeColor(colors.HexColor("#3f51b5"))
            canvas.setLineWidth(1.5)
            canvas.line(15 * mm, A4[1] - 12 * mm, A4[0] - 15 * mm, A4[1] - 12 * mm)
            # 헤더 텍스트
            canvas.setFont(BOLD_FONT, 7)
            canvas.setFillColor(colors.HexColor("#3f51b5"))
            canvas.drawString(15 * mm, A4[1] - 10 * mm, "안심맵 (AnsimMap)")
            canvas.drawRightString(A4[0] - 15 * mm, A4[1] - 10 * mm, "정보구조도 v1.0")
            # 푸터
            canvas.setStrokeColor(colors.HexColor("#bdbdbd"))
            canvas.setLineWidth(0.5)
            canvas.line(15 * mm, 12 * mm, A4[0] - 15 * mm, 12 * mm)
            canvas.setFont(BASE_FONT, 7)
            canvas.setFillColor(colors.HexColor("#78909c"))
            canvas.drawString(15 * mm, 8 * mm, "DOC-08 | 2026-05-31")
            canvas.drawCentredString(A4[0] / 2, 8 * mm, "부모님 위치 확인 서비스")
            canvas.drawRightString(A4[0] - 15 * mm, 8 * mm,
                                   f"{doc.page}")
            canvas.restoreState()

        doc.build(story, onFirstPage=on_page, onLaterPages=on_page)

    print(f"\nPDF 생성 완료: {out_path}")

if __name__ == "__main__":
    main()
