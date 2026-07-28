# -*- coding: utf-8 -*-
"""A0 궤도 매트 도안 생성 (SVG)

설계 원칙
- 검정(K100) 요소는 '궤도 선 2개'와 '눈금·숫자'뿐이다. 눈금은 로봇이 지나가지 않는 반경에 둔다.
- 로봇 몸통이 지나는 띠(선 중심 ±40mm) 안에는 검은 인쇄물을 절대 넣지 않는다.
- 그 외 장식(중심별, 발사대, 화살표)은 전부 컬러라 바닥 센서가 선으로 읽지 않는다.
"""
import io
import math

W, H = 1189.0, 841.0        # A0 가로
CX, CY = 420.0, 420.0       # 궤도 중심 (왼쪽 정사각 영역)

# 반경은 로봇 몸통 폭에서 역산했다. 세 로봇(로켓 주차 / 내행성 / 외행성)이 서로
# 15mm 이상 떨어지도록 잡았고, 바깥 궤도는 A0 높이(841mm)가 허용하는 한계치다.
ROBOT_HALF = 40.0           # 로봇 몸통 절반 폭 (햄스터 실측보다 넉넉하게)
CLEAR = 15.0                # 로봇끼리 최소 간격

R_OUT = 285.0               # 바깥 궤도(외행성) 선 중심
R_IN = 190.0                # 안쪽 궤도(내행성) 선 중심
R_PAD = 95.0                # 발사 원 = 로켓을 놓는 자리 (원 위 아무 각도나 가능)
R_PAD_NUM = 72.0            # 발사각 숫자 (중심별 글로우 56.7과 발사 원 95 사이)
LINE_W = 20.0               # 궤도 선 폭 (햄스터 바닥 센서용)

R_STAR = 42.0               # 중심별
R_TICK0 = 340.0             # 눈금 시작 (바깥 로봇 몸통 끝 325보다 바깥)
R_TICK_S = 356.0
R_TICK_L = 366.0
R_NUM = 387.0

PANEL_X = 880.0
PANEL_W = 269.0

FONT = "'Malgun Gothic','맑은 고딕','Noto Sans KR',sans-serif"

INK = "#111111"     # 궤도 선 (K100)
BLUE = "#1f5fa8"    # 내행성 / 본부
RED = "#c0392b"     # 외행성 / 조난자
ORANGE = "#e07b1f"  # 로켓 / 중심별
GRAY = "#8a8f96"
LAUNCH = "#f6d5b4"  # 발사 원·눈금·방향선 (연해야 바닥 센서가 흰 바닥으로 읽는다)


def pt(theta_deg, r):
    """눈금값 theta(도) 위치. 0도 = 3시, 값이 커지면 시계방향(=진행 방향의 반대)."""
    t = math.radians(theta_deg)
    return CX + r * math.cos(t), CY + r * math.sin(t)


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


out = []
A = out.append

A(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" '
  f'viewBox="0 0 {W:.0f} {H:.0f}">')
A('<defs>')
A('<radialGradient id="starGlow">'
  '<stop offset="0%" stop-color="#ffb347" stop-opacity="0.55"/>'
  '<stop offset="100%" stop-color="#ffb347" stop-opacity="0"/>'
  '</radialGradient>')
A('</defs>')

# 배경 (라인트레이싱은 흰 바탕 + 검은 선이 기본)
A(f'<rect x="0" y="0" width="{W:.0f}" height="{H:.0f}" fill="#ffffff"/>')

# ── 중심별 (프록시마) ────────────────────────────────────────────
A(f'<circle cx="{CX}" cy="{CY}" r="{R_STAR*1.35:.1f}" fill="url(#starGlow)"/>')
A(f'<circle cx="{CX}" cy="{CY}" r="{R_STAR}" fill="#e8622a"/>')
A(f'<text x="{CX}" y="{CY+7:.0f}" font-family="{FONT}" font-size="17" fill="#ffffff" '
  f'text-anchor="middle" font-weight="bold">프록시마</text>')

# ── 궤도 선 (검정 K100) ──────────────────────────────────────────
A(f'<circle cx="{CX}" cy="{CY}" r="{R_IN}" fill="none" stroke="{INK}" stroke-width="{LINE_W}"/>')
A(f'<circle cx="{CX}" cy="{CY}" r="{R_OUT}" fill="none" stroke="{INK}" stroke-width="{LINE_W}"/>')

