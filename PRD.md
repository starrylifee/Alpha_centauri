# [PRD] 프록시마 센타우리 : The Rescue - 수업 보조용 웹앱

## 1. 개요 (Project Overview)

* **프로젝트명:** Proxima Rescue Command (PRC)
* **목적:** 2026 영재 위탁 프로그램 '프록시마 센타우리' 수업의 몰입도를 극대화하기 위한 **방탈출 게임 형식의 진행 도구**.
* **사용 대상:** 초등학교 6학년 영재반 학생 (모둠별 사용)
* **핵심 컨셉:** 우주선 관제 센터(Mission Control) 인터페이스.
* **플랫폼:** 모바일(태블릿) 및 데스크탑 웹 브라우저 (Chrome 최적화).
* **기술 제약:** 별도의 서버 없이 브라우저 **LocalStorage**를 활용하여 데이터 저장 및 상태 유지.
* **구현 상태:** ✅ 완료

## 2. 사용자 시나리오 (User Flow)

수업 지도안의 흐름에 따라 선형적(Linear)으로 진행되며, 각 단계의 정답(Passcode)을 입력해야만 다음 단계가 활성화됨.

### #Step 0. 인트로 (Cinematic Intro)
1. **진입:** 앱 접속 시 '미션 브리핑 영상' 재생 버튼 클릭 또는 건너뛰기 가능.
2. **영상 내용:** AI 생성 영상 (`assets/video/intro.mp4`에 배치)
3. **액션:** 영상 종료 후 [작전 개시] 버튼 활성화 → 팀 이름 입력 → Step 1으로 이동.
* **구현 파일:** `index.html` (Step 0 섹션), `js/main.js` (인트로 로직)

### #Step 1. 보안 접속 (Security Access)
* **상황:** 구조대 시스템 접속을 위한 보안 퀴즈.
* **입력:** 사전 지식 3가지 질문에 대한 복합 정답.
    1. 행성 이름 (프록시마b)
    2. 별의 종류 (적색왜성)
    3. 지구와의 거리 (4.24)
* **조건:** 띄어쓰기 없이 모든 정답을 이어서 입력 시 승인.
* **정답 변경:** `js/validation.js`의 `validateStage1()` 함수 및 `config/answers.json` 수정
* **구현 파일:** `js/stages.js` (setupStage1), `js/validation.js` (validateStage1)

### #Step 2. 환경 분석 (Environment Analysis)
* **상황:** 행성의 환경 데이터를 보고 생존 가능 구역 추론.
* **제공 정보:** 공전/자전 주기 데이터, 조석 고정(Tidal Locking) 시각화 자료.
* **입력:** 생존 가능한 구역의 명칭.
* **정답 키워드:** `황혼`, `경계`, `Twilight`, `terminator` 중 하나 포함 시 정답 처리.
* **정답 변경:** `js/validation.js`의 `validateStage2()` 함수 및 `config/answers.json` 수정
* **구현 파일:** `js/stages.js` (setupStage2), `js/validation.js` (validateStage2)

### #Step 3. 좌표 추적 (Location Tracking)
* **상황:** 조난자가 보낸 별 궤적 사진(24시간 노출) 분석.
* **입력 1 (구역):** 낮 / 밤 / 황혼 중 선택 (정답: `밤의 지역`).
* **입력 2 (위도):** 별의 중심 고도 각도 입력 (정답: `45` ±2 오차 허용, 43~47).
* **기능:** 오답 시 힌트 사용 유도 (힌트 사용 시 감점 카운트).
* **정답 변경:** `js/validation.js`의 `validateStage3()` 함수 및 `config/answers.json` 수정
* **구현 파일:** `js/stages.js` (setupStage3), `js/validation.js` (validateStage3)

### #Step 4. 궤도 시뮬레이션 (Orbit Calculation)
* **상황:** 햄스터 로봇 발사 타이밍 계산 결과 입력.
* **입력:** 
    - 미션 성공/실패 선택
    - 성공 시: 발사 각도, 소요 시간 입력
