# -*- coding: utf-8 -*-
"""궤도 매트를 여러 장으로 나눈 인쇄물 (A1 / A3 / B4)

A0 실사출력 대신 작은 용지로 뽑아 이어붙이는 판. 궤도 부분만 나온다
(오른쪽 안내 패널은 뺐다).

도안은 make_mat_pdf.draw_mat()을 그대로 잘라 쓴다. 반경·선 폭 같은 수치를 고치면
A0판과 이 타일판들에 같이 반영된다.

용지별 장수는 여백을 확보한 상태에서 자동으로 계산한다. 결과는
    A1  2장 (이음새 1줄)   A3  9장 (4줄)   B4  12장 (5줄)

이음새 설계
- 라인트레이싱은 이음새에 예민하다. 두 장이 2~3mm만 어긋나도 20mm 선이 옆으로
  꺾여서 센서가 놓칠 수 있다. 그래서 타일 모서리에 정렬 십자를 넣었다.
  네 장(또는 두 장)이 제대로 만나면 십자가 온전한 모양이 된다.
- 정렬 십자는 매트의 발사선과 같은 연한 주황이다. 타일 모서리가 바깥 궤도 로봇의
  몸통 띠(선 중심 ±40mm) 가장자리에 걸리기 때문에, 검정이면 바닥 센서가 궤도선으로
  착각한다. 검정은 궤도 선과 눈금뿐이라는 매트의 규칙을 그대로 지킨다.
- 재단선과 재단 마크, 배율 확인용 자, 타일 번호는 전부 여백에 있어 자르면 없어진다.
"""
import math
import os

from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as pdfcanvas

import make_mat_pdf as M

# ── 궤도부의 실제 잉크 범위 ──────────────────────────────────────
# A0 PDF에서 실측(SVG 좌상단 원점 기준). 원 자체는 중심에서 396mm이지만
# 0도의 '도착 지점' 글씨가 오른쪽으로 419.5mm까지 나가서 영역이 정사각이 아니다.
INK_X0, INK_X1 = 16.0, 839.5
INK_Y0, INK_Y1 = 24.0, 815.0
PAD = 9.0

RX0, RX1 = INK_X0 - PAD, INK_X1 + PAD
RY0, RY1 = M.H - (INK_Y1 + PAD), M.H - (INK_Y0 - PAD)   # PDF는 원점이 왼쪽 아래
REG_W, REG_H = RX1 - RX0, RY1 - RY0

# 여백 하한. 복사기가 못 찍는 가장자리(보통 5mm)와 재단 마크 자리를 합친 값이다.
MIN_MARGIN = 12.0

PAPERS = [('A1', 594.0, 841.0),
          ('A3', 297.0, 420.0),
          ('B4', 257.0, 364.0)]      # B4는 국내 복사기 기준 JIS 257 × 364

COL_NAMES = 'ABCDEFGH'


def pick_layout(pw, ph):
    """장수 → 이음새 수 → 여백 균형 순으로 가로/세로와 격자를 고른다."""
    best = None
    for W, H in ((pw, ph), (ph, pw)):
        uw, uh = W - 2 * MIN_MARGIN, H - 2 * MIN_MARGIN
        if uw <= 0 or uh <= 0:
            continue
        cols = int(math.ceil(REG_W / uw))
        rows = int(math.ceil(REG_H / uh))
        tw, th = REG_W / cols, REG_H / rows
        bx, by = (W - tw) / 2, (H - th) / 2
        key = (cols * rows, (cols - 1) + (rows - 1), -min(bx, by))
        if best is None or key < best[0]:
            best = (key, W, H, cols, rows, tw, th, bx, by)
    return best


