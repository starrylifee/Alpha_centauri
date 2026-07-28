/**
 * PROXIMA RESCUE COMMAND - Main Application
 * 메인 애플리케이션 로직
 */

const App = (function () {

    // DOM Elements
    let introVideo = null;
    let playVideoBtn = null;
    let skipIntroBtn = null;
    let startMissionBtn = null;
    let teamModal = null;
    let teamNameInput = null;
    let confirmTeamBtn = null;
    let teamNameDisplay = null;
    let videoModal = null;
    let videoModalCloseBtn = null;

    /**
     * DOM 요소 초기화
     */
    function initElements() {
        introVideo = document.getElementById('intro-video');
        playVideoBtn = document.getElementById('play-video-btn');
        skipIntroBtn = document.getElementById('skip-intro-btn');
        startMissionBtn = document.getElementById('start-mission-btn');
        teamModal = document.getElementById('team-modal');
        teamNameInput = document.getElementById('team-name-input');
        confirmTeamBtn = document.getElementById('confirm-team-btn');
        teamNameDisplay = document.getElementById('team-name-display');
        videoModal = document.getElementById('video-modal');
        videoModalCloseBtn = document.getElementById('video-modal-close');
    }

    /**
     * 인트로 이벤트 설정
     */
    function setupIntro() {
        // 영상 재생 버튼 - 모달 열기
        if (playVideoBtn && introVideo && videoModal) {
            playVideoBtn.addEventListener('click', () => {
                videoModal.classList.remove('hidden');
                introVideo.play();
            });
        }

        // 비디오 모달 닫기 버튼
        if (videoModalCloseBtn) {
            videoModalCloseBtn.addEventListener('click', () => {
                closeVideoModal();
            });
        }

        // 모달 배경 클릭 시 닫기
        if (videoModal) {
            videoModal.addEventListener('click', (e) => {
                if (e.target === videoModal) {
                    closeVideoModal();
                }
            });
        }

        // 영상 종료 시 모달 닫고 작전 개시 버튼 활성화
        if (introVideo) {
            introVideo.addEventListener('ended', () => {
                closeVideoModal();
                enableStartButton();
            });

            // 영상 에러 시에도 버튼 활성화
            introVideo.addEventListener('error', () => {
                console.log('[App] Video error, enabling start button');
                enableStartButton();
            });
        }

        // 영상 건너뛰기
        if (skipIntroBtn) {
            skipIntroBtn.addEventListener('click', () => {
                // 비밀번호 모달 사용
                const modal = document.getElementById('password-modal');
                const input = document.getElementById('stage-password-input');
                const submitBtn = document.getElementById('password-submit-btn');
                const errorMsg = document.getElementById('password-error');

                if (!modal || !input || !submitBtn) return;

                modal.classList.remove('hidden');
                input.value = '';
                errorMsg.classList.add('hidden');
                input.focus();

                // 닫기 핸들러
                const closeModal = () => {
                    modal.classList.add('hidden');
                    submitBtn.onclick = null;
                    input.onkeypress = null;
                    modal.onclick = null;
                    document.removeEventListener('keydown', handleEsc);
                    const closeBtn = modal.querySelector('.modal-close-btn');
                    if (closeBtn) closeBtn.onclick = null;
                };

                const handleSkip = () => {
                    if (input.value.trim() === Stages.ADMIN_PASSWORD) {
                        closeModal();
                        closeVideoModal();
                        enableStartButton();
                    } else {
                        errorMsg.classList.remove('hidden');
                        input.value = '';
                        input.focus();
                    }
                };

                // ESC 키 핸들러
                const handleEsc = (e) => {
                    if (e.key === 'Escape') closeModal();
                };

                // 닫기 버튼 (X)
                const closeBtn = modal.querySelector('.modal-close-btn');
                if (closeBtn) {
                    closeBtn.onclick = closeModal;
                }

                // 배경 클릭
                modal.onclick = (e) => {
                    if (e.target === modal) closeModal();
                };

                submitBtn.onclick = handleSkip;

                input.onkeypress = (e) => {
                    if (e.key === 'Enter') handleSkip();
                };

                document.addEventListener('keydown', handleEsc);
            });
        }

        // 작전 개시 버튼
        if (startMissionBtn) {
            startMissionBtn.addEventListener('click', () => {
                // 홈 버튼으로 잠시 나왔던 경우: 팀 이름을 다시 묻지 않고 이어서 진행
                const resumeStage = Storage.getAllData().resumeStage || 0;
                const teamName = Storage.getTeamName();

                if (resumeStage > 0 && teamName) {
                    updateTeamNameDisplay(teamName);
                    Timer.start(Storage.getElapsedTime());
                    Stages.showStage(resumeStage, Storage.getStagePhase(resumeStage));
                    restoreFormValues();
                    Storage.update('resumeStage', 0);
                    console.log('[App] Resumed at stage', resumeStage);
                    return;
                }

                showTeamModal();
            });
        }
    }

    /**
     * 비디오 모달 닫기
     */
    function closeVideoModal() {
        if (videoModal) {
            videoModal.classList.add('hidden');
        }
        if (introVideo) {
            introVideo.pause();
        }
    }

    /**
     * 작전 개시 버튼 활성화
     * @param {string} [label] - 버튼에 표시할 문구 (진행 중이면 "이어서 진행")
     */
    function enableStartButton(label) {
        if (startMissionBtn) {
            startMissionBtn.classList.remove('hidden');
            startMissionBtn.style.animation = 'pulse 2s ease-in-out infinite';

            if (label) {
                const textEl = startMissionBtn.querySelector('.btn-text');
                if (textEl) textEl.textContent = label;
            }
        }
        if (skipIntroBtn) {
            skipIntroBtn.classList.add('hidden');
        }
    }

    /**
     * 홈으로 나왔던 게임이 남아 있으면 "이어서 진행" 버튼을 띄운다
     * @returns {boolean} 이어할 게임이 있는지
     */
    function showResumeButtonIfNeeded() {
        const resumeStage = Storage.getAllData().resumeStage || 0;
        const teamName = Storage.getTeamName();

        if (resumeStage > 0 && teamName && !Storage.isCompleted()) {
            enableStartButton('[ 이어서 진행 ]');
            return true;
        }
        return false;
    }

    /**
     * 팀 이름 모달 표시
     */
    function showTeamModal() {
        if (teamModal) {
            teamModal.classList.remove('hidden');
            if (teamNameInput) {
                teamNameInput.focus();
            }
        }
    }

    /**
     * 팀 이름 모달 숨김
     */
    function hideTeamModal() {
        if (teamModal) {
            teamModal.classList.add('hidden');
        }
    }

    /**
     * 팀 이름 모달 이벤트 설정
     */
    function setupTeamModal() {
        if (confirmTeamBtn) {
            confirmTeamBtn.addEventListener('click', () => {
                const teamName = teamNameInput?.value.trim() || '';

                if (!teamName) {
                    alert('팀 이름을 입력해주세요.');
                    return;
                }

                // 팀 이름 저장
                Storage.setTeamName(teamName);

                // 헤더에 팀 이름 표시
                updateTeamNameDisplay(teamName);

                // 모달 숨기기
                hideTeamModal();

                // 타이머 시작
                Timer.start();

                // Stage 1으로 이동
                Stages.showStage(1);
            });
        }

        // 엔터키로 확인
        if (teamNameInput) {
            teamNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmTeamBtn?.click();
                }
            });
        }

        // 배경 클릭으로 닫지 않음 (팀 이름 필수)
    }

    /**
     * 팀 이름 디스플레이 업데이트
     * @param {string} name - 팀 이름
     */
    function updateTeamNameDisplay(name) {
        if (teamNameDisplay) {
            teamNameDisplay.textContent = name;
        }
    }

    /**
     * 저장된 상태 복원
     */
    function restoreState() {
        // 완료된 게임인지 확인
        // (결과 화면이 경과 시간을 읽으므로 타이머를 먼저 복원해야 함)
        if (Storage.isCompleted()) {
            Timer.restore();
            updateTeamNameDisplay(Storage.getTeamName());
            Stages.showResult();
            return true;
        }

        // 진행 중인 게임 복원
        const currentStage = Storage.getCurrentStage();
        const teamName = Storage.getTeamName();

        if (currentStage > 0 && teamName) {
            updateTeamNameDisplay(teamName);

            // 저장된 시간부터 타이머 재개
            // (10초 미만이라 저장값이 0이어도 반드시 다시 돌려야 한다)
            Timer.restore();
            Timer.start(Storage.getElapsedTime());

            // 하던 단계·화면으로 이동한 뒤 적어둔 값을 되돌려 놓는다
            Stages.showStage(currentStage, Storage.getStagePhase(currentStage));
            restoreFormValues();

            console.log('[App] State restored - Stage:', currentStage, 'Team:', teamName);
            return true;
        }

        return false;
    }

    /**
     * 지난 기록 모달 설정
     *
     * 앞 단계로 되돌아가지 않고도 팀이 적은 답을 볼 수 있게 한다.
     * 저장된 값을 읽기만 하므로 진행 단계·타이머는 그대로다.
     */
    function setupRecordModal() {
        const recordBtn = document.getElementById('record-btn');
        const modal = document.getElementById('record-modal');
        if (!recordBtn || !modal) return;

        const open = () => {
            renderRecordList();
            modal.classList.remove('hidden');
        };
        const close = () => modal.classList.add('hidden');

        recordBtn.addEventListener('click', open);
        document.getElementById('record-close')?.addEventListener('click', close);
        modal.querySelector('.modal-close-btn')?.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }

    /**
     * 지난 기록 목록 그리기
     *
     * 각 단계의 값은 그 단계를 통과할 때 저장된다. 아직 안 간 단계는 목록에 안 나온다.
     */
    function renderRecordList() {
        const listEl = document.getElementById('record-list');
        if (!listEl) return;

        const data = Storage.getAllData();
        const s2 = data.stage2Data || {};
        const s3 = data.stage3Data || {};
        const s4 = data.stage4Averages || {};

        const keep = (rows) => rows.filter(([, v]) => v !== undefined && v !== null && v !== '');

        const sections = [
            {
                title: 'STAGE 2 · 죽음의 두 얼굴',
                rows: keep([
                    ['생존 가능 구역', s2.survivalZone],
                    ['선정 이유', s2.reason]
                ])
            },
            {
                title: 'STAGE 3 · 어둠 속의 단서',
                rows: keep([
                    ['별 궤적 각도', s3.angle],
                    ['사진 촬영 시간', s3.hours],
                    ['자전 주기', s3.speed],
                    ['조난자 위치', s3.location],
                    ['측정한 위도', s3.latitude ? `북위 ${s3.latitude}도` : '']
                ])
            },
            {
                title: 'STAGE 4 · 운명의 타이밍',
                rows: keep([
                    ['내행성 평균 주기', s4.inner ? `${s4.inner.toFixed(1)}초` : ''],
                    ['외행성 평균 주기', s4.outer ? `${s4.outer.toFixed(1)}초` : ''],
                    ['로켓 편도 시간', s4.rocket ? `${s4.rocket.toFixed(1)}초` : '']
                ])
            }
        ].filter(s => s.rows.length > 0);

        if (sections.length === 0) {
            listEl.innerHTML = '<p class="record-empty">아직 기록이 없습니다. 단계를 하나 마치면 여기에 쌓입니다.</p>';
            return;
        }

        listEl.innerHTML = sections.map(s => `
            <div class="record-section">
                <h3 class="record-title">${s.title}</h3>
                ${s.rows.map(([label, value]) => `
                    <div class="record-row">
                        <span class="record-label">${label}</span>
                        <span class="record-value">${escapeHtml(String(value))}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    /** 학생이 적은 문장을 그대로 넣으므로 태그를 막는다 */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 키보드 단축키 설정
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + R: 개발용 리셋
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                if (confirm('[개발자 모드] 모든 데이터를 초기화하시겠습니까?')) {
                    Storage.reset();
                    Timer.reset();
                    Hints.reset();
                    location.reload();
                }
            }

            // Escape: 모달 닫기 (팀 모달 제외)
            if (e.key === 'Escape') {
                const hintModal = document.getElementById('hint-modal');
                const hintDisplayModal = document.getElementById('hint-display-modal');
                const recordModal = document.getElementById('record-modal');

                // 비디오 모달 닫기
                if (videoModal && !videoModal.classList.contains('hidden')) {
                    closeVideoModal();
                }

                if (hintModal && !hintModal.classList.contains('hidden')) {
                    hintModal.classList.add('hidden');
                }
                if (hintDisplayModal && !hintDisplayModal.classList.contains('hidden')) {
                    hintDisplayModal.classList.add('hidden');
                }
                if (recordModal && !recordModal.classList.contains('hidden')) {
                    recordModal.classList.add('hidden');
                }
            }
        });
    }

    /**
     * 페이지 떠나기 전 확인
     */
    function setupBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            const currentStage = Storage.getCurrentStage();

            // 게임 진행 중일 때만 경고
            if (currentStage > 0 && !Storage.isCompleted()) {
                // 현재 시간 저장
                Storage.saveElapsedTime(Timer.getElapsed());

                // 브라우저에 따라 메시지가 표시되지 않을 수 있음
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /* ------------------------------------------------------------------
       새로고침 복원

       학생이 실수로 F5를 눌러도 적던 값을 다시 넣지 않게 한다.
       스테이지 4는 측정칸만 아홉 개라 손해가 크다.
       ------------------------------------------------------------------ */

    /** 저장하지 않는 칸 (비밀번호와 팀 이름은 남기면 안 되거나 따로 복원된다) */
    const SKIP_SAVE_IDS = ['team-name-input', 'stage-password-input'];

    /**
     * 입력칸 값이 바뀔 때마다 저장
     */
    function setupFormPersistence() {
        const remember = (e) => {
            const el = e.target;
            if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) return;

            // 라디오는 id가 없어 이름으로 묶어 저장한다 (id 검사보다 먼저 봐야 한다)
            if (el.type === 'radio') {
                if (el.checked && el.name) Storage.saveFormValue(`radio:${el.name}`, el.value);
                return;
            }

            if (!el.id || SKIP_SAVE_IDS.includes(el.id)) return;
            Storage.saveFormValue(el.id, el.value);
        };

        document.addEventListener('input', remember);
        document.addEventListener('change', remember);
    }

    /**
     * 저장해둔 입력값을 화면에 되돌려 놓는다
     *
     * 값만 넣으면 평균·각도 같은 계산 표시가 비어 있으므로,
     * 각 칸에 input 이벤트를 다시 흘려보내 화면이 스스로 다시 계산하게 한다.
     */
    function restoreFormValues() {
        const values = Storage.getFormValues();
        const touched = [];

        Object.entries(values).forEach(([key, value]) => {
            if (key.startsWith('radio:')) {
                const name = key.slice(6);
                const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
                return;
            }

            const el = document.getElementById(key);
            if (!el || value === '' || value === undefined) return;
            el.value = value;
            touched.push(el);
        });

        touched.forEach(el => {
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });

        // 평균은 버튼을 눌러야 계산된다. 아홉 칸이 다 차 있으면 대신 눌러준다
        const cells = ['inner-1', 'inner-2', 'inner-3', 'outer-1', 'outer-2', 'outer-3',
            'rocket-1', 'rocket-2', 'rocket-3'];
        const allMeasured = cells.every(id => {
            const el = document.getElementById(id);
            return el && el.value.trim() !== '';
        });
        if (allMeasured) document.getElementById('calc-avg-btn')?.click();

        console.log('[App] Form values restored:', touched.length, 'fields');
    }

    /**
     * Phase 입력값 검증
     * @param {string} validateId - 검증할 입력 필드 ID 또는 특수 키
     * @returns {boolean} 검증 통과 여부
     */
    function validatePhaseInput(validateId) {
        // 에러 메시지 요소
        const errorEl = document.getElementById(`${validateId}-error`);

        /** 여러 입력 칸이 모두 채워졌는지 확인 */
        const allFilled = (ids) => ids.every(id => {
            const el = document.getElementById(id);
            return el && el.value.trim() !== '';
        });

        // 특수 검증 케이스
        if (validateId === 'stage4-measure') {
            // Stage 4 Phase 2: 측정값 9칸 + 평균 계산 버튼까지 눌렀는지 검증
            const measured = allFilled(['inner-1', 'inner-2', 'inner-3',
                'outer-1', 'outer-2', 'outer-3',
                'rocket-1', 'rocket-2', 'rocket-3']);
            const avgs = ['inner-avg', 'outer-avg', 'rocket-avg']
                .map(id => document.getElementById(id)?.textContent);
            const isValid = measured && avgs.every(v => v && v !== '--');

            if (errorEl) errorEl.classList.toggle('hidden', isValid);
            return isValid;
        }

        if (validateId === 'stage4-angle') {
            // Stage 4 Phase 3: 계산 과정 전체와 발사 각도가 채워졌는지 검증
            const isValid = allFilled(['calc-period', 'calc-speed', 'calc-travel', 'stage4-angle']);

            if (errorEl) errorEl.classList.toggle('hidden', isValid);
            if (!isValid) {
                const firstEmpty = ['calc-period', 'calc-speed', 'calc-travel', 'stage4-angle']
                    .map(id => document.getElementById(id))
                    .find(el => el && el.value.trim() === '');
                firstEmpty?.focus();
            }
            return isValid;
        }

        // 일반 입력 필드 검증
        const inputEl = document.getElementById(validateId);
        if (!inputEl) {
            console.warn('[App] Validation element not found:', validateId);
            return true; // 요소가 없으면 통과
        }

        let isValid = false;

        // 입력 타입에 따른 검증
        if (inputEl.tagName === 'SELECT') {
            isValid = inputEl.value !== '';
        } else if (inputEl.tagName === 'INPUT') {
            isValid = inputEl.value.trim() !== '';
        } else if (inputEl.tagName === 'TEXTAREA') {
            isValid = inputEl.value.trim() !== '';
        }

        // 에러 표시/숨김
        if (errorEl) {
            if (isValid) {
                errorEl.classList.add('hidden');
            } else {
                errorEl.classList.remove('hidden');
                // 입력 필드에 포커스
                inputEl.focus();
            }
        }

        return isValid;
    }

    /**
     * 지금 보고 있는 화면 번호를 저장한다 (새로고침하면 여기로 돌아온다)
     * @param {HTMLElement} stageEl - .stage 요소 (id가 step-N)
     * @param {string|number} phaseNum - 화면 번호
     */
    function rememberPhase(stageEl, phaseNum) {
        const stageNum = parseInt(String(stageEl.id).replace('step-', ''), 10);
        if (!isNaN(stageNum)) {
            Storage.setStagePhase(stageNum, parseInt(phaseNum, 10));
        }
    }

    /**
     * 단계 내 Phase 진행 시스템 설정
     */
    function setupPhaseSystem() {
        // 모든 "다음" 버튼에 이벤트 리스너 추가
        document.addEventListener('click', (e) => {
            const nextBtn = e.target.closest('.btn-next');
            if (!nextBtn) return;

            const nextPhaseNum = nextBtn.getAttribute('data-next-phase');
            if (!nextPhaseNum) return;

            // Validation 체크
            const validateId = nextBtn.getAttribute('data-validate');
            if (validateId) {
                const isValid = validatePhaseInput(validateId);
                if (!isValid) {
                    console.log('[App] Validation failed for:', validateId);
                    return; // 검증 실패 시 진행하지 않음
                }
            }

            // 현재 stage 찾기
            const currentStage = nextBtn.closest('.stage');
            if (!currentStage) return;

            // 현재 phase 숨기기
            const currentPhase = nextBtn.closest('.stage-phase');
            if (currentPhase) {
                currentPhase.classList.add('hidden');
            }

            // 다음 phase 표시
            const nextPhase = currentStage.querySelector(`.phase-${nextPhaseNum}`);
            if (nextPhase) {
                nextPhase.classList.remove('hidden');
                rememberPhase(currentStage, nextPhaseNum);

                // 페이지 최상단으로 스크롤
                window.scrollTo({ top: 0, behavior: 'smooth' });

                console.log('[App] Advanced to phase', nextPhaseNum);
            }
        });

        // 모든 "이전" 버튼에 이벤트 리스너 추가 (검증 없이 자유롭게 이동)
        document.addEventListener('click', (e) => {
            const prevBtn = e.target.closest('.btn-prev');
            if (!prevBtn) return;

            const prevPhaseNum = prevBtn.getAttribute('data-prev-phase');
            if (!prevPhaseNum) return;

            // 현재 stage 찾기
            const currentStage = prevBtn.closest('.stage');
            if (!currentStage) return;

            // 현재 phase 숨기기
            const currentPhase = prevBtn.closest('.stage-phase');
            if (currentPhase) {
                currentPhase.classList.add('hidden');
            }

            // 이전 phase 표시
            const prevPhase = currentStage.querySelector(`.phase-${prevPhaseNum}`);
            if (prevPhase) {
                prevPhase.classList.remove('hidden');
                rememberPhase(currentStage, prevPhaseNum);

                // 페이지 최상단으로 스크롤
                window.scrollTo({ top: 0, behavior: 'smooth' });

                console.log('[App] Returned to phase', prevPhaseNum);
            }
        });

        // 스테이지 사이를 오가는 버튼은 두지 않는다. showStage()가 저장된 진행 단계를
        // 덮어써서, 되돌아간 뒤 새로고침하면 앞 단계에 갇히고 비밀번호를 다시 받아야 했다.
        // 앞 단계 내용은 헤더의 "지난 기록"으로 본다.

        console.log('[App] Phase system initialized');
    }

    /**
     * 조석 고정 시뮬레이션 설정
     */
    function setupTidalSimulation() {
        const simBtn = document.getElementById('tidal-sim-btn');
        const simOrbit = document.querySelector('.sim-orbit');
        const toggleBtns = document.querySelectorAll('.planet-toggle .toggle-btn');
        const modeInfo = document.getElementById('sim-mode-info');

        if (!simBtn || !simOrbit) return;

        let isRunning = false;
        let currentMode = 'proxima'; // 기본: 프록시마 b (조석 고정)

        // 토글 버튼 이벤트
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const planet = btn.getAttribute('data-planet');

                // 활성화 버튼 변경
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 모드 변경
                currentMode = planet;

                // CSS 클래스 업데이트
                if (planet === 'earth') {
                    simOrbit.classList.remove('tidal-lock');
                    simOrbit.classList.add('earth-mode');
                    if (modeInfo) {
                        modeInfo.textContent = '🌍 지구: 빠른 자전 (하루에 한 바퀴)';
                    }
                } else {
                    simOrbit.classList.remove('earth-mode');
                    simOrbit.classList.add('tidal-lock');
                    if (modeInfo) {
                        modeInfo.textContent = '🔴 프록시마 b: 조석 고정';
                    }
                }

                console.log('[App] Simulation mode changed to:', planet);
            });
        });

        // 시뮬레이션 시작/정지 버튼
        simBtn.addEventListener('click', () => {
            if (isRunning) {
                // 정지
                simOrbit.classList.remove('animating');
                simBtn.innerHTML = '<span>▶ 시뮬레이션 시작</span>';
                simBtn.classList.remove('running');
                isRunning = false;
            } else {
                // 시작
                simOrbit.classList.add('animating');
                simBtn.innerHTML = '<span>⏹ 시뮬레이션 정지</span>';
                simBtn.classList.add('running');
                isRunning = true;
            }
        });

        console.log('[App] Tidal simulation initialized');
    }

    /**
     * 답 확인 로직 (미션1 - 표 먼저, 시뮬레이션 나중)
     */
    function setupAnswerCheck() {
        const checkBtn = document.getElementById('check-q1-btn');
        const input = document.getElementById('stage2-q1');
        const feedback = document.getElementById('q1-feedback');
        const simulation = document.getElementById('simulation-section');
        const observationSection = document.getElementById('observation-section');
        const observationText = document.getElementById('observation-text');
        const observationError = document.getElementById('observation-error');
        const nextBtn = document.getElementById('phase1-next-btn');
        const errorEl = document.getElementById('stage2-q1-error');

        if (!checkBtn || !input || !feedback || !simulation) return;

        // 정답 목록 — 소스 보기로 못 읽게 vault.js 에 보관 (태양, 항성 등)
        const correctAnswers = Vault.list('q1');
        let answerCorrect = false;

        checkBtn.addEventListener('click', () => {
            const answer = input.value.trim();

            if (!answer) {
                if (errorEl) errorEl.classList.remove('hidden');
                input.focus();
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');

            // 정답 체크
            const isCorrect = correctAnswers.some(correct =>
                answer.includes(correct) || correct.includes(answer)
            );

            if (isCorrect) {
                answerCorrect = true;
                feedback.className = 'answer-feedback correct';
                feedback.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <div class="feedback-text">
                        <strong>정답입니다!</strong><br>
                        시뮬레이션으로 확인하고 관찰 내용을 기록하세요.
                    </div>
                    <button class="btn btn-secondary btn-small" id="show-sim-correct">
                        시뮬레이션 보기
                    </button>
                `;
                feedback.classList.remove('hidden');

                // 시뮬레이션 보기 버튼
                document.getElementById('show-sim-correct')?.addEventListener('click', () => {
                    simulation.classList.remove('hidden');
                    if (observationSection) observationSection.classList.remove('hidden');
                    simulation.scrollIntoView({ behavior: 'smooth' });
                });
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>다시 생각해 볼까요?</strong><br>
                        시뮬레이션을 보고 다시 답해보세요!
                    </div>
                    <button class="btn btn-primary btn-small" id="show-sim-wrong">
                        시뮬레이션 보기
                    </button>
                `;
                feedback.classList.remove('hidden');

                // 시뮬레이션 보기 버튼 (오답 시)
                document.getElementById('show-sim-wrong')?.addEventListener('click', () => {
                    simulation.classList.remove('hidden');
                    simulation.scrollIntoView({ behavior: 'smooth' });
                });
            }

            checkBtn.classList.add('hidden');
        });

        // 입력 필드에서 엔터 키
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkBtn.click();
        });

        // 답 수정 시 다시 확인 가능하게
        input.addEventListener('input', () => {
            if (checkBtn.classList.contains('hidden') && !answerCorrect) {
                checkBtn.classList.remove('hidden');
            }
        });

        // 관찰 기록 입력 시 다음 버튼 표시
        if (observationText && nextBtn) {
            observationText.addEventListener('input', () => {
                if (observationText.value.trim().length >= 10 && answerCorrect) {
                    nextBtn.classList.remove('hidden');
                    if (observationError) observationError.classList.add('hidden');
                } else {
                    nextBtn.classList.add('hidden');
                }
            });
        }

        console.log('[App] Answer check system initialized');
    }

    /**
     * Phase 2 답 확인 로직 (조석고정)
     */
    function setupAnswerCheckQ2() {
        const checkBtn = document.getElementById('check-q2-btn');
        const input = document.getElementById('stage2-q2');
        const feedback = document.getElementById('q2-feedback');
        const nextBtn = document.getElementById('phase2-next-btn');
        const errorEl = document.getElementById('stage2-q2-error');

        if (!checkBtn || !input || !feedback) return;

        // 정답 목록 — vault.js 에 보관 (조석고정, 동주기자전. 비교 전에 공백을 빼므로 붙인 형태만 있으면 된다)
        const correctAnswers = Vault.list('q2');

        checkBtn.addEventListener('click', () => {
            const answer = input.value.trim().replace(/\s+/g, '');

            if (!answer) {
                if (errorEl) errorEl.classList.remove('hidden');
                input.focus();
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');

            // 정답 체크
            const isCorrect = correctAnswers.some(correct =>
                answer.includes(correct.replace(/\s+/g, '')) ||
                correct.replace(/\s+/g, '').includes(answer)
            );

            if (isCorrect) {
                feedback.className = 'answer-feedback correct';
                feedback.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <div class="feedback-text">
                        <strong>정답! 조석 고정(Tidal Locking)</strong><br>
                        달이 지구에 항상 같은 면을 보여주는 것과 같은 현상입니다.
                    </div>
                `;
                feedback.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>다시 생각해 보세요!</strong><br>
                        달이 지구를 돌 때 항상 같은 면만 보여주는 것처럼...
                    </div>
                `;
                feedback.classList.remove('hidden');
            }

            checkBtn.classList.add('hidden');
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkBtn.click();
        });

        input.addEventListener('input', () => {
            if (checkBtn.classList.contains('hidden') && !feedback.classList.contains('correct')) {
                checkBtn.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.add('hidden');
            }
        });

        console.log('[App] Answer check Q2 initialized');
    }

    /**
     * Stage 3 Phase 1 - 별 궤적 사진 위에 각도기를 겹쳐 그린다.
     *
     * 좌표계는 startrails-zoom.jpg 의 크롭 기준(700×510, viewBox와 동일)이다.
     * 원본 startrails.jpg(1408×752)에서 (430,30)~(1130,540)을 잘라낸 것이라,
     * 원본에서 실측한 회전 중심 (776,212)는 여기서 (346,182)가 된다.
     * 각도는 SVG 기준(0°=3시, 증가하면 화면상 시계방향)이며, 눈금값은 A점을 0으로 다시 매긴다.
     */
    const TRAIL_GEO = {
        cx: 346, cy: 182,   // 사진 속 일주운동 회전 중심
        arcR: 175,          // 추적한 별의 궤도 반지름
        start: 45,          // A점 위치
        sweep: 30,          // A→B (학생이 읽어낼 각도)
        // 눈금 반경은 크롭 사진의 지평선(y≈460)에 걸리지 않는 선에서 잡았다.
        // 가장 아래로 내려가는 눈금 숫자가 y≈410이라 얼음 위 하늘 안에 들어온다.
        tickIn: 190, tickShort: 203, tickLong: 212, tickNum: 236,
        maxTick: 90         // 눈금은 0~90까지
    };

    function buildTrailOverlay() {
        const svg = document.getElementById('trail-overlay');
        if (!svg || svg.dataset.built) return;

        const G = TRAIL_GEO;
        const pt = (deg, r) => {
            const t = deg * Math.PI / 180;
            return [G.cx + r * Math.cos(t), G.cy + r * Math.sin(t)];
        };
        const n = v => v.toFixed(1);
        const CYAN = '#7fe9ff';
        const AMBER = '#ffb02e';
        const OUTLINE = 'stroke="#001018" stroke-width="3.5" paint-order="stroke"';

        const out = [];
        const line = (d1, r1, d2, r2, attr) => {
            const [x1, y1] = pt(d1, r1), [x2, y2] = pt(d2, r2);
            out.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${attr}/>`);
        };
        const label = (deg, r, text, color, size, anchor) => {
            const [x, y] = pt(deg, r);
            out.push(`<text x="${n(x)}" y="${n(y)}" fill="${color}" font-size="${size}" ` +
                `font-weight="bold" text-anchor="${anchor || 'middle'}" ` +
                `dominant-baseline="middle" ${OUTLINE}>${text}</text>`);
        };

        // 눈금 (10도 간격, 30도마다 숫자)
        for (let v = 0; v <= G.maxTick; v += 10) {
            const major = v % 30 === 0;
            line(G.start + v, G.tickIn, G.start + v, major ? G.tickLong : G.tickShort,
                `stroke="${CYAN}" stroke-width="${major ? 2.6 : 1.6}" opacity="0.95"`);
            if (major) label(G.start + v, G.tickNum, String(v), CYAN, 23);
        }

        // 눈금 호 (눈금 끝을 잇는 원호)
        const [ax0, ay0] = pt(G.start, G.tickIn);
        const [ax1, ay1] = pt(G.start + G.maxTick, G.tickIn);
        out.push(`<path d="M ${n(ax0)} ${n(ay0)} A ${G.tickIn} ${G.tickIn} 0 0 1 ${n(ax1)} ${n(ay1)}" ` +
            `fill="none" stroke="${CYAN}" stroke-width="1.6" opacity="0.8"/>`);

        // 중심 → A, B 방향 안내선
        line(G.start, 0, G.start, G.tickLong, `stroke="${AMBER}" stroke-width="2" stroke-dasharray="8 6" opacity="0.9"`);
        line(G.start + G.sweep, 0, G.start + G.sweep, G.tickLong,
            `stroke="${AMBER}" stroke-width="2" stroke-dasharray="8 6" opacity="0.9"`);

        // 추적한 별 궤적 (A → B)
        const [bx0, by0] = pt(G.start, G.arcR);
        const [bx1, by1] = pt(G.start + G.sweep, G.arcR);
        out.push(`<path d="M ${n(bx0)} ${n(by0)} A ${G.arcR} ${G.arcR} 0 0 1 ${n(bx1)} ${n(by1)}" ` +
            `fill="none" stroke="${AMBER}" stroke-width="4.5" stroke-linecap="round"/>`);
        [[G.start, 'A'], [G.start + G.sweep, 'B']].forEach(([deg, tag]) => {
            const [x, y] = pt(deg, G.arcR);
            out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="7" fill="${AMBER}" stroke="#001018" stroke-width="2"/>`);
            label(deg, G.arcR - 24, tag, AMBER, 27);
        });

        // 각도 물음표 (중심 가까이 작은 호)
        const [qx0, qy0] = pt(G.start, 78);
        const [qx1, qy1] = pt(G.start + G.sweep, 78);
        out.push(`<path d="M ${n(qx0)} ${n(qy0)} A 78 78 0 0 1 ${n(qx1)} ${n(qy1)}" ` +
            `fill="none" stroke="${AMBER}" stroke-width="2.2"/>`);
        label(G.start + G.sweep / 2, 103, '?°', AMBER, 30);

        // 회전 중심
        out.push(`<circle cx="${G.cx}" cy="${G.cy}" r="6" fill="none" stroke="#ffffff" stroke-width="2"/>`);
        out.push(`<line x1="${G.cx - 15}" y1="${G.cy}" x2="${G.cx + 15}" y2="${G.cy}" stroke="#ffffff" stroke-width="1.8"/>`);
        out.push(`<line x1="${G.cx}" y1="${G.cy - 15}" x2="${G.cx}" y2="${G.cy + 15}" stroke="#ffffff" stroke-width="1.8"/>`);
        out.push(`<text x="${G.cx}" y="${G.cy - 26}" fill="#ffffff" font-size="21" font-weight="bold" ` +
            `text-anchor="middle" ${OUTLINE}>회전 중심</text>`);

        svg.innerHTML = out.join('\n');
        svg.dataset.built = '1';
    }

    /**
     * Stage 3 Phase 1 - "관측 장비로 분석하기" 버튼
     */
    function setupPhotoAnalysis() {
        const btn = document.getElementById('analyze-photo-btn');
        const svg = document.getElementById('trail-overlay');
        const box = document.getElementById('angle-measure-box');
        const caption = document.getElementById('trail-caption');
        const input = document.getElementById('star-angle-input');

        if (!btn || !svg || !box) return;

        function openAnalysis(focus) {
            buildTrailOverlay();
            svg.classList.remove('hidden');
            box.classList.remove('hidden');
            btn.classList.add('hidden');
            if (caption) caption.textContent = '[장비 분석 완료 — 별 하나를 추적하고 각도기를 겹쳤습니다]';
            if (focus && input) input.focus();
        }

        btn.addEventListener('click', () => openAnalysis(true));

        // 새로고침으로 돌아온 팀은 이미 각도를 적어둔 상태일 수 있다.
        // 복원은 init 끝에서 일어나므로, 값이 들어오는 순간(input 이벤트)에 맞춰 연다.
        if (input) {
            input.addEventListener('input', () => {
                if (input.value.trim() && box.classList.contains('hidden')) openAnalysis(false);
            });
        }

        console.log('[App] Photo analysis initialized');
    }

    /**
     * Stage 3 Phase 1 - 별 궤적 각도 답 확인
     */
    function setupAnswerCheckStarAngle() {
        const checkBtn = document.getElementById('check-angle-btn');
        const input = document.getElementById('star-angle-input');
        const feedback = document.getElementById('angle-feedback');
        const nextBtn = document.getElementById('phase3-1-next-btn');
        const errorEl = document.getElementById('star-angle-error');

        if (!checkBtn || !input || !feedback) return;

        checkBtn.addEventListener('click', () => {
            const answer = input.value.trim().replace(/\s+/g, '');

            if (!answer) {
                if (errorEl) errorEl.classList.remove('hidden');
                input.focus();
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');

            // 눈금이 10도 간격이므로 정확한 값만 정답. '30', '30도', '약 30°' 등 표기는 모두 허용한다.
            const num = parseFloat((answer.match(/\d+(\.\d+)?/) || [])[0]);
            const isCorrect = num === Vault.num('ang');

            if (isCorrect) {
                feedback.className = 'answer-feedback correct';
                feedback.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <div class="feedback-text">
                        <strong>정답! 30°입니다.</strong><br>
                        한 바퀴가 360°니까, 별은 원의 12분의 1만 돌았네요.
                    </div>
                `;
                feedback.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>눈금을 다시 세어보세요!</strong><br>
                        A가 놓인 눈금이 0입니다. B가 몇 번 눈금에 있나요?
                    </div>
                `;
                feedback.classList.remove('hidden');
            }

            checkBtn.classList.add('hidden');
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkBtn.click();
        });

        input.addEventListener('input', () => {
            if (checkBtn.classList.contains('hidden') && !feedback.classList.contains('correct')) {
                checkBtn.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.add('hidden');
            }
        });

        console.log('[App] Star angle check initialized');
    }

    /**
     * Stage 3 Phase 2 - 자전 속도 답 확인
     */
    function setupAnswerCheckRotation() {
        const checkBtn = document.getElementById('check-rotation-btn');
        const select = document.getElementById('stage3-q1');
        const feedback = document.getElementById('rotation-feedback');
        const nextBtn = document.getElementById('phase3-2-next-btn');
        const errorEl = document.getElementById('stage3-q1-error');
        const calcSection = document.getElementById('exposure-calc-section');

        if (!checkBtn || !select || !feedback) return;

        checkBtn.addEventListener('click', () => {
            const answer = select.value;

            if (!answer) {
                if (errorEl) errorEl.classList.remove('hidden');
                select.focus();
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');

            // 정답: slow (느리게)
            const isCorrect = answer === 'slow';

            if (isCorrect) {
                feedback.className = 'answer-feedback correct';
                feedback.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <div class="feedback-text">
                        <strong>정답!</strong><br>
                        별이 30°만 움직였다 = 자전이 느리다 = 하루가 길다!
                    </div>
                `;
                feedback.classList.remove('hidden');
                // 다음 버튼은 촬영 시간까지 계산해야 열린다
                if (calcSection) calcSection.classList.remove('hidden');
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>다시 생각해보세요!</strong><br>
                        지구는 한 바퀴 도는 데 24시간인데, 여기서는 30°밖에 안 돌았어요.
                    </div>
                `;
                feedback.classList.remove('hidden');
            }

            checkBtn.classList.add('hidden');
        });

        select.addEventListener('change', () => {
            if (checkBtn.classList.contains('hidden') && !feedback.classList.contains('correct')) {
                checkBtn.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.add('hidden');
                if (calcSection) calcSection.classList.add('hidden');
            }
        });

        console.log('[App] Rotation check initialized');
    }

    /**
     * Stage 3 Phase 2 - 촬영 시간 답 확인 (288시간 ÷ 12 = 24시간)
     */
    function setupAnswerCheckHours() {
        const checkBtn = document.getElementById('check-hours-btn');
        const input = document.getElementById('stage3-hours');
        const feedback = document.getElementById('hours-feedback');
        const nextBtn = document.getElementById('phase3-2-next-btn');
        const errorEl = document.getElementById('stage3-hours-error');
        const starSection = document.getElementById('star-visibility-section');

        if (!checkBtn || !input || !feedback) return;

        checkBtn.addEventListener('click', () => {
            const answer = input.value.trim().replace(/\s+/g, '');

            if (!answer) {
                if (errorEl) errorEl.classList.remove('hidden');
                input.focus();
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');

            const num = parseFloat((answer.match(/\d+(\.\d+)?/) || [])[0]);
            const isCorrect = num === Vault.num('hrs');

            if (isCorrect) {
                feedback.className = 'answer-feedback correct';
                feedback.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <div class="feedback-text">
                        <strong>정답! 24시간입니다.</strong><br>
                        대원은 꼬박 하루 동안 카메라를 열어두고 이 사진을 찍었습니다.
                    </div>
                `;
                feedback.classList.remove('hidden');
                if (starSection) starSection.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
                Storage.update('stage3Hours', String(num));
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>계산을 다시 해보세요!</strong><br>
                        이 행성의 하루는 288시간이고, 별은 그중 12분의 1만 돌았습니다.
                    </div>
                `;
                feedback.classList.remove('hidden');
            }

            checkBtn.classList.add('hidden');
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkBtn.click();
        });

        input.addEventListener('input', () => {
            // 새로고침 복원으로 값이 되돌아오면 계산 화면 자체가 닫혀 있을 수 있다
            const calcSection = document.getElementById('exposure-calc-section');
            if (input.value.trim() && calcSection) calcSection.classList.remove('hidden');

            if (checkBtn.classList.contains('hidden') && !feedback.classList.contains('correct')) {
                checkBtn.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.add('hidden');
                if (starSection) starSection.classList.add('hidden');
            }
        });

        console.log('[App] Exposure hours check initialized');
    }

    /**
     * Stage 3 Phase 3 - 대원 위치 답 확인 (정답: 밤)
     */
    function setupAnswerCheckLocation() {
        const checkBtn = document.getElementById('check-location-btn');
        const input = document.getElementById('stage3-q2');
        const feedback = document.getElementById('location-feedback');
        const nextBtn = document.getElementById('phase3-3-next-btn');
        const errorEl = document.getElementById('stage3-q2-error');

        if (!checkBtn || !input || !feedback) return;

        // 정답: 밤, 밤의 지역 등 — 소스 보기로 못 읽게 vault.js 에 보관
        const correctAnswers = Vault.list('loc');

        checkBtn.addEventListener('click', () => {
            const answer = input.value.trim().toLowerCase();

            if (!answer) {
                if (errorEl) errorEl.classList.remove('hidden');
                input.focus();
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');

            // 정답 체크
            const isCorrect = correctAnswers.some(correct =>
                answer.includes(correct) || correct.includes(answer)
            );

            if (isCorrect) {
                feedback.className = 'answer-feedback correct';
                feedback.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <div class="feedback-text">
                        <strong>정답! 밤의 지역입니다.</strong><br>
                        24시간 내내 별이 보인다 = 해가 뜨지 않는다 = 밤의 지역!
                    </div>
                `;
                feedback.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>다시 생각해보세요!</strong><br>
                        24시간 동안 별 사진을 찍으려면 그 동안 계속 어두워야 해요.
                    </div>
                `;
                feedback.classList.remove('hidden');
            }

            checkBtn.classList.add('hidden');
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkBtn.click();
        });

        input.addEventListener('input', () => {
            if (checkBtn.classList.contains('hidden') && !feedback.classList.contains('correct')) {
                checkBtn.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.add('hidden');
            }
        });

        console.log('[App] Location check initialized');
    }

    /**
     * 이미지 확대 모달 설정
     */
    function setupImageModal() {
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        const closeBtn = document.querySelector('.image-modal-close');
        const backdrop = document.querySelector('.image-modal-backdrop');

        if (!modal || !modalImage) return;

        // 모든 이미지에 클릭 이벤트 추가 (clickable-image 클래스 자동 추가)
        document.querySelectorAll('.startrails-photo, .worksheet-content img, .star-trail-image img, .mission-img').forEach(img => {
            img.classList.add('clickable-image');
            img.addEventListener('click', () => {
                modalImage.src = img.src;
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            });
        });

        // 닫기 함수
        function closeModal() {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }

        // X 버튼 클릭
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // 배경 클릭
        if (backdrop) {
            backdrop.addEventListener('click', closeModal);
        }

        // ESC 키
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });

        console.log('[App] Image modal initialized');
    }

    /**
     * 홈 버튼 이벤트 설정
     */
    function setupHomeButton() {
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                if (confirm('처음 화면으로 돌아가시겠습니까?\n(진행 상황은 저장됩니다)')) {
                    // 돌아올 단계를 먼저 기억해 둔다
                    // (showStage(0)이 currentStage를 0으로 덮어쓰기 때문)
                    Storage.update('resumeStage', Storage.getCurrentStage());

                    // 현재 시간 저장 후 타이머 정지
                    Storage.saveElapsedTime(Timer.getElapsed());
                    Timer.stop();

                    // Step 0으로 이동 (이어서 진행할 수 있게 버튼을 남겨둔다)
                    Stages.showStage(0);
                    showResumeButtonIfNeeded();
                }
            });
        }
    }

    /**
     * 앱 초기화
     */
    function init() {
        console.log('[App] Initializing Proxima Rescue Command...');

        // DOM 요소 초기화
        initElements();

        // 힌트 시스템 초기화
        Hints.init();

        // 단계 설정
        Stages.setupAllStages();

        // 이벤트 설정
        setupIntro();
        setupTeamModal();
        setupRecordModal();
        setupFormPersistence();
        setupHomeButton();
        setupPhaseSystem();
        setupTidalSimulation();
        setupAnswerCheck();
        setupAnswerCheckQ2();
        setupPhotoAnalysis();
        setupAnswerCheckStarAngle();
        setupAnswerCheckRotation();
        setupAnswerCheckHours();
        setupAnswerCheckLocation();
        setupImageModal();

        // 호만 전이 시뮬레이션 초기화
        if (typeof HohmannSim !== 'undefined') {
            HohmannSim.init();
        }

        setupKeyboardShortcuts();
        setupBeforeUnload();

        // 페널티 표시 초기화
        Hints.updatePenaltyDisplay();

        // 저장된 진행 상황 복원 (없으면 처음 화면부터)
        const restored = restoreState();
        if (!restored) {
            Stages.showStage(0);
            // 홈으로 나온 상태에서 새로고침한 경우에도 이어서 진행할 수 있게
            showResumeButtonIfNeeded();
        }

        console.log('[App] Initialization complete');
    }

    // Public API
    return {
        init,
        updateTeamNameDisplay
    };
})();

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
