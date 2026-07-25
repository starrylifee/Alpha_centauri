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
                    Stages.showStage(resumeStage);
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

            // 해당 단계로 이동
            Stages.showStage(currentStage);

            console.log('[App] State restored - Stage:', currentStage, 'Team:', teamName);
            return true;
        }

        return false;
    }

    /**
     * 보너스 모달 이벤트 설정
     */
    function setupBonusModal() {
        const bonusCloseBtn = document.getElementById('bonus-close');
        const bonusModal = document.getElementById('bonus-modal');

        if (bonusCloseBtn) {
            bonusCloseBtn.addEventListener('click', () => {
                if (bonusModal) {
                    bonusModal.classList.add('hidden');
                }
            });
        }

        // 배경 클릭으로 닫기
        if (bonusModal) {
            bonusModal.addEventListener('click', (e) => {
                if (e.target === bonusModal) {
                    bonusModal.classList.add('hidden');
                }
            });
        }
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
                const bonusModal = document.getElementById('bonus-modal');

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
                if (bonusModal && !bonusModal.classList.contains('hidden')) {
                    bonusModal.classList.add('hidden');
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
            // Stage 4 Phase 2: 측정값 6칸 + 평균 계산 버튼까지 눌렀는지 검증
            const measured = allFilled(['inner-1', 'inner-2', 'inner-3', 'outer-1', 'outer-2', 'outer-3']);
            const innerAvg = document.getElementById('inner-avg')?.textContent;
            const outerAvg = document.getElementById('outer-avg')?.textContent;
            const isValid = measured && innerAvg !== '--' && outerAvg !== '--';

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

                // 페이지 최상단으로 스크롤
                window.scrollTo({ top: 0, behavior: 'smooth' });

                console.log('[App] Returned to phase', prevPhaseNum);
            }
        });

        // "이전 단계" 버튼 (Stage 간 이동)
        document.addEventListener('click', (e) => {
            const prevStageBtn = e.target.closest('.btn-prev-stage');
            if (!prevStageBtn) return;

            const prevStageNum = parseInt(prevStageBtn.getAttribute('data-prev-stage'));
            if (!prevStageNum) return;

            Stages.showStage(prevStageNum);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log('[App] Returned to stage', prevStageNum);
        });

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

        // 정답 목록 (태양, 항성, 별 등)
        const correctAnswers = ['태양', '항성', '별', '프록시마', '프록시마센타우리', '중심별', '모항성'];
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

        // 정답 목록 (조석고정, 조석 고정 등)
        const correctAnswers = ['조석고정', '조석 고정', '동주기자전', '동주기 자전'];

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
     * Stage 3 Phase 1 - 별 궤적 각도 답 확인
     */
    function setupAnswerCheckStarAngle() {
        const checkBtn = document.getElementById('check-angle-btn');
        const input = document.getElementById('star-angle-input');
        const feedback = document.getElementById('angle-feedback');
        const nextBtn = document.getElementById('phase3-1-next-btn');
        const errorEl = document.getElementById('star-angle-error');

        if (!checkBtn || !input || !feedback) return;

        // 정답: 30도
        const correctAnswers = ['30', '30도', '30°', '약30', '약30도', '약 30', '약 30도'];

        checkBtn.addEventListener('click', () => {
            const answer = input.value.trim().replace(/\s+/g, '');

            if (!answer) {
                if (errorEl) errorEl.classList.remove('hidden');
                input.focus();
                return;
            }

            if (errorEl) errorEl.classList.add('hidden');

            // 정답 체크 (30이 포함되어 있으면 정답)
            const isCorrect = answer.includes('30');

            if (isCorrect) {
                feedback.className = 'answer-feedback correct';
                feedback.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <div class="feedback-text">
                        <strong>정답! 30°입니다.</strong><br>
                        지구에서는 24시간에 360° 도는데, 이 행성에서는 겨우 30°만 돌았네요!
                    </div>
                `;
                feedback.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>사진을 다시 살펴보세요!</strong><br>
                        별 궤적이 원의 몇 분의 1 정도인지 확인해보세요.
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
        const starSection = document.getElementById('star-visibility-section');

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
                if (starSection) starSection.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
            } else {
                feedback.className = 'answer-feedback wrong';
                feedback.innerHTML = `
                    <div class="feedback-icon">🤔</div>
                    <div class="feedback-text">
                        <strong>다시 생각해보세요!</strong><br>
                        지구에서는 24시간에 360° 도는데, 여기서는 30°밖에 안 돌았어요.
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
                if (starSection) starSection.classList.add('hidden');
            }
        });

        console.log('[App] Rotation check initialized');
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

        // 정답: 밤, 밤의 지역, night 등
        const correctAnswers = ['밤', '밤의 지역', '밤의지역', '밤 지역', 'night', '어둠', '어두운 곳'];

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
        setupBonusModal();
        setupHomeButton();
        setupPhaseSystem();
        setupTidalSimulation();
        setupAnswerCheck();
        setupAnswerCheckQ2();
        setupAnswerCheckStarAngle();
        setupAnswerCheckRotation();
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