class Sheet(object):
    """한 용지 규격의 타일 배치."""

    def __init__(self, name, pw, ph):
        _, self.W, self.H, self.cols, self.rows, \
            self.tw, self.th, self.bx, self.by = pick_layout(pw, ph)
        self.name = name
        self.n = self.cols * self.rows
        self.seams = (self.cols - 1) + (self.rows - 1)
        self.margin = min(self.bx, self.by)

    def tile_name(self, i, j):
        return '%s-%d' % (COL_NAMES[i], j + 1)

    @property
    def box(self):
        return (self.bx, self.by, self.tw, self.th)


def text(c, x, y, s, size, color, font=None, anchor='start'):
    c.setFont(font or M.REG, size)
    c.setFillColor(color)
    {'start': c.drawString, 'middle': c.drawCentredString,
     'end': c.drawRightString}[anchor](x, y, s)


def draw_slice(c, sh, i, j, box, scale=1.0):
    """타일 (i, j)에 해당하는 궤도 조각을 box 안에 그린다."""
    bx, by, bw, bh = box
    c.saveState()
    p = c.beginPath()
    p.rect(bx, by, bw, bh)
    c.clipPath(p, stroke=0, fill=0)
    c.translate(bx, by)
    c.scale(scale, scale)
    c.translate(-(RX0 + i * sh.tw), -(RY1 - (j + 1) * sh.th))
    M.draw_mat(c, orbit=True, panel=False)
    c.restoreState()


def reg_crosses(c, box):
    """내용 상자 네 모서리의 정렬 십자. 상자 안쪽만 남아 사분면 하나씩 보인다.

    매트에 그대로 남으므로 색은 반드시 연한 주황이어야 한다(윗글 참고).
    """
    bx, by, bw, bh = box
    c.saveState()
    p = c.beginPath()
    p.rect(bx, by, bw, bh)
    c.clipPath(p, stroke=0, fill=0)
    c.setStrokeColor(M.LAUNCH)
    c.setLineWidth(1.2)
    for cx in (bx, bx + bw):
        for cy in (by, by + bh):
            c.line(cx - 12, cy, cx + 12, cy)
            c.line(cx, cy - 12, cx, cy + 12)
    c.restoreState()


def trim_marks(c, box, margin):
    """재단선(점선)과 바깥 재단 마크. 둘 다 자르고 나면 없어진다."""
    bx, by, bw, bh = box
    c.saveState()
    c.setStrokeColor(M.GRAY)
    c.setLineWidth(0.3)
    c.setDash(4, 3)
    c.rect(bx, by, bw, bh, stroke=1, fill=0)
    c.restoreState()

    off, ln = min(3.0, margin * 0.2), min(10.0, margin * 0.55)
    c.setStrokeColor(M.GRAY)
    c.setLineWidth(0.4)
    for cx in (bx, bx + bw):
        for cy in (by, by + bh):
            ox = -1 if cx == bx else 1
            oy = -1 if cy == by else 1
            c.line(cx + ox * off, cy, cx + ox * (off + ln), cy)
            c.line(cx, cy + oy * off, cx, cy + oy * (off + ln))


def scale_bar(c, x, y, size, length=100.0):
    """복사기 배율 확인용 자. 여백에 있으므로 자르고 나면 없어진다."""
    c.setStrokeColor(M.ORANGE)
    c.setLineWidth(0.5)
    c.line(x, y, x + length, y)
    for v in (0, length / 2, length):
        c.line(x + v, y - 2, x + v, y + 2)
    text(c, x + length + 4, y - size * 0.35, '실제 자로 재서 100mm여야 합니다', size, M.ORANGE)


def mini_map(c, sh, x, y, cw, ch, cur):
    """배치 썸네일. cur 칸을 채운다."""
    for j in range(sh.rows):
        for i in range(sh.cols):
            rx, ry = x + i * cw, y + (sh.rows - 1 - j) * ch
            filled = (cur == (i, j))
            c.setFillColor(M.ORANGE if filled else M.WHITE)
            c.setStrokeColor(M.GRAY)
            c.setLineWidth(0.3)
            c.rect(rx, ry, cw, ch, stroke=1, fill=1)
            c.setFont(M.BOLD if filled else M.REG, min(cw, ch) * 0.40)
            c.setFillColor(M.WHITE if filled else M.GRAY)
            c.drawCentredString(rx + cw / 2, ry + ch / 2 - min(cw, ch) * 0.14,
                                sh.tile_name(i, j))