# ── 발사 원 + 발사각 각도판 ──────────────────────────────────────
# 발사대를 0도에 고정하지 않는다. 이 원 위 아무 눈금에나 로켓을 놓고 쏘면
# 바깥 궤도의 같은 눈금에 도착하므로, 학생이 발사각을 직접 고를 수 있다.
# 로켓이 출발하며 눈금선을 밟고 지나가므로 선은 전부 연한 색으로 뽑는다.
A(f'<circle cx="{CX}" cy="{CY}" r="{R_PAD}" fill="none" stroke="{LAUNCH}" stroke-width="2"/>')

for deg in range(0, 360, 10):
    major = (deg % 30 == 0)
    d = 12 if major else 6
    x1, y1 = pt(deg, R_PAD - d)
    x2, y2 = pt(deg, R_PAD + d)
    A(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
      f'stroke="{LAUNCH}" stroke-width="{3 if major else 2}"/>')
    if major:
        nx, ny = pt(deg, R_PAD_NUM)
        c = ORANGE if deg == 0 else GRAY
        A(f'<text x="{nx:.1f}" y="{ny+5:.1f}" font-family="{FONT}" font-size="15" '
          f'fill="{c}" text-anchor="middle" font-weight="bold">{deg}</text>')

# ── 진행 방향 화살표 (궤도 사이 빈 띠, 반시계) ───────────────────
def arrow(theta, r, color):
    """theta 위치에서 '진행 방향'(눈금 감소 = 반시계)을 가리키는 삼각형."""
    t = math.radians(theta)
    cx, cy = pt(theta, r)
    dx, dy = math.sin(t), -math.cos(t)      # 눈금 감소 방향
    nx, ny = -dy, dx
    L, Wd = 17.0, 9.0
    p1 = (cx + dx * L, cy + dy * L)
    p2 = (cx - dx * 5 + nx * Wd, cy - dy * 5 + ny * Wd)
    p3 = (cx - dx * 5 - nx * Wd, cy - dy * 5 - ny * Wd)
    A(f'<polygon points="{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} '
      f'{p3[0]:.1f},{p3[1]:.1f}" fill="{color}"/>')

# 두 궤도가 같은 방향으로 도므로 안쪽 빈 공간에 한 쌍만 둔다.
# 예전에는 화살표 안쪽에 '도는 방향' 글씨를 넣었지만, 그 자리가 발사각 각도판과
# 겹치게 되어 화살표만 남겼다. 방향 설명은 오른쪽 패널에 있다.
R_ARROW = R_IN - ROBOT_HALF - 22
for th in (270, 90):
    arrow(th, R_ARROW, GRAY)

# ── 눈금 (10도) ──────────────────────────────────────────────────
for deg in range(0, 360, 10):
    major = (deg % 30 == 0)
    r_end = R_TICK_L if major else R_TICK_S
    ax, ay = pt(deg, R_TICK0)
    bx, by = pt(deg, r_end)
    A(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" '
      f'stroke="{INK}" stroke-width="{3.5 if major else 2}"/>')
    if major:
        nx, ny = pt(deg, R_NUM)
        c = ORANGE if deg == 0 else INK
        w = 'bold' if deg == 0 else 'normal'
        A(f'<text x="{nx:.1f}" y="{ny+8:.1f}" font-family="{FONT}" font-size="23" '
          f'fill="{c}" font-weight="{w}" text-anchor="middle">{deg}</text>')

# ── 0도 기준선 강조 ──────────────────────────────────────────────
# 예전에는 여기가 유일한 '도착 지점'이었다. 이제 도착 지점은 발사각을 따라가므로
# 두 눈금(바깥·발사 원)이 함께 0에서 출발한다는 표시로만 남긴다.
# 바깥 로봇이 지나는 띠(R_OUT ± 40) 밖에만 표시한다.
tx, ty = pt(0, R_TICK0 - 4)
A(f'<polygon points="{tx:.1f},{ty:.1f} {tx+24:.1f},{ty-14:.1f} {tx+24:.1f},{ty+14:.1f}" fill="{ORANGE}"/>')
nx, ny = pt(0, R_NUM)
A(f'<text x="{nx-30:.1f}" y="{ny-30:.1f}" font-family="{FONT}" font-size="19" fill="{ORANGE}" '
  f'text-anchor="middle" font-weight="bold">기준선 0°</text>')

