# -*- coding: utf-8 -*-
"""A0 궤도 매트 인쇄용 PDF 생성 (벡터 · CMYK · 한글 폰트 임베드)

make_mat.py(SVG)와 같은 도안이다. 반경·눈금 같은 수치는 아래 상수 블록에 한 번만
적혀 있고 make_mat.py의 값과 동일해야 한다. 수치를 고치면 두 파일 다 고칠 것.

인쇄용이라 SVG판과 다르게 처리한 부분
- 색을 전부 CMYK로 지정한다. 특히 궤도 선과 눈금은 순수 K100(먹 1도)이라
  리치블랙으로 뭉개지지 않고, 햄스터 바닥 센서가 안정적으로 읽는다.
- 맑은 고딕을 PDF 안에 심는다(서브셋). 인쇄소 컴퓨터에 폰트가 없어도 안 깨진다.

그리기는 draw_mat(c)에 모여 있다. B4 타일 버전(make_tiles_b4.py)이 이 함수를
잘라 쓰기 때문에, 도안을 고칠 때는 여기만 고치면 양쪽에 같이 반영된다.
"""
import math
import os

from reportlab.lib.colors import CMYKColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas

# ── 수치 (make_mat.py와 동일) ────────────────────────────────────
W, H = 1189.0, 841.0        # A0 가로
CX, CY = 420.0, 420.0

R_OUT = 285.0
R_IN = 190.0
R_PAD = 95.0                # 발사대 중심 = 로켓 주차 위치 (0도 방향에 고정)
R_DIAL = 48.0               # 발사각 각도판(발사대 둘레 반원) 반지름
LINE_W = 20.0

ROBOT_HALF = 40.0

R_STAR = 42.0
R_TICK0 = 340.0
R_TICK_S = 356.0
R_TICK_L = 366.0
R_NUM = 387.0

PANEL_X = 880.0

R_INK = 396.0               # 궤도 도안의 실제 잉크 반경 (측정값). 타일 영역 계산에 쓴다.

# ── 색 (CMYK) ────────────────────────────────────────────────────
INK = CMYKColor(0, 0, 0, 1)                 # 궤도 선·눈금: 순수 먹 1도
BLUE = CMYKColor(0.82, 0.43, 0, 0.34)       # #1f5fa8
RED = CMYKColor(0, 0.70, 0.78, 0.25)        # #c0392b
ORANGE = CMYKColor(0, 0.45, 0.86, 0.12)     # #e07b1f
GRAY = CMYKColor(0.08, 0.05, 0, 0.41)       # #8a8f96
STAR = CMYKColor(0, 0.58, 0.82, 0.09)       # #e8622a
GLOW = CMYKColor(0, 0.30, 0.72, 0)          # #ffb347
LAUNCH = CMYKColor(0, 0.13, 0.27, 0.03)     # #f6d5b4 (연해야 센서가 흰 바닥으로 읽는다)
RULE = CMYKColor(0.03, 0.02, 0, 0.11)       # #dcdfe3
TEXT = CMYKColor(0, 0, 0, 0.93)             # #111111
TEXT2 = CMYKColor(0, 0, 0, 0.80)            # #333333
WHITE = CMYKColor(0, 0, 0, 0)

REG, BOLD = 'MalgunGothic', 'MalgunGothic-Bold'
FONTS = [(REG, r'C:\Windows\Fonts\malgun.ttf'),
         (BOLD, r'C:\Windows\Fonts\malgunbd.ttf')]

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'orbit-mat-a0.pdf')


def register_fonts():
    for name, path in FONTS:
        if not os.path.exists(path):
            raise SystemExit('폰트를 찾을 수 없다: %s' % path)
        pdfmetrics.registerFont(TTFont(name, path))


def pt(theta_deg, r):
    """눈금값 theta(도) 위치. 0도 = 3시, 값이 커지면 시계방향(=진행 방향의 반대).

    SVG와 같은 식을 쓰되 y만 뒤집는다(PDF는 원점이 왼쪽 아래).
    """
    t = math.radians(theta_deg)
    return CX + r * math.cos(t), H - (CY + r * math.sin(t))


