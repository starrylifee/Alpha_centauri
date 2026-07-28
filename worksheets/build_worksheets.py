# -*- coding: utf-8 -*-
"""학생활동지(hwpx)를 웹앱 내용에 맞춰 고쳐 worksheets/ 에 새로 만든다.

원본은 OneDrive에 그대로 두고 건드리지 않는다. 여기서는 원본 zip을 열어
Contents/section0.xml 의 문장만 갈아끼우고, 삽화 PNG는 배치 크기에 맞는
해상도(300dpi)로 줄여 다시 압축한다.

왜 고치는가 — 2026-07-28 첫 수업 뒤 웹앱이 바뀌었다.
- 미션 3에서 촬영 시간 24시간과 각도 30°는 이제 학생이 구하는 답이다.
  학습지가 둘 다 본문에서 알려주고 있어 문제가 성립하지 않았다.
- A0 매트에 발사각 각도판이 생겨 '도착 지점'이 발사각을 따라 움직인다.
- 외행성 주기 예시(18초)가 매트 안내(30초)와 어긋나 있었다.

실행: python worksheets/build_worksheets.py
"""
import io
import os
import re
import zipfile

from PIL import Image

SRC_DIR = (r'C:\Users\forin\OneDrive - 서울신답초등학교\2025 공모 서류'
           r'\(선정)융합과학교육원 영재프로그램')
HERE = os.path.dirname(os.path.abspath(__file__))

TEACHER = '(과학_동부분원_6_정용석)_학생활동지(교사용_정답까지).hwpx'
STUDENT = '(과학_동부분원_6_정용석)_학생활동지(학생용).hwpx'

# 삽화가 문서에 배치된 폭(mm). 300dpi로 인쇄할 때 필요한 픽셀 수를 여기서 역산한다.
# image1(교육원 로고)은 10mm 배치라 300dpi로 잡으면 118px까지 떨어진다.
# 원래 0.1MB뿐이라 줄일 실익이 없어 목록에서 뺐다.
PLACED_MM = {'image2': 150.0, 'image3': 150.0,
             'image4': 150.0, 'image5': 92.3, 'image6': 150.0}
DPI = 300


# ── 문장 교체 ────────────────────────────────────────────────────
# (핵심어, 새 문장) — 핵심어가 들어 있는 <hp:t> 하나를 통째로 갈아끼운다.
# 원문에 홑따옴표가 유니코드('')로 들어 있어 부분 매칭이 안전하다.

COMMON = [
    # 미션 3 도입 — 촬영 시간을 미리 알려주던 문장
    ('노출 시간(촬영 시간)이 무려',
     '  조난 대원으로부터 암호화된 이미지 파일이 전송되었습니다. 그런데 파일이 손상되어 '
     '촬영 시간 정보가 지워졌습니다. 별이 움직인 각도를 재서 촬영 시간을 거꾸로 구하고, '
     '조난자의 위치와 행성의 환경을 파악하십시오.'),

    # 발사각이 생겼으므로 '도착 지점' 기준을 바꾼다
    ('조난자가 있는 외행성은 도착 지점보다 몇 도 뒤에',
     '긴급 지령: ‘우리가 로켓을 쏠 때, 조난자가 있는 외행성은 우리가 정한 발사각보다 '
     '몇 도 뒤에 있어야 하는가?’ 이 각도를 정확히 계산하여 구조 알고리즘에 입력하십시오.'),

    ('외행성(조난자)은 도착 지점보다 몇 도 뒤에 있어야 할까요',
     '로켓이 발사 원에서 외행성 궤도까지 날아가는 데 걸리는 시간이 3초라고 가정합니다. '
     '발사 원의 눈금 하나를 골라 발사각으로 정하면, 로켓은 바깥 궤도의 같은 눈금에 도착합니다. '
     '우리가 로켓을 쏠 때, 외행성(조난자)은 그 발사각보다 몇 도 뒤에 있어야 할까요?'),

    # 미션 번호가 3 다음에 다시 2로 돌아가 있었다
    ('미션 2. 분석 요원(학생)은 시뮬레이션 구역',
     '미션 4. 분석 요원(학생)은 시뮬레이션 구역(바닥 표시 지점)에 위치하십시오.'),

    # Time Attack 기록표 → 발사각·발사 시각 기록표
    # (힌트 수와 소요 시간은 웹앱이 자동으로 세므로 종이에서는 뺀다)
    ('시도 횟수', '시도'),
    ('힌트 사용 여부(-5점/개)', '발사각 (°)'),
    ('성공/실패', '발사 때 조난자 눈금 (°)'),
    ('소요 시간', '성공 / 실패'),
]