def tile_page(c, sh, i, j):
    bx, by, tw, th = sh.box
    draw_slice(c, sh, i, j, sh.box)
    reg_crosses(c, sh.box)
    trim_marks(c, sh.box, sh.margin)

    # 안내는 전부 여백에 넣는다 — 자르고 나면 남지 않는다.
    name_size = min(10.0, (bx - 8) / 2.2)
    text(c, 4, by + th - name_size, sh.tile_name(i, j), name_size, M.ORANGE, M.BOLD)
    text(c, 4, by + th - name_size - 6, '궤도 매트 · 100%', 3.4, M.GRAY)

    cw = min(9.0, (bx - 8) / sh.cols)
    ch = cw * sh.th / sh.tw
    mini_map(c, sh, 4, by + th - name_size - 12 - sh.rows * ch, cw, ch, (i, j))

    # 위아래 여백의 글자는 재단 마크를 가리지 않게 상자 왼쪽 모서리보다 안쪽에서 시작한다.
    inset = bx + 16

    top_size = min(4.2, by * 0.28)
    text(c, inset, by + th + by * 0.4,
         '재단선(점선)을 따라 사방을 자른 뒤 맞대어 붙이세요. '
         '앞면에 테이프 금지 — 광택이 로봇 센서를 속입니다. 뒷면에서 붙이세요.',
         top_size, M.GRAY)

    bot_size = min(4.0, by * 0.25)
    scale_bar(c, inset, by * 0.6, bot_size)
    text(c, inset, by * 0.25, '뒷면에 연필로 번호를 적어두고 자르세요.', bot_size, M.GRAY)

    hint_size = min(3.8, (sh.W - bx - tw - 8) / 5.0)
    hx, hy = bx + tw + 4, by + th - name_size
    text(c, hx, hy, '→ %s' % sh.tile_name(i + 1, j) if i + 1 < sh.cols else '→ 끝',
         hint_size, M.GRAY)
    text(c, hx, hy - hint_size - 2,
         '↓ %s' % sh.tile_name(i, j + 1) if j + 1 < sh.rows else '↓ 끝', hint_size, M.GRAY)