* **정답:** 정답 검증 없음 - 학습자 입력 기반으로 기록만 저장
* **피드백:** 성공 시 축하 메시지, 실패 시 위로 메시지
* **구현 파일:** `js/stages.js` (setupStage4), `js/validation.js` (validateStage4)

### #Step 5. 미션 완료 (Mission Complete)
* **상황:** 실제 로봇 미션 성공 후 기록.
* **액션:** [최종 구조 성공] 버튼 클릭.
* **결과 화면:**
    * 총 소요 시간 (타이머 정지).
    * 힌트 사용 횟수 및 페널티 점수.
    * 최종 점수 리포트 (스크린샷 저장용).
* **구현 파일:** `js/stages.js` (setupStage5, showResult)

## 3. 기능 요구사항 (Functional Requirements)

### 3.1. 타이머 시스템 (Timer) ✅
* **Global Timer:** 앱 시작(Step 0 종료) 시점부터 카운트 업(Count-up).
* **표시:** 화면 상단에 `MM:SS` 형태로 상시 표시.
* **정지:** Step 5 완료 버튼 클릭 시 정지.
* **구현 파일:** `js/timer.js`

### 3.2. 정답 검증 및 보안 (Validation & Security) ✅
* **Client-Side Security:** 정답 문자열을 직접 코드에 넣지 않고 비교 로직으로 처리.
* **구현 방식:** 정규화된 문자열 비교, 키워드 포함 검사, 범위 체크 등
* **구현 파일:** `js/validation.js`

### 3.3. 데이터 저장 (Persistence) ✅
* **LocalStorage:** 브라우저를 닫거나 새로고침 해도 진행 상황 유지.
* **저장 항목:**
    * 현재 단계 (Current Stage)
    * 시작 시간 (Start Timestamp)
    * 경과 시간 (Elapsed Time)
    * 힌트 사용 횟수 (Hint Count)
    * 팀 이름 (Team Name)
    * Stage 4 데이터 (결과, 각도, 시간)
    * 완료 여부 (Is Completed)
* **구현 파일:** `js/storage.js`

### 3.4. 힌트 시스템 (Hint System) ✅
* **UI:** 각 단계별 [힌트 보기] 버튼 제공.
* **로직:** 힌트 열람 시 경고 모달 → 확인 시 힌트 표시 + 카운트 증가.
* **데이터:** 힌트 사용 횟수를 카운팅하여 최종 점수 계산에 반영.
* **구현 파일:** `js/hints.js`

## 4. UI/UX 가이드라인

### 4.1. 톤앤매너 (Visual Identity) ✅
* **테마:** Sci-Fi, Cyberpunk, Mission Control.
* **컬러:**
    * 배경: Deep Black (`#0a0a0f`)
    * 포인트: Neon Green (`#00ff41`) - 정상/성공
    * 알림/경고: Alert Red (`#ff3333`) - 경고/오류
    * 보조색: Neon Blue (`#00d4ff`) - 정보/하이라이트
* **폰트:** 
    * 제목: Orbitron (Google Fonts)
    * 본문: Share Tech Mono (Monospace)
* **구현 파일:** `css/main.css`, `css/components.css`

### 4.2. 사운드 (Sound Effects) - *선택 사항*
* 버튼 클릭음 (기계적인 비프음).
* 정답 성공음 (잠금 해제 효과음).
* 오답 경고음 (Error 비프음).
* **파일 위치:** `assets/sounds/` 디렉토리

### 4.3. 배경 효과 ✅
* 별이 움직이는 우주 배경 애니메이션
* 스캔라인 오버레이 효과
* 글리치 텍스트 효과
* 타이핑 애니메이션

## 5. 데이터 로직 (Data Logic Specifications)

### 5.1. 정답 데이터 셋

| 단계 | 항목 | 정답 로직 (검증 값) | 비고 |
|:---:|:---:|:---|:---|
| 1 | 보안코드 | "프록시마b" + "적색왜성" + "4.24" | 공백 무시, 정확히 일치 |
| 2 | 생존구역 | ["황혼", "경계", "twilight", "terminator"] 중 하나 포함 | 부분 일치 허용 |
| 3 | 좌표 | 구역="night" && 위도=43~47 | 숫자 범위 체크 |
| 4 | 발사각 | 정답 없음 | 학습자 입력 기록만 |