def Y(y_svg):
    return H - y_svg


def draw_mat(c, orbit=True, panel=True):
    """A0 매트를 그린다.

    c는 이미 mm 단위로 scale 되어 있고 원점이 A0 왼쪽 아래여야 한다.
    orbit/panel로 궤도부와 오른쪽 안내 패널을 따로 끌 수 있다 (타일 버전에서 쓴다).
    """

    def text(x, y_svg, s, size, color, font=REG, anchor='start'):
        c.setFont(font, size)
        c.setFillColor(color)
        {'start': c.drawString, 'middle': c.drawCentredString}[anchor](x, Y(y_svg), s)

    def poly(points, color):
        c.setFillColor(color)
        p = c.beginPath()
        p.moveTo(*points[0])
        for q in points[1:]:
            p.lineTo(*q)
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    # ── 배경 ─────────────────────────────────────────────────────
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, stroke=0, fill=1)

    if orbit:
        # ── 중심별 (프록시마) ────────────────────────────────────
        # SVG의 radialGradient는 PDF에서 동심원 겹치기로 근사한다.
        # 바깥에서 안으로 같은 투명도를 겹치면 누적 불투명도가 1-(1-a)^n 으로
        # 매끄럽게 오른다. 중심에서 0.55가 되도록 a를 역산했다.
        sx, sy = CX, Y(CY)
        RINGS = 40
        ring_alpha = 1.0 - (1.0 - 0.55) ** (1.0 / RINGS)
        c.setFillColor(GLOW)
        c.setFillAlpha(ring_alpha)
        for i in range(RINGS, 0, -1):
            c.circle(sx, sy, R_STAR * 1.35 * (i / float(RINGS)), stroke=0, fill=1)
        c.setFillAlpha(1)
        c.setFillColor(STAR)
        c.circle(sx, sy, R_STAR, stroke=0, fill=1)
        text(CX, CY + 7, '프록시마', 17, WHITE, BOLD, 'middle')

        # ── 궤도 선 (K100) ───────────────────────────────────────
        c.setStrokeColor(INK)
        c.setLineWidth(LINE_W)
        c.circle(sx, sy, R_IN, stroke=1, fill=0)
        c.circle(sx, sy, R_OUT, stroke=1, fill=0)

        # ── 발사대 + 발사각 각도판 ───────────────────────────────
        # 로켓은 언제나 이 발사대에서 출발한다. 둘레의 반원 각도판(각도기와
        # 같은 0~180, 정면이 90)으로 로켓 머리 방향 = 발사각을 정한다.
        # 정면(90)으로 쏘면 발사선을 따라 기준선 0°에 도착한다.
        px, py = pt(0, R_PAD)   # PDF 좌표 (y 위로 증가)

        def dial_pt(p_deg, r):
            """각도판 위 점. p=0 이 아래(진행 눈금이 커지는 쪽), 90이 정면(바깥), 180이 위."""
            t = math.radians(p_deg)
            return px + r * math.sin(t), py - r * math.cos(t)

        # 발사선 (정면 90도 경로 안내, 반지름 방향 점선)
        # 내행성 로봇이 이 선을 밟고 지나가므로 아주 연한 색으로 뽑는다.
        lx1, ly1 = pt(0, R_PAD + R_DIAL + 6)
        lx2, ly2 = pt(0, R_OUT - LINE_W / 2 - 4)
        c.saveState()
        c.setStrokeColor(LAUNCH)
        c.setLineWidth(6)
        c.setDash(16, 12)
        c.line(lx1, ly1, lx2, ly2)
        c.restoreState()

        # 각도판: 반원 호 + 지름 밑금 (로켓이 밟고 지나므로 전부 연한 색)
        c.setStrokeColor(LAUNCH)
        c.setLineWidth(2.5)
        arc = c.beginPath()
        arc.arc(px - R_DIAL, py - R_DIAL, px + R_DIAL, py + R_DIAL, -90, 180)
        c.drawPath(arc, stroke=1, fill=0)
        c.setLineWidth(1.5)
        bx0, by0 = dial_pt(0, R_DIAL)
        bx1, by1 = dial_pt(180, R_DIAL)
        c.line(bx0, by0, bx1, by1)

        for p in range(0, 181, 10):
            major = (p % 30 == 0)
            ax, ay = dial_pt(p, R_DIAL)
            bx, by = dial_pt(p, R_DIAL - (10 if major else 6))
            c.setLineWidth(2.5 if major else 1.8)
            c.line(ax, ay, bx, by)
            if major:
                nx, ny = dial_pt(p, R_DIAL - 16)
                c.setFont(BOLD, 8.5)
                c.setFillColor(ORANGE if p == 90 else GRAY)
                c.drawCentredString(nx, ny - 3, str(p))
                c.setStrokeColor(LAUNCH)

        c.setFont(BOLD, 13)
        c.setFillColor(ORANGE)
        c.drawCentredString(px - 6, py + R_DIAL + 5, '발사각')

        # 발사대 (로켓 주차 표시)
        c.setStrokeColor(ORANGE)
        c.setLineWidth(3.5)
        c.circle(px, py, 16, stroke=1, fill=0)
        poly([(px + 9, py), (px - 6, py + 7), (px - 6, py - 7)], ORANGE)
        c.setFont(BOLD, 14)
        c.setFillColor(ORANGE)
        c.drawCentredString(px, py - R_DIAL - 22, '발사대')

        # ── 진행 방향 화살표 (궤도 사이 빈 띠, 반시계) ───────────
        R_ARROW = R_IN - ROBOT_HALF - 22

        def arrow(theta, r, color):
            t = math.radians(theta)
            ax, ay = pt(theta, r)
            dx, dy = math.sin(t), math.cos(t)       # 눈금 감소 방향 (y 뒤집힘 반영)
            nx, ny = -dy, dx
            L, Wd = 17.0, 9.0
            poly([(ax + dx * L, ay + dy * L),
                  (ax - dx * 5 + nx * Wd, ay - dy * 5 + ny * Wd),
                  (ax - dx * 5 - nx * Wd, ay - dy * 5 - ny * Wd)], color)

        # 예전에는 화살표 안쪽에 '도는 방향' 글씨를 넣었지만, 그 자리가 발사각
        # 각도판과 겹치게 되어 화살표만 남겼다. 방향 설명은 오른쪽 패널에 있다.
        for th in (270, 90):
            arrow(th, R_ARROW, GRAY)

        # ── 눈금 (10도) ──────────────────────────────────────────
        c.setStrokeColor(INK)
        for deg in range(0, 360, 10):
            major = (deg % 30 == 0)
            ax, ay = pt(deg, R_TICK0)
            bx, by = pt(deg, R_TICK_L if major else R_TICK_S)
            c.setLineWidth(3.5 if major else 2)
            c.line(ax, ay, bx, by)
            if major:
                nx, ny = pt(deg, R_NUM)
                c.setFont(BOLD if deg == 0 else REG, 23)
                c.setFillColor(ORANGE if deg == 0 else INK)
                c.drawCentredString(nx, ny - 8, str(deg))
                c.setStrokeColor(INK)

        # ── 0도 기준선 강조 ──────────────────────────────────────
        # 예전에는 여기가 유일한 '도착 지점'이었다. 이제 도착 눈금은 발사각을
        # 따라 움직이므로, 정면(90°) 발사의 도착점이자 눈금의 0점 표시로만 남긴다.
        tx, ty = pt(0, R_TICK0 - 4)
        poly([(tx, ty), (tx + 24, ty + 14), (tx + 24, ty - 14)], ORANGE)
        nx, ny = pt(0, R_NUM)
        c.setFont(BOLD, 19)
        c.setFillColor(ORANGE)
        # 글자가 한 자 늘어 오른쪽 잉크 경계(타일 분할이 실측해 둔 값)를 넘지 않도록
        # 예전보다 왼쪽으로 당겨 놓는다.
        c.drawCentredString(nx - 30, ny + 30, '기준선 0°')

    if panel:
        # ── 오른쪽 안내 패널 ─────────────────────────────────────
        c.setStrokeColor(RULE)
        c.setLineWidth(2)
        c.line(PANEL_X - 30, Y(60), PANEL_X - 30, Y(H - 60))

        state = {'y': 96.0}
        text(PANEL_X, state['y'], 'PROXIMA RESCUE', 27, TEXT, BOLD)
        state['y'] += 32
        text(PANEL_X, state['y'], '궤도 매트 · ORBIT MAT', 21, GRAY)

        LH = 22.0

        def block(title, color, lines, gap=32.0):
            state['y'] += gap
            text(PANEL_X, state['y'], title, 20, color, BOLD)
            for ln in lines:
                state['y'] += LH
                text(PANEL_X, state['y'], ln, 16, TEXT2)

        block('궤도 안내', TEXT2, [], gap=44)
        for col, label in [(BLUE, '안쪽 궤도 — 내행성 (본부)'),
                           (RED, '바깥 궤도 — 외행성 (조난자)'),
                           (ORANGE, '발사대 · 발사각 각도판 · 기준선')]:
            state['y'] += LH
            c.setFillColor(col)
            c.circle(PANEL_X + 7, Y(state['y'] - 5), 7, stroke=0, fill=1)
            text(PANEL_X + 22, state['y'], label, 16, TEXT2)

        block('눈금 읽는 법', RED, ['바깥 눈금 = 조난자 위치.',
                                    '0°에서 진행 방향의 반대로 커집니다.',
                                    '조난자가 40에 있으면 기준선보다',
                                    '40도 뒤에 있다는 뜻입니다.'])

        block('발사각 각도판', ORANGE, ['발사대 둘레 반원 = 로켓 머리 방향.',
                                        '정면이 90°, 정면으로 쏘면',
                                        '기준선 0°에 도착합니다.',
                                        '방향을 바꾸면 시험 발사로 확인.'])

        block('발사 계산', BLUE, ['① 360 ÷ 외행성 주기(초) = 초당 각도',
                                  '② 초당 각도 × 로켓 비행 시간',
                                  '      = 리드 각도',
                                  '③ 조난자가 [도착 눈금 + 리드 각도]',
                                  '      눈금에 왔을 때 발사'])

        block('시작 전 확인', ORANGE, ['· 로켓은 발사대에, 머리는 각도판',
                                       '   눈금에 맞춰 놓기',
                                       '· 같은 속도 기준 외행성 30초 /',
                                       '   내행성 20초 / 로켓 3초'])

        text(PANEL_X, H - 70, 'A0 1189 × 841 mm', 15, GRAY)
        text(PANEL_X, H - 48, '궤도선 검정 K100 · 폭 20 mm', 15, GRAY)
        text(PANEL_X, H - 26, '무광 인쇄 (광택 코팅 금지)', 15, GRAY)


def main():
    register_fonts()
    c = pdfcanvas.Canvas(OUT, pagesize=(W * mm, H * mm))
    c.setTitle('PROXIMA RESCUE - 궤도 매트 A0')
    c.setAuthor('Alpha Centauri')
    c.scale(mm, mm)   # 이후 좌표는 전부 mm
    draw_mat(c)
    c.showPage()
    c.save()

    print('written: %s (%.0f KB)' % (OUT, os.path.getsize(OUT) / 1024.0))
    print('실제 크기 %.0f × %.0f mm / 궤도 바깥 지름 %.0f mm (로봇 몸통 포함 %.0f mm)'
          % (W, H, 2 * R_OUT, 2 * (R_OUT + ROBOT_HALF)))


if __name__ == '__main__':
    main()
