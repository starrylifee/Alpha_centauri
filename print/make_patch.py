# -*- coding: utf-8 -*-
"""구버전 매트에 덧붙이는 개정 패치 (A4)

이미 인쇄한 구버전 매트(legacy/orbit-mat-a0.pdf)를 새로 뽑지 않고 쓰기 위한 판이다.
두 판의 렌더를 픽셀로 비교하면 다른 곳은 네 군데뿐이고, 그 네 구역 안에는 검정
잉크가 하나도 없다. 즉 궤도선·눈금은 구버전과 완전히 같아서 로봇 주행에는 손댈
것이 없고, 흰 여백 위의 안내 요소만 갈아 끼우면 된다.

    ① 발사대 둘레 발사각 각도판   (신규)      → 오려 붙이는 조각
    ② '도착 지점' → '기준선 0°'   (문구 교체)  → 오려 붙이는 조각
    ③ '도는 방향' 글씨            (삭제)       → 뜻이 같으니 그냥 둬도 된다
    ④ 오른쪽 안내 패널            (전면 개정)  → 2쪽의 안내지로 대신한다

조각은 make_mat_pdf.draw_mat()을 그대로 잘라 쓴다. 도안을 고치면 A0판·타일판과
같이 반영된다. 반드시 100%로 인쇄해야 각도판 눈금이 실제 각도와 맞는다.
"""
import os

from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas as pdfcanvas

import make_mat_pdf as M

W, H = 210.0, 297.0          # A4 세로

# ── 잘라 쓸 구역 (A0 SVG 좌표: 왼쪽 위 원점, mm) ─────────────────
# 네 값 모두 검정 잉크가 없는 흰 여백이다. 붙이다가 1~2mm 어긋나도 궤도선이
# 끊길 일이 없다.
#
# ①의 오른쪽 경계 578은 우연이 아니다. 발사선 점선은 구버전이 x=541에서,
# 새 판이 x=569에서 시작하는데 그 차이 28mm가 점선 한 주기(16+12)와 같다.
# 그래서 이 자리에서 조각의 점선과 매트에 남은 점선의 위상이 정확히 맞는다.
PIECE_DIAL = (455.0, 352.0, 578.0, 496.0)
PIECE_BASE = (726.0, 366.0, 848.0, 402.0)

# 오른쪽 안내 패널의 실제 잉크 범위 (렌더에서 실측). 2쪽에 축소해 싣는다.
# 아래쪽 인쇄 사양 세 줄(A0 크기·K100·무광)은 교실 안내지에 쓸모가 없어 잘라냈다.
PANEL_INK = (876.0, 72.0, 1156.0, 750.0)

MARGIN = 14.0

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'orbit-mat-patch-a4.pdf')


def text(c, x, y, s, size, color, font=None, anchor='start'):
    c.setFont(font or M.REG, size)
    c.setFillColor(color)
    {'start': c.drawString, 'middle': c.drawCentredString}[anchor](x, y, s)


def draw_piece(c, region, bx, by, scale=1.0, orbit=True, panel=False):
    """A0 도안의 region 부분을 (bx, by)에 scale 배로 그린다."""
    sx0, sy0, sx1, sy1 = region
    rx0, ry0 = sx0, M.H - sy1          # 매트 좌표계의 왼쪽 아래 모서리
    c.saveState()
    p = c.beginPath()
    p.rect(bx, by, (sx1 - sx0) * scale, (sy1 - sy0) * scale)
    c.clipPath(p, stroke=0, fill=0)
    c.translate(bx, by)
    c.scale(scale, scale)
    c.translate(-rx0, -ry0)
    M.draw_mat(c, orbit=orbit, panel=panel)
    c.restoreState()


def cut_box(c, bx, by, bw, bh):
    """재단선(점선)과 바깥 재단 마크. 자르고 나면 조각에 남지 않는다."""
    c.saveState()
    c.setStrokeColor(M.GRAY)
    c.setLineWidth(0.3)
    c.setDash(3, 2)
    c.rect(bx, by, bw, bh, stroke=1, fill=0)
    c.restoreState()

    c.setStrokeColor(M.GRAY)
    c.setLineWidth(0.4)
    for cx in (bx, bx + bw):
        for cy in (by, by + bh):
            ox = -1 if cx == bx else 1
            oy = -1 if cy == by else 1
            c.line(cx + ox * 2, cy, cx + ox * 8, cy)
            c.line(cx, cy + oy * 2, cx, cy + oy * 8)


def scale_bar(c, x, y):
    """배율 확인용 자. 실제 자로 재서 100mm면 100%로 뽑힌 것이다."""
    c.setStrokeColor(M.ORANGE)
    c.setLineWidth(0.5)
    c.line(x, y, x + 100, y)
    for v in (0, 50, 100):
        c.line(x + v, y - 2, x + v, y + 2)
    text(c, x + 104, y - 1.3, '실제 자로 재서 100mm여야 합니다', 3.4, M.ORANGE)