### 5.2. 점수 계산식

$$최종 점수 = (제한시간 200분 - 소요 시간(분)) - (힌트 사용 횟수 \times 5)$$

* 구현 위치: `js/stages.js`의 `displayResults()` 함수

### 5.3. 정답 변경 방법

정답을 변경하려면:

1. **Stage 1 (보안 코드):**
   - `js/validation.js`의 `validateStage1()` 함수에서 `correctAnswer` 값 수정
   - `config/answers.json`의 `stage1.combined` 값 수정

2. **Stage 2 (생존 구역):**
   - `js/validation.js`의 `validateStage2()` 함수에서 `keywords` 배열 수정
   - `config/answers.json`의 `stage2.keywords` 배열 수정

3. **Stage 3 (좌표):**
   - `js/validation.js`의 `validateStage3()` 함수에서 조건 수정
   - `config/answers.json`의 `stage3.answers` 객체 수정

4. **힌트 내용 변경:**
   - `js/hints.js`의 `hintData` 객체 수정
   - `config/answers.json`의 `hints` 객체 수정

## 6. 프로젝트 구조 (Project Structure) ✅

```
20251130 Alpha Centauri/
├── PRD.md                    # 프로젝트 요구사항 문서
├── README.md                 # 프로젝트 설명 및 실행 가이드
├── index.html                # 메인 HTML 파일 (모든 단계 UI 포함)
├── css/
│   ├── main.css             # 메인 스타일시트 (변수, 레이아웃, 배경 효과)
│   └── components.css       # 컴포넌트별 스타일 (버튼, 입력, 모달 등)
├── js/
│   ├── storage.js           # LocalStorage 관리 모듈
│   ├── timer.js             # 타이머 시스템 모듈
│   ├── validation.js        # 정답 검증 로직 모듈
│   ├── hints.js             # 힌트 시스템 모듈
│   ├── stages.js            # 각 단계별 로직 모듈
│   └── main.js              # 메인 애플리케이션 로직
├── assets/
│   ├── video/
│   │   └── intro.mp4        # 인트로 영상 (사용자 제공 필요)
│   ├── images/              # 이미지 리소스
│   └── sounds/              # 사운드 효과 (선택사항)
└── config/
    └── answers.json         # 정답 설정 파일 (참조용)
```

## 7. 기술 스택 (Technology Stack)

* **Frontend:** 순수 HTML5, CSS3, JavaScript (ES6+)
* **저장소:** Browser LocalStorage API
* **폰트:** Google Fonts (Orbitron, Share Tech Mono)
* **의존성:** 외부 라이브러리 없이 순수 JavaScript로 구현

## 8. 실행 방법

1. `index.html` 파일을 웹 브라우저(Chrome 권장)로 열기
2. 별도의 서버 설정 없이 바로 실행 가능
3. (선택) 인트로 영상을 `assets/video/intro.mp4`에 배치

### 개발자 단축키

* `Ctrl + Shift + R`: 모든 데이터 초기화 (개발용)
* `Esc`: 힌트 모달 닫기

## 9. 주의사항

### 영상 파일
* 인트로 영상(`intro.mp4`)은 별도로 준비하여 `assets/video/` 디렉토리에 배치해야 합니다.
* 영상이 없어도 '건너뛰기' 버튼으로 진행 가능합니다.

### 브라우저 호환성
* Chrome, Edge, Firefox 최신 버전에서 테스트 권장
* Safari에서는 일부 CSS 효과가 다르게 보일 수 있음

### LocalStorage
* 개인 정보 보호 모드(시크릿 모드)에서는 데이터가 저장되지 않을 수 있음
* 브라우저 데이터 삭제 시 진행 상황도 삭제됨

## 10. 향후 확장 가능성 (Future Enhancements)

* 다중 팀 지원 (팀별 진행 상황 비교)
* 리더보드 기능
* 교사용 관리자 대시보드
* 통계 및 분석 기능
* 사운드 효과 추가
* 더 다양한 시각화 자료