# ── 오른쪽 안내 패널 ─────────────────────────────────────────────
A(f'<line x1="{PANEL_X-30:.0f}" y1="60" x2="{PANEL_X-30:.0f}" y2="{H-60:.0f}" '
  f'stroke="#dcdfe3" stroke-width="2"/>')

y = 96.0
A(f'<text x="{PANEL_X}" y="{y}" font-family="{FONT}" font-size="27" fill="#111" '
  f'font-weight="bold">PROXIMA RESCUE</text>')
y += 32
A(f'<text x="{PANEL_X}" y="{y}" font-family="{FONT}" font-size="21" fill="{GRAY}">궤도 매트 · ORBIT MAT</text>')

LH = 22.0   # 줄 간격


def block(title, color, lines, gap=36.0):
    global y
    y += gap
    A(f'<text x="{PANEL_X}" y="{y}" font-family="{FONT}" font-size="20" fill="{color}" '
      f'font-weight="bold">{esc(title)}</text>')
    for ln in lines:
        y += LH
        A(f'<text x="{PANEL_X}" y="{y}" font-family="{FONT}" font-size="16" '
          f'fill="#333">{esc(ln)}</text>')


block('궤도 안내', '#333', [], gap=48)
for i, (c, label) in enumerate([(BLUE, '안쪽 궤도 — 내행성 (본부)'),
                                (RED, '바깥 궤도 — 외행성 (조난자)'),
                                (ORANGE, '가운데 발사 원 — 로켓 발사각')]):
    y += LH
    A(f'<circle cx="{PANEL_X+7:.0f}" cy="{y-5:.0f}" r="7" fill="{c}"/>')
    A(f'<text x="{PANEL_X+22:.0f}" y="{y:.0f}" font-family="{FONT}" font-size="16" '
      f'fill="#333">{esc(label)}</text>')

block('눈금 읽는 법', RED, ['눈금 두 개가 같은 각도를 씁니다.',
                            '· 바깥 눈금 = 조난자 위치',
                            '· 발사 원 눈금 = 로켓 발사각',
                            '눈금은 0°에서 진행 방향의 반대로',
                            '커집니다. 40°에 놓고 쏜 로켓은',
                            '바깥 궤도 40°에 도착합니다.'])

block('발사 계산', BLUE, ['① 360 ÷ 외행성 주기(초)',
                          '      = 초당 각도',
                          '② 초당 각도 × 로켓 비행 시간',
                          '      = 리드 각도',
                          '③ 발사각을 하나 고른다 (예: 40°)',
                          '④ 조난자가 [발사각 + 리드 각도]',
                          '      눈금에 왔을 때 발사'])

block('시작 전 확인', ORANGE, ['· 로켓은 발사 원 눈금에 맞춰 놓고',
                               '   머리를 바깥쪽으로',
                               '· 같은 속도 기준 외행성 30초 /',
                               '   내행성 20초 / 로켓 3초',
                               '· 내행성과 부딪힐 것 같으면 한 박자'])

A(f'<text x="{PANEL_X}" y="{H-70:.0f}" font-family="{FONT}" font-size="15" fill="{GRAY}">'
  f'A0 1189 × 841 mm</text>')
A(f'<text x="{PANEL_X}" y="{H-48:.0f}" font-family="{FONT}" font-size="15" fill="{GRAY}">'
  f'궤도선 검정 K100 · 폭 20 mm</text>')
A(f'<text x="{PANEL_X}" y="{H-26:.0f}" font-family="{FONT}" font-size="15" fill="{GRAY}">'
  f'무광 인쇄 (광택 코팅 금지)</text>')

A('</svg>')

path = r'C:\Project_Codes\20251130 Alpha Centauri\print\orbit-mat-a0.svg'
io.open(path, 'w', encoding='utf-8').write('\n'.join(out))
print('written:', path)

# 참고 수치 출력
print('안쪽 둘레 %.0fmm / 바깥 둘레 %.0fmm / 로켓 비행 %.0fmm'
      % (2 * math.pi * R_IN, 2 * math.pi * R_OUT, R_OUT - R_PAD))
