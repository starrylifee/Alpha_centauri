# -*- coding: utf-8 -*-
"""A0 매트를 뽑기 전에 선 폭을 확인하는 A4 테스트 시트 (2장)

A0는 한 번 뽑으면 되돌릴 수 없으니, 같은 조건(같은 선 폭·같은 곡률·같은 검정)을
A4에 100%로 뽑아서 햄스터가 실제로 따라가는지 먼저 본다.

1쪽 (세로) 직선 15 / 20 / 25 mm + 로봇 가로 재는 자
2쪽 (가로) 곡선 15 / 20 / 25 mm, 반경 285 mm = 바깥 궤도와 같은 휨

매트와 같은 규칙을 지킨다 — 검정 K100은 '로봇이 따라갈 선'에만 쓰고, 라벨·자·안내는
전부 컬러다. 그래야 바닥 센서가 안내 글씨를 선으로 착각하지 않는다.
"""
import os

from reportlab.lib.colors import CMYKColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas

R_OUT = 285.0           # 바깥 궤도 반경 (make_mat.py와 동일)
WIDTHS = [15.0, 20.0, 25.0]
MAT_W = 20.0            # 지금 매트에 들어간 값

INK = CMYKColor(0, 0, 0, 1)
ORANGE = CMYKColor(0, 0.45, 0.86, 0.12)
BLUE = CMYKColor(0.82, 0.43, 0, 0.34)
GRAY = CMYKColor(0.08, 0.05, 0, 0.41)
WHITE = CMYKColor(0, 0, 0, 0)

REG, BOLD = 'MalgunGothic', 'MalgunGothic-Bold'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'orbit-mat-test-a4.pdf')

for name, path in [(REG, r'C:\Windows\Fonts\malgun.ttf'),
                   (BOLD, r'C:\Windows\Fonts\malgunbd.ttf')]:
    if not os.path.exists(path):
        raise SystemExit('폰트를 찾을 수 없다: %s' % path)
    pdfmetrics.registerFont(TTFont(name, path))

c = pdfcanvas.Canvas(OUT)
c.setTitle('궤도 매트 선 폭 테스트 A4')


def text(x, y, s, size, color, font=REG, anchor='start'):
    c.setFont(font, size)
    c.setFillColor(color)
    {'start': c.drawString, 'middle': c.drawCentredString,
     'end': c.drawRightString}[anchor](x, y, s)


def ruler(x0, y0, length=120.0, color=ORANGE):
    """로봇 가로를 재는 자. 겸사겸사 인쇄 배율도 확인한다.

    검정을 쓰지 않는다 — 로봇이 근처를 지나도 선으로 읽지 않게.
    """
    c.setStrokeColor(color)
    c.setLineWidth(0.7)
    c.line(x0, y0, x0 + length, y0)
    for v in range(0, int(length) + 1, 5):
        major = (v % 10 == 0)
        c.setLineWidth(0.9 if major else 0.5)
        c.line(x0 + v, y0, x0 + v, y0 + (7 if major else 4))
        if v % 20 == 0:
            text(x0 + v, y0 - 6, str(v), 3.6, color, REG, 'middle')
    text(x0 + length + 4, y0 - 1, 'mm', 3.6, color)


# ══ 1쪽 (A4 세로) 직선 ═══════════════════════════════════════════
PW, PH = 210.0, 297.0
c.setPageSize((PW * mm, PH * mm))
c.scale(mm, mm)
c.setFillColor(WHITE)
c.rect(0, 0, PW, PH, stroke=0, fill=1)

text(20, PH - 20, '궤도 매트 선 폭 테스트  ①  직선', 7, INK, BOLD)
text(20, PH - 29, '반드시 100% (실제 크기)로 인쇄하세요. "용지에 맞춤"으로 뽑으면 폭이 틀어집니다.',
     4.2, GRAY)
text(20, PH - 35, '아래 자의 0~100 구간이 실제 자로 100mm면 배율이 맞습니다.', 4.2, GRAY)

LINE_Y0, LINE_Y1 = 60.0, 242.0          # 주행 구간 182mm
XS = [50.0, 105.0, 160.0]