def page_pieces(c):
    y = H - MARGIN - 6
    title = '궤도 매트 개정 패치'
    text(c, MARGIN, y, title, 7, M.TEXT, M.BOLD)
    text(c, MARGIN + pdfmetrics.stringWidth(title, M.BOLD, 7) + 5, y,
         '구버전 매트에 오려 붙이기', 4.6, M.GRAY)

    y -= 7
    for ln, col in [('· 반드시 100% 실제 크기로 인쇄하세요. "용지에 맞춤"으로 뽑으면 각도판 눈금이 틀어집니다.', M.TEXT2),
                    ('· 점선을 따라 오려 제자리에 딱풀로 붙입니다. 선 바깥으로 넉넉히 잘라도 됩니다(주위가 흰 여백).', M.TEXT2),
                    ('· 앞면에 테이프 금지 — 광택이 로봇 바닥 센서를 속입니다.', M.RED),
                    ('· 검정 궤도선과 눈금은 구버전과 같습니다. 붙인 가장자리는 눌러 턱을 없애세요.', M.GRAY)]:
        text(c, MARGIN, y, ln, 3.8, col)
        y -= 5.0

    # ── 조각 ① 발사각 각도판 ────────────────────────────────────
    sx0, sy0, sx1, sy1 = PIECE_DIAL
    bw, bh = sx1 - sx0, sy1 - sy0
    y -= 1
    text(c, MARGIN, y, '① 발사각 각도판 — 발사대 자리에', 4.6, M.ORANGE, M.BOLD)
    y -= 5
    text(c, MARGIN, y, '옛 발사대 원(굵은 주황 동그라미)이 완전히 덮이도록 놓습니다.', 3.6, M.TEXT2)
    y -= 4.5
    text(c, MARGIN, y, '오른쪽 가장자리에서 잘린 점선이 매트에 남은 점선과 이어지면 정확히 맞은 것입니다.',
         3.6, M.TEXT2)
    y -= 3.5
    bx, by = (W - bw) / 2, y - bh
    draw_piece(c, PIECE_DIAL, bx, by)
    cut_box(c, bx, by, bw, bh)

    # ── 조각 ② 기준선 0° ────────────────────────────────────────
    sx0, sy0, sx1, sy1 = PIECE_BASE
    bw2, bh2 = sx1 - sx0, sy1 - sy0
    y = by - 10
    text(c, MARGIN, y, '② 기준선 0° — 오른쪽 화살표 위에', 4.6, M.ORANGE, M.BOLD)
    y -= 5
    text(c, MARGIN, y, '옛 "도착 지점" 글씨가 다 가려지게 덮습니다. 아래 숫자 0은 가리지 마세요.',
         3.6, M.TEXT2)
    y -= 4
    bx2, by2 = (W - bw2) / 2, y - bh2
    draw_piece(c, PIECE_BASE, bx2, by2)
    cut_box(c, bx2, by2, bw2, bh2)

    # ── 아래 안내 ───────────────────────────────────────────────
    y = by2 - 12
    scale_bar(c, MARGIN, y)
    y -= 8
    text(c, MARGIN, y, '· 안쪽 화살표 옆 "도는 방향" 글씨는 그대로 둬도 됩니다. 뜻이 같습니다.',
         3.6, M.GRAY)
    y -= 5
    text(c, MARGIN, y, '· 오른쪽 안내 패널은 문구가 많이 바뀌었습니다. 뒷장을 뽑아 매트 옆에 두세요.',
         3.6, M.GRAY)


def page_panel(c):
    sx0, sy0, sx1, sy1 = PANEL_INK
    pw, ph = sx1 - sx0, sy1 - sy0

    head = '새 안내'
    text(c, MARGIN, H - MARGIN - 5, head, 7, M.TEXT, M.BOLD)
    text(c, MARGIN + pdfmetrics.stringWidth(head, M.BOLD, 7) + 5, H - MARGIN - 5,
         '매트 오른쪽 설명을 이걸로 대신하세요', 4.4, M.GRAY)
    text(c, MARGIN, H - MARGIN - 12,
         '발사 계산이 없어졌습니다 — 두 로봇을 0° 출발점에서 동시 출발, 내행성이 한 바퀴 돌아올 때 발사.',
         3.8, M.RED)
    text(c, MARGIN, H - MARGIN - 17,
         '시도마다 출발점에 다시 놓고, 발사각을 바꿔 가며 가장 빨리 도킹하는 각도를 찾습니다.',
         3.8, M.RED)

    top = H - MARGIN - 24
    bot = MARGIN + 6
    s = min((W - 2 * MARGIN) / pw, (top - bot) / ph)
    bx = (W - pw * s) / 2
    draw_piece(c, PANEL_INK, bx, top - ph * s, scale=s, orbit=False, panel=True)


def main():
    M.register_fonts()
    c = pdfcanvas.Canvas(OUT, pagesize=(W * mm, H * mm))
    c.setTitle('궤도 매트 개정 패치 A4')
    c.setAuthor('Alpha Centauri')

    for page in (page_pieces, page_panel):
        c.setPageSize((W * mm, H * mm))
        c.scale(mm, mm)
        page(c)
        c.showPage()
    c.save()

    print('written: %s (%.0f KB, 2쪽)' % (OUT, os.path.getsize(OUT) / 1024.0))
    for name, r in [('① 각도판', PIECE_DIAL), ('② 기준선', PIECE_BASE)]:
        print('  %s 조각 %.0f × %.0f mm (100%%)' % (name, r[2] - r[0], r[3] - r[1]))


if __name__ == '__main__':
    main()