def map_page(c, sh):
    text(c, 20, sh.H - 20, '궤도 매트 %s 타일 %d장 — 붙이는 순서' % (sh.name, sh.n),
         8, M.TEXT, M.BOLD)

    MW = sh.W * 0.52
    s = MW / REG_W
    MH = REG_H * s
    mx, my = 20.0, sh.H - 40 - MH
    draw_slice(c, sh, 0, sh.rows - 1, (mx, my, MW, MH), scale=s)

    c.setStrokeColor(M.GRAY)
    c.setLineWidth(0.5)
    c.rect(mx, my, MW, MH, stroke=1, fill=0)
    for i in range(1, sh.cols):
        c.line(mx + i * MW / sh.cols, my, mx + i * MW / sh.cols, my + MH)
    for j in range(1, sh.rows):
        c.line(mx, my + j * MH / sh.rows, mx + MW, my + j * MH / sh.rows)
    for j in range(sh.rows):
        for i in range(sh.cols):
            lx = mx + (i + 0.5) * MW / sh.cols
            ly = my + MH - (j + 0.5) * MH / sh.rows - 3
            c.setFillColor(M.WHITE)          # 궤도선 위에 겹쳐도 읽히게 흰 바탕을 깐다
            c.rect(lx - 11, ly - 2.5, 22, 11, stroke=0, fill=1)
            text(c, lx, ly, sh.tile_name(i, j), 8, M.ORANGE, M.BOLD, 'middle')

    tx, ty = mx + MW + 14, sh.H - 45
    lines = [('붙이는 요령', 6, M.TEXT, M.BOLD),
             ('', 3, M.GRAY, None),
             ('① %d장을 실제 크기 100%%로 인쇄합니다.' % sh.n, 4.6, M.TEXT2, None),
             ('   "용지에 맞춤"으로 뽑으면 크기가 틀어집니다.', 4.2, M.GRAY, None),
             ('', 3, M.GRAY, None),
             ('② 뒷면에 연필로 번호를 적어두고,', 4.6, M.TEXT2, None),
             ('   점선을 따라 사방 여백을 잘라냅니다.', 4.6, M.TEXT2, None),
             ('', 3, M.GRAY, None),
             ('③ A-1부터 왼쪽 위 → 오른쪽 순서로,', 4.6, M.TEXT2, None),
             ('   겹치지 말고 맞대어 놓습니다.', 4.6, M.TEXT2, None),
             ('', 3, M.GRAY, None),
             ('④ 모서리가 만나는 자리의 연한 주황 십자가', 4.6, M.TEXT2, None),
             ('   온전한 + 모양이 되면 정확히 맞은 것입니다.', 4.6, M.TEXT2, None),
             ('   가장 확실한 건 검은 궤도선이 끊김 없이', 4.2, M.GRAY, None),
             ('   매끄럽게 이어지는지 보는 것입니다.', 4.2, M.GRAY, None),
             ('', 3, M.GRAY, None),
             ('⑤ 뒷면에서 테이프로 붙입니다.', 4.6, M.TEXT2, None),
             ('   앞면 테이프는 광택 때문에 안 됩니다.', 4.2, M.RED, None),
             ('', 5, M.GRAY, None),
             ('완성 크기 %.0f × %.0f mm' % (REG_W, REG_H), 4.6, M.GRAY, None),
             ('궤도선 검정 · 폭 %g mm · 이음새 %d줄' % (M.LINE_W, sh.seams), 4.6, M.GRAY, None)]
    for line, size, color, font in lines:
        if line:
            text(c, tx, ty, line, size, color, font)
        ty -= size + 2.2


def build(name, pw, ph):
    sh = Sheet(name, pw, ph)
    out = os.path.join(M.HERE, 'orbit-mat-tiles-%s.pdf' % name.lower())
    c = pdfcanvas.Canvas(out, pagesize=(sh.W * mm, sh.H * mm))
    c.setTitle('궤도 매트 %s 타일 %d장' % (sh.name, sh.n))

    for j in range(sh.rows):
        for i in range(sh.cols):
            c.setPageSize((sh.W * mm, sh.H * mm))
            c.scale(mm, mm)
            tile_page(c, sh, i, j)
            c.showPage()

    c.setPageSize((sh.W * mm, sh.H * mm))
    c.scale(mm, mm)
    map_page(c, sh)
    c.showPage()
    c.save()
    return sh, out


def main():
    M.register_fonts()
    print('완성 크기 %.1f × %.1f mm (궤도부만, 안내 패널 제외)' % (REG_W, REG_H))
    print('')
    print('%-4s %-14s %-9s %-6s %-8s %s' % ('용지', '인쇄 방향', '장수', '이음새', '타일', '여백'))
    for name, pw, ph in PAPERS:
        sh, out = build(name, pw, ph)
        orient = '%s %.0f×%.0f' % ('가로' if sh.W > sh.H else '세로', sh.W, sh.H)
        print('%-4s %-14s %-9s %-6s %-8s 좌우 %.0f · 상하 %.0f mm'
              % (name, orient, '%d장 (%d×%d)' % (sh.n, sh.cols, sh.rows),
                 '%d줄' % sh.seams, '%.0f×%.0f' % (sh.tw, sh.th), sh.bx, sh.by))
        print('     → %s (%.0f KB, %d쪽 = 타일 %d + 배치도 1)'
              % (os.path.basename(out), os.path.getsize(out) / 1024.0, sh.n + 1, sh.n))


if __name__ == '__main__':
    main()