# 부분 문자열만 바꾸는 것들
COMMON_PART = [
    ('태블릿으로 [웹앱', '모둠 노트북으로 [웹앱'),
    ('[     ] 사용 (개)', '(               )'),
    ('(힌트 사용 시 감점)', '(힌트를 쓰면 웹앱에서 자동으로 감점됩니다)'),
]

# 교사용에만 있는 문장 (학생용은 해당 표가 통째로 비어 있다)
TEACHER_ONLY = [
    ('지구였다면 24시간 동안 별이 한 바퀴',
     '지구였다면 하루 만에 별이 한 바퀴(360°)를 돕니다. '
     '그런데 이 행성의 하루는 12일, 곧 288시간입니다.'),

    ('하지만 전송된 사진 속 별들은 고작',
     '(1) 웹앱 각도기로 잰 별의 이동 각도 = ( 30 )°     '
     '(2) 촬영 시간 = 288 ÷ 12 = ( 24 )시간'),

    ('달처럼 공전과 자전이 같다',
     '달처럼 공전과 자전이 같다. ※ 계산할 때는 12일(288시간)로 어림한다.'),

    # 외행성 주기 예시를 A0 매트 안내(외행성 30초)와 맞춘다
    ('360° ÷ ( 18 )', '360° ÷ ( 30 ) = ( 12 )°/sec'),
    ('20° × 3초', '12° × 3초 = (          )°'),
    ('로켓 도착 예정 지점보다 외행성이',
     '결론 (발사 타이밍): 내가 정한 발사각보다 외행성이 ( 36 )도 뒤에 있을 때 발사해야 한다.'),

    ('측정된 고도(각도): ( 30 ) 도',
     '측정된 고도(각도): ( 30 ) 도   ※ 웹앱 정답 범위는 북위 30~60°'),
]


def replace_whole_t(xml, keyword, new_text):
    """keyword 가 들어 있는 <hp:t> 하나의 내용을 통째로 바꾼다."""
    pat = re.compile(r'<hp:t>([^<]*' + re.escape(keyword) + r'[^<]*)</hp:t>')
    m = pat.search(xml)
    if not m:
        return xml, False
    return xml[:m.start()] + '<hp:t>' + new_text + '</hp:t>' + xml[m.end():], True


def shrink_png(name, data):
    """배치 크기 기준 300dpi를 넘는 삽화만 줄인다."""
    key = os.path.splitext(os.path.basename(name))[0]
    mm = PLACED_MM.get(key)
    if mm is None:
        return data, None
    need = int(round(mm / 25.4 * DPI))
    im = Image.open(io.BytesIO(data))
    if im.size[0] <= need:
        return data, None
    r = need / float(im.size[0])
    im = im.resize((need, max(1, int(round(im.size[1] * r)))), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    return buf.getvalue(), im.size


def build(src_name, out_name, rules, part_rules):
    src = os.path.join(SRC_DIR, src_name)
    out = os.path.join(HERE, out_name)
    zin = zipfile.ZipFile(src)

    missed = []
    before = after = 0

    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            before += len(data)

            if item.filename == 'Contents/section0.xml':
                s = data.decode('utf-8')
                for kw, new in rules:
                    s, ok = replace_whole_t(s, kw, new)
                    if not ok:
                        missed.append(kw)
                for old, new in part_rules:
                    if old in s:
                        s = s.replace(old, new)
                    else:
                        missed.append(old)
                data = s.encode('utf-8')

            elif item.filename.startswith('BinData/'):
                data, newsize = shrink_png(item.filename, data)
                if newsize:
                    print('   %-20s -> %dx%d  %.1f MB'
                          % (item.filename, newsize[0], newsize[1], len(data) / 1048576.0))

            after += len(data)
            zi = zipfile.ZipInfo(item.filename, date_time=item.date_time)
            # mimetype 은 무압축이어야 한글이 확실히 인식한다
            zi.compress_type = (zipfile.ZIP_STORED if item.filename == 'mimetype'
                                else zipfile.ZIP_DEFLATED)
            zout.writestr(zi, data)

    print('   원본 %.1f MB -> %.1f MB (%s)'
          % (before / 1048576.0, after / 1048576.0, out_name))
    if missed:
        print('   [경고] 못 찾은 문장 %d개:' % len(missed))
        for m in missed:
            print('      - %s' % m[:50])
    return missed


def main():
    print('교사용')
    m1 = build(TEACHER, '학생활동지(교사용_정답).hwpx',
               COMMON + TEACHER_ONLY, COMMON_PART)
    print('학생용')
    m2 = build(STUDENT, '학생활동지(학생용).hwpx', COMMON, COMMON_PART)
    print('\n완료. 못 찾은 문장 교사용 %d / 학생용 %d' % (len(m1), len(m2)))


if __name__ == '__main__':
    main()
