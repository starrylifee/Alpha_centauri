# -*- coding: utf-8 -*-
"""스테이지 4 삽화(assets/images/orbit-activity.jpg) 생성

확정 매트 도안(orbit-mat-a0.pdf)을 그대로 렌더한 바탕 위에 햄스터 로봇 3대를 올린다.
눈금·각도판은 AI 그림에 맡기지 않고 도안을 그대로 쓰므로 매트와 어긋날 일이 없다.
로봇 그림(robots_green.png)은 Codex 이미지 도구로 만든 탑뷰 렌더이고 초록 배경을
크로마키로 뗀다. 도안이 바뀌면 이 스크립트를 다시 돌리면 된다.

    python print/make_activity_image.py
    → assets/images/orbit-activity.jpg (웹)  /  print/orbit-activity.png (활동지용 원본)

같은 그림이 학생활동지 hwpx의 image6 자리에도 들어간다 (worksheets/build_worksheets.py).
"""
import math
import os

import fitz
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MAT_PDF = os.path.join(HERE, 'orbit-mat-a0.pdf')
ROBOTS = os.path.join(HERE, 'robots_green.png')
OUT_PNG = os.path.join(HERE, 'orbit-activity.png')
OUT_JPG = os.path.join(ROOT, 'assets', 'images', 'orbit-activity.jpg')

DPI = 100
PX = DPI / 25.4                  # px per mm

# 매트 수치 (make_mat_pdf.py와 같다)
CX, CY = 420.0, 841.0 - 420.0    # 렌더 이미지(왼쪽 위 원점) 기준 중심
R_OUT, R_IN, R_PAD = 285.0, 190.0, 95.0
ROBOT_MM = 80.0                  # 로봇 폭 (ROBOT_HALF 40 × 2)

CROP_MM = (8.0, 12.0, 838.0, 830.0)   # 오른쪽 안내 패널은 잘라낸다
OUT_WIDTH = 1800

FONT_BOLD = r'C:\Windows\Fonts\malgunbd.ttf'
BLUE, RED, ORANGE = '#1f5fa8', '#c0392b', '#e07b1f'


def render_mat():
    doc = fitz.open(MAT_PDF)
    pix = doc[0].get_pixmap(dpi=DPI, alpha=False)
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)


def cut_robots():
    """초록 배경을 떼고 로봇 3대를 왼쪽부터 순서대로 돌려준다."""
    im = Image.open(ROBOTS).convert('RGB')
    a = np.asarray(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > 150) & (g > r + 60) & (g > b + 60)
    alpha = np.where(green, 0, 255).astype(np.uint8)

    # 가장자리 초록 번짐 제거: 초록 이웃이 있는 픽셀은 반투명 처리
    soft = alpha.copy()
    pad = np.pad(alpha, 1, constant_values=0)
    neigh = np.minimum.reduce([pad[:-2, 1:-1], pad[2:, 1:-1], pad[1:-1, :-2], pad[1:-1, 2:]])
    edge = (alpha == 255) & (neigh == 0)
    soft[edge] = 140
    rgba = np.dstack([a.astype(np.uint8), soft])
    # 가장자리 픽셀은 초록기가 남으므로 채도를 죽인다
    ec = rgba[edge][:, :3].astype(int)
    m = ec.mean(axis=1, keepdims=True)
    rgba[edge, :3] = np.clip((ec + m) // 2, 0, 255).astype(np.uint8)
    full = Image.fromarray(rgba, 'RGBA')

    # 세로로 투영해 로봇 구간 셋으로 나눈다
    cols = (alpha > 0).any(axis=0)
    spans, start = [], None
    for x, v in enumerate(cols):
        if v and start is None:
            start = x
        if not v and start is not None:
            spans.append((start, x)); start = None
    if start is not None:
        spans.append((start, len(cols)))
    spans = [s for s in spans if s[1] - s[0] > 50]
    assert len(spans) == 3, spans

    robots = []
    for x0, x1 in spans:
        sub = full.crop((x0, 0, x1, full.height))
        bbox = sub.getchannel('A').getbbox()
        robots.append(sub.crop(bbox))
    return robots          # [파랑, 빨강, 주황+로켓]


def place(canvas, robot, theta_deg, r_mm, heading_deg):
    """눈금 theta 위치(반지름 r)에 로봇을 놓는다. heading은 화면 시계방향 회전각."""
    w = int(round(ROBOT_MM * PX))
    rob = robot.resize((w, int(round(robot.height * w / robot.width))), Image.LANCZOS)
    rob = rob.rotate(-heading_deg, expand=True, resample=Image.BICUBIC)
    t = math.radians(theta_deg)
    x = (CX + r_mm * math.cos(t)) * PX
    y = (CY + r_mm * math.sin(t)) * PX
    canvas.alpha_composite(rob, (int(x - rob.width / 2), int(y - rob.height / 2)))
    return x, y


def label(draw, xy, text, color, anchor_dx, anchor_dy, size):
    font = ImageFont.truetype(FONT_BOLD, size)
    x, y = xy[0] + anchor_dx, xy[1] + anchor_dy
    # 흰 테두리로 매트 선과 겹쳐도 읽히게
    for dx in (-2, 0, 2):
        for dy in (-2, 0, 2):
            draw.text((x + dx, y + dy), text, font=font, fill='white', anchor='mm')
    draw.text((x, y), text, font=font, fill=color, anchor='mm')


def main():
    mat = render_mat().convert('RGBA')
    blue, red, orange = cut_robots()

    # 내행성(본부)은 안쪽 궤도 250° 근처, 조난자는 바깥 궤도 40° (안내 패널의 예시와 같다)
    # 진행 방향은 반시계(눈금이 줄어드는 쪽). 로봇 앞머리를 그 방향에 맞춘다.
    p_in = place(mat, blue, 250, R_IN, 250)
    p_out = place(mat, red, 40, R_OUT, 40)
    # 로켓은 발사대에서 정면(90°) = 화면 오른쪽을 본다
    p_rk = place(mat, orange, 0, R_PAD, 90)

    draw = ImageDraw.Draw(mat)
    fs = int(15 * PX)
    label(draw, p_in, '본부 (내행성)', BLUE, 0, -int(62 * PX), fs)
    label(draw, p_out, '조난자 (외행성)', RED, int(30 * PX), int(62 * PX), fs)
    label(draw, p_rk, '구조 로켓', ORANGE, 0, int(96 * PX), fs)   # '발사대' 글씨 아래

    x0, y0, x1, y1 = [int(v * PX) for v in CROP_MM]
    out = mat.crop((x0, y0, x1, y1)).convert('RGB')
    out = out.resize((OUT_WIDTH, int(round(out.height * OUT_WIDTH / out.width))), Image.LANCZOS)
    out.save(OUT_PNG, optimize=True)
    out.save(OUT_JPG, quality=88, optimize=True, progressive=True)
    print('written: %s %dx%d' % (OUT_JPG, out.width, out.height))
    print('         %s (%.0f KB)' % (OUT_PNG, os.path.getsize(OUT_PNG) / 1024.0))


if __name__ == '__main__':
    main()