c.setStrokeColor(INK)
c.setLineCap(0)
for x, w in zip(XS, WIDTHS):
    c.setLineWidth(w)
    c.line(x, LINE_Y0, x, LINE_Y1)

for x, w in zip(XS, WIDTHS):
    label = '%g mm' % w
    if w == MAT_W:
        text(x, LINE_Y1 + 13, '지금 매트', 4.2, ORANGE, BOLD, 'middle')
        text(x, LINE_Y1 + 5, label, 5.5, ORANGE, BOLD, 'middle')
    else:
        text(x, LINE_Y1 + 5, label, 5.5, BLUE, BOLD, 'middle')
    # 출발 표시 (선 아래, 컬러)
    text(x, LINE_Y0 - 10, '출발 ▲', 4.2, ORANGE, REG, 'middle')

text(20, 38, '로봇 가로 재기 — 바퀴까지 포함한 제일 넓은 곳을 재세요.', 4.2, GRAY)
ruler(50, 26)
text(20, 12, '· 60mm 이하면 A1로 줄일 수 있습니다   · 70mm 이상이면 지금 A0 도안 그대로',
     4.0, GRAY)
c.showPage()

# ══ 2쪽 (A4 가로) 곡선 ═══════════════════════════════════════════
PW, PH = 297.0, 210.0
c.setPageSize((PW * mm, PH * mm))
c.scale(mm, mm)
c.setFillColor(WHITE)
c.rect(0, 0, PW, PH, stroke=0, fill=1)

text(18, PH - 18, '궤도 매트 선 폭 테스트  ②  곡선 (반경 285mm = 바깥 궤도와 같은 휨)',
     7, INK, BOLD)
text(18, PH - 27, '직선은 되는데 곡선에서 이탈하는 경우가 있어 실제 궤도와 같은 곡률로 뽑았습니다.',
     4.2, GRAY)

CX_ARC = 178.0
TOPS = [170.0, 118.0, 66.0]     # 각 호의 꼭대기 y
HALF_CHORD = 110.0              # 호 가로폭 220mm
START, EXTENT = 67.3, 45.4      # 220mm 현에 해당하는 각도 (2·asin(110/285))
SAGITTA = R_OUT * (1 - 0.92264)  # 호 꼭대기와 양 끝의 높이차 = R(1-sin67.3°)

c.setStrokeColor(INK)
for y_top, w in zip(TOPS, WIDTHS):
    cy = y_top - R_OUT                      # 원 중심은 종이 한참 아래
    c.setLineWidth(w)
    p = c.beginPath()
    p.arc(CX_ARC - R_OUT, cy - R_OUT, CX_ARC + R_OUT, cy + R_OUT, START, EXTENT)
    c.drawPath(p, stroke=1, fill=0)

    # 라벨은 호 왼쪽 끝 높이에 맞춰 왼쪽 여백에 세로로 쌓는다 (호와 안 겹치게)
    y_left = y_top - SAGITTA
    if w == MAT_W:
        text(20, y_left + 10, '지금 매트', 4.2, ORANGE, BOLD)
        text(20, y_left + 2, '%g mm' % w, 5.5, ORANGE, BOLD)
    else:
        text(20, y_left + 2, '%g mm' % w, 5.5, BLUE, BOLD)
    text(20, y_left - 8, '출발 ▶', 4.2, ORANGE)

text(18, 20, '보는 법', 5, INK, BOLD)
text(18, 13, '· 세 폭 다 잘 따라가면 지금 20mm 그대로 A0를 뽑으면 됩니다.', 4.2, GRAY)
text(18, 7, '· 20mm에서 흔들리거나 곡선에서 빠지면 어느 폭이 제일 안정적이었는지 알려주세요.',
     4.2, GRAY)

c.showPage()
c.save()

print('written: %s (%.0f KB)' % (OUT, os.path.getsize(OUT) / 1024.0))
print('1쪽 직선 주행구간 %.0f mm / 2쪽 곡선 반경 %.0f mm · 가로폭 %.0f mm'
      % (LINE_Y1 - LINE_Y0, R_OUT, HALF_CHORD * 2))
