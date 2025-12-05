/**
 * PROXIMA RESCUE COMMAND - Main Application
 * 메인 애플리케이션 로직
 */

const App = (function() {
    
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
                closeVideoModal();
                enableStartButton();
            });
        }
        
        // 작전 개시 버튼
        if (startMissionBtn) {
            startMissionBtn.addEventListener('click', () => {
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
     */
    function enableStartButton() {
        if (startMissionBtn) {
            startMissionBtn.classList.remove('hidden');
            startMissionBtn.style.animation = 'pulse 2s ease-in-out infinite';
        }
        if (skipIntroBtn) {
            skipIntroBtn.classList.add('hidden');
        }
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
        if (Storage.isCompleted()) {
            Stages.showResult();
            Timer.restore();
            const teamName = Storage.getTeamName();
            updateTeamNameDisplay(teamName);
            return true;
        }
        
        // 진행 중인 게임 복원
        const currentStage = Storage.getCurrentStage();
        const teamName = Storage.getTeamName();
        
        if (currentStage > 0 && teamName) {
            updateTeamNameDisplay(teamName);
            
            // 타이머 복원 및 재시작
            if (Timer.restore()) {
                Timer.start(Storage.getElapsedTime());
            }
            
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
        
        // 특수 검증 케이스
        if (validateId === 'stage4-measure') {
            // Stage 4 Phase 2: 측정값 및 평균 계산 검증
            const innerAvg = document.getElementById('inner-avg')?.textContent;
            const outerAvg = document.getElementById('outer-avg')?.textContent;
            
            if (innerAvg === '--' || outerAvg === '--') {
                if (errorEl) errorEl.classList.remove('hidden');
                return false;
            }
            if (errorEl) errorEl.classList.add('hidden');
            return true;
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
                
                // 스크롤 상단으로
                nextPhase.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
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
                
                // 스크롤 상단으로
                prevPhase.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                console.log('[App] Returned to phase', prevPhaseNum);
            }
        });
        
        console.log('[App] Phase system initialized');
    }
    
    /**
     * 조석 고정 시뮬레이션 설정
     */
    function setupTidalSimulation() {
        const simBtn = document.getElementById('tidal-sim-btn');
        const simOrbit = document.querySelector('.sim-orbit');
        
        if (!simBtn || !simOrbit) return;
        
        let isRunning = false;
        
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
     * 홈 버튼 이벤트 설정
     */
    function setupHomeButton() {
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                if (confirm('처음 화면으로 돌아가시겠습니까?\n(진행 상황은 저장됩니다)')) {
                    // 현재 시간 저장
                    Storage.saveElapsedTime(Timer.getElapsed());
                    
                    // Step 0으로 이동
                    Stages.showStage(0);
                    
                    // 타이머 정지
                    Timer.stop();
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
        setupKeyboardShortcuts();
        setupBeforeUnload();
        
        // 페널티 표시 초기화
        Hints.updatePenaltyDisplay();
        
        // 저장된 상태 복원 시도
        const restored = restoreState();
        
        if (!restored) {
            // 새 게임 - Step 0 표시
            Stages.showStage(0);
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
