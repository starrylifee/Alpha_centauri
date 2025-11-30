/**
 * PROXIMA RESCUE COMMAND - Stages Module
 * 각 단계별 로직
 */

const Stages = (function() {
    
    // 단계별 DOM 요소 캐시
    const elements = {};
    
    /**
     * DOM 요소 초기화
     */
    function initElements() {
        // Stage sections
        for (let i = 0; i <= 5; i++) {
            elements[`stage${i}`] = document.getElementById(`step-${i}`);
        }
        elements.resultScreen = document.getElementById('result-screen');
        elements.header = document.getElementById('header');
        
        // Stage 1
        elements.stage1Input = document.getElementById('stage1-input');
        elements.stage1Submit = document.getElementById('stage1-submit');
        elements.stage1Feedback = document.getElementById('stage1-feedback');
        elements.stage1Hint = document.getElementById('stage1-hint');
        
        // Stage 2
        elements.stage2Input = document.getElementById('stage2-input');
        elements.stage2Submit = document.getElementById('stage2-submit');
        elements.stage2Feedback = document.getElementById('stage2-feedback');
        elements.stage2Hint = document.getElementById('stage2-hint');
        
        // Stage 3
        elements.stage3Region = document.getElementById('stage3-region');
        elements.stage3Latitude = document.getElementById('stage3-latitude');
        elements.stage3Submit = document.getElementById('stage3-submit');
        elements.stage3Feedback = document.getElementById('stage3-feedback');
        elements.stage3Hint = document.getElementById('stage3-hint');
        
        // Stage 4
        elements.stage4Angle = document.getElementById('stage4-angle');
        elements.stage4Time = document.getElementById('stage4-time');
        elements.stage4Submit = document.getElementById('stage4-submit');
        elements.stage4Feedback = document.getElementById('stage4-feedback');
        elements.stage4Hint = document.getElementById('stage4-hint');
        elements.successDetails = document.getElementById('success-details');
        
        // Stage 5
        elements.finalCompleteBtn = document.getElementById('final-complete-btn');
        
        // Result
        elements.resultTeamName = document.getElementById('result-team-name');
        elements.resultTime = document.getElementById('result-time');
        elements.resultHints = document.getElementById('result-hints');
        elements.resultPenalty = document.getElementById('result-penalty');
        elements.resultFinalScore = document.getElementById('result-final-score');
        elements.restartBtn = document.getElementById('restart-btn');
    }
    
    /**
     * 단계 표시
     * @param {number} stageNum - 단계 번호
     */
    function showStage(stageNum) {
        // 모든 단계 숨기기
        for (let i = 0; i <= 5; i++) {
            if (elements[`stage${i}`]) {
                elements[`stage${i}`].classList.add('hidden');
                elements[`stage${i}`].classList.remove('active');
            }
        }
        if (elements.resultScreen) {
            elements.resultScreen.classList.add('hidden');
        }
        
        // 해당 단계 표시
        const targetStage = elements[`stage${stageNum}`];
        if (targetStage) {
            targetStage.classList.remove('hidden');
            targetStage.classList.add('active');
            
            // Phase 시스템 초기화 - Phase 1만 표시
            const phases = targetStage.querySelectorAll('.stage-phase');
            phases.forEach((phase, index) => {
                if (index === 0) {
                    phase.classList.remove('hidden');
                } else {
                    phase.classList.add('hidden');
                }
            });
        }
        
        // 헤더 표시 (Stage 1 이상)
        if (elements.header) {
            if (stageNum >= 1) {
                elements.header.classList.remove('hidden');
            } else {
                elements.header.classList.add('hidden');
            }
        }
        
        // 상태 저장
        Storage.setCurrentStage(stageNum);
        
        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('[Stages] Showing stage', stageNum);
    }
    
    /**
     * 결과 화면 표시
     */
    function showResult() {
        // 모든 단계 숨기기
        for (let i = 0; i <= 5; i++) {
            if (elements[`stage${i}`]) {
                elements[`stage${i}`].classList.add('hidden');
            }
        }
        
        // 결과 화면 표시
        if (elements.resultScreen) {
            elements.resultScreen.classList.remove('hidden');
        }
        
        // 결과 데이터 표시
        displayResults();
    }
    
    /**
     * 결과 데이터 표시
     */
    function displayResults() {
        const data = Storage.getAllData();
        const elapsedSeconds = Timer.getElapsed();
        const hintCount = data.hintCount || 0;
        const penalty = hintCount * 5;
        
        // 점수 계산: (200분 - 소요시간(분)) - (힌트 * 5)
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const baseScore = Math.max(0, 200 - elapsedMinutes);
        const finalScore = Math.max(0, baseScore - penalty);
        
        // 결과 표시
        if (elements.resultTeamName) {
            elements.resultTeamName.textContent = data.teamName || '익명 팀';
        }
        
        if (elements.resultTime) {
            elements.resultTime.textContent = Timer.formatTime(elapsedSeconds);
        }
        
        if (elements.resultHints) {
            elements.resultHints.textContent = `${hintCount}회`;
        }
        
        if (elements.resultPenalty) {
            elements.resultPenalty.textContent = `-${penalty}점`;
        }
        
        if (elements.resultFinalScore) {
            elements.resultFinalScore.textContent = finalScore;
        }
    }
    
    /**
     * 피드백 메시지 표시
     * @param {HTMLElement} feedbackEl - 피드백 요소
     * @param {string} message - 메시지
     * @param {string} type - 타입 (success, error, warning)
     */
    function showFeedback(feedbackEl, message, type = 'error') {
        if (!feedbackEl) return;
        
        feedbackEl.textContent = message;
        feedbackEl.className = `feedback ${type}`;
        feedbackEl.classList.remove('hidden');
        
        // 에러/경고는 3초 후 자동 숨김
        if (type !== 'success') {
            setTimeout(() => {
                feedbackEl.classList.add('hidden');
            }, 3000);
        }
    }
    
    /**
     * 피드백 숨기기
     * @param {HTMLElement} feedbackEl - 피드백 요소
     */
    function hideFeedback(feedbackEl) {
        if (feedbackEl) {
            feedbackEl.classList.add('hidden');
        }
    }
    
    /**
     * Stage 1 이벤트 설정
     */
    function setupStage1() {
        if (elements.stage1Submit) {
            elements.stage1Submit.addEventListener('click', async () => {
                const input = elements.stage1Input?.value || '';
                
                if (!input.trim()) {
                    showFeedback(elements.stage1Feedback, '보안 코드를 입력해주세요.', 'warning');
                    return;
                }
                
                const isValid = await Validation.validateStage1(input);
                
                if (isValid) {
                    showFeedback(elements.stage1Feedback, '✓ 보안 인증 성공! 시스템 접속 허가.', 'success');
                    setTimeout(() => {
                        showStage(2);
                    }, 1500);
                } else {
                    showFeedback(elements.stage1Feedback, '✗ 보안 코드가 올바르지 않습니다.', 'error');
                }
            });
        }
        
        // 엔터키로 제출
        if (elements.stage1Input) {
            elements.stage1Input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    elements.stage1Submit?.click();
                }
            });
        }
        
        // 힌트 버튼
        if (elements.stage1Hint) {
            elements.stage1Hint.addEventListener('click', () => {
                Hints.requestHint(1);
            });
        }
    }
    
    /**
     * Stage 2 이벤트 설정
     */
    function setupStage2() {
        if (elements.stage2Submit) {
            elements.stage2Submit.addEventListener('click', () => {
                const input = elements.stage2Input?.value || '';
                
                if (!input.trim()) {
                    showFeedback(elements.stage2Feedback, '생존 가능 구역을 입력해주세요.', 'warning');
                    return;
                }
                
                const isValid = Validation.validateStage2(input);
                
                if (isValid) {
                    showFeedback(elements.stage2Feedback, '✓ 맞습니다! 황혼 지역을 1차 수색 지점으로 설정합니다...', 'success');
                    setTimeout(() => {
                        showStage(3);
                    }, 2000);
                } else {
                    showFeedback(elements.stage2Feedback, '✗ 다시 생각해보세요. 극한 환경 사이의 경계 지역입니다.', 'error');
                }
            });
        }
        
        if (elements.stage2Input) {
            elements.stage2Input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    elements.stage2Submit?.click();
                }
            });
        }
        
        if (elements.stage2Hint) {
            elements.stage2Hint.addEventListener('click', () => {
                Hints.requestHint(2);
            });
        }
    }
    
    /**
     * Stage 3 이벤트 설정
     */
    function setupStage3() {
        // 위도 입력 시 확정값 동기화
        if (elements.stage3Latitude) {
            const latitudeConfirm = document.getElementById('stage3-latitude-confirm');
            elements.stage3Latitude.addEventListener('input', (e) => {
                if (latitudeConfirm) {
                    latitudeConfirm.textContent = e.target.value || '--';
                }
            });
        }
        
        if (elements.stage3Submit) {
            elements.stage3Submit.addEventListener('click', () => {
                const region = elements.stage3Region?.value || '';
                const latitude = elements.stage3Latitude?.value || '';
                
                if (!region) {
                    showFeedback(elements.stage3Feedback, '구역을 선택해주세요.', 'warning');
                    return;
                }
                
                if (!latitude) {
                    showFeedback(elements.stage3Feedback, '위도를 입력해주세요.', 'warning');
                    return;
                }
                
                const result = Validation.validateStage3(region, latitude);
                
                if (result.isValid) {
                    showFeedback(elements.stage3Feedback, '✓ 구조 포인트 생성 완료! 궤도 진입 시퀀스 가동...', 'success');
                    setTimeout(() => {
                        showStage(4);
                    }, 2000);
                } else {
                    let message = '✗ ';
                    if (!result.regionValid && !result.latitudeValid) {
                        message += '구역과 위도 모두 다시 확인해주세요.';
                    } else if (!result.regionValid) {
                        message += '별 궤적의 특징을 다시 살펴보세요.';
                    } else {
                        message += '위도 계산을 다시 확인해주세요.';
                    }
                    showFeedback(elements.stage3Feedback, message, 'error');
                }
            });
        }
        
        if (elements.stage3Hint) {
            elements.stage3Hint.addEventListener('click', () => {
                Hints.requestHint(3);
            });
        }
    }
    
    /**
     * Stage 4 이벤트 설정
     */
    function setupStage4() {
        // 공전 주기 평균 계산 버튼
        const calcAvgBtn = document.getElementById('calc-avg-btn');
        if (calcAvgBtn) {
            calcAvgBtn.addEventListener('click', () => {
                // 내행성 평균 계산
                const inner1 = parseFloat(document.getElementById('inner-1')?.value) || 0;
                const inner2 = parseFloat(document.getElementById('inner-2')?.value) || 0;
                const inner3 = parseFloat(document.getElementById('inner-3')?.value) || 0;
                const innerAvg = (inner1 + inner2 + inner3) / 3;
                
                const innerAvgEl = document.getElementById('inner-avg');
                if (innerAvgEl) {
                    innerAvgEl.textContent = innerAvg > 0 ? innerAvg.toFixed(1) : '--';
                }
                
                // 외행성 평균 계산
                const outer1 = parseFloat(document.getElementById('outer-1')?.value) || 0;
                const outer2 = parseFloat(document.getElementById('outer-2')?.value) || 0;
                const outer3 = parseFloat(document.getElementById('outer-3')?.value) || 0;
                const outerAvg = (outer1 + outer2 + outer3) / 3;
                
                const outerAvgEl = document.getElementById('outer-avg');
                if (outerAvgEl) {
                    outerAvgEl.textContent = outerAvg > 0 ? outerAvg.toFixed(1) : '--';
                }
                
                console.log('[Stages] Calculated averages - Inner:', innerAvg, 'Outer:', outerAvg);
            });
        }
        
        // 각속도 계산 시 자동 연동
        const calcPeriod = document.getElementById('calc-period');
        const calcSpeed = document.getElementById('calc-speed');
        const calcSpeedDisplay = document.getElementById('calc-speed-display');
        
        if (calcPeriod) {
            calcPeriod.addEventListener('input', (e) => {
                const period = parseFloat(e.target.value) || 0;
                if (period > 0) {
                    const speed = (360 / period).toFixed(1);
                    if (calcSpeed) calcSpeed.value = speed;
                    if (calcSpeedDisplay) calcSpeedDisplay.textContent = speed;
                }
            });
        }
        
        if (calcSpeed) {
            calcSpeed.addEventListener('input', (e) => {
                if (calcSpeedDisplay) {
                    calcSpeedDisplay.textContent = e.target.value || '?';
                }
            });
        }
        
        // 라디오 버튼 변경 시 상세 입력 표시/숨김
        const radioButtons = document.querySelectorAll('input[name="mission-result"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (elements.successDetails) {
                    if (e.target.value === 'success') {
                        elements.successDetails.classList.remove('hidden');
                    } else {
                        elements.successDetails.classList.add('hidden');
                    }
                }
            });
        });
        
        if (elements.stage4Submit) {
            elements.stage4Submit.addEventListener('click', () => {
                const selectedRadio = document.querySelector('input[name="mission-result"]:checked');
                const result = selectedRadio?.value || '';
                
                if (!result) {
                    showFeedback(elements.stage4Feedback, '미션 결과를 선택해주세요.', 'warning');
                    return;
                }
                
                const angle = elements.stage4Angle?.value || '';
                const time = elements.stage4Time?.value || '';
                
                // 추가 데이터 수집
                const attempt1Result = document.getElementById('attempt1-result')?.value || '';
                const attempt1Time = document.getElementById('attempt1-time')?.value || '';
                const attempt2Result = document.getElementById('attempt2-result')?.value || '';
                const attempt2Time = document.getElementById('attempt2-time')?.value || '';
                
                const validation = Validation.validateStage4(result, angle, time);
                
                // Stage 4 데이터 저장 (확장)
                Storage.setStage4Data({
                    ...validation.data,
                    attempts: [
                        { result: attempt1Result, time: attempt1Time },
                        { result: attempt2Result, time: attempt2Time }
                    ]
                });
                
                if (validation.isSuccess) {
                    showFeedback(elements.stage4Feedback, '🎉 축하합니다! 햄스터 로봇이 성공적으로 목표에 도달했습니다!', 'success');
                } else {
                    showFeedback(elements.stage4Feedback, '💪 아쉽지만 괜찮아요. 다음에는 꼭 성공할 거예요! 실제 구조 작전을 진행해봅시다.', 'warning');
                }
                
                setTimeout(() => {
                    showStage(5);
                }, 2000);
            });
        }
        
        if (elements.stage4Hint) {
            elements.stage4Hint.addEventListener('click', () => {
                Hints.requestHint(4);
            });
        }
    }
    
    /**
     * Stage 5 이벤트 설정
     */
    function setupStage5() {
        if (elements.finalCompleteBtn) {
            elements.finalCompleteBtn.addEventListener('click', () => {
                // 타이머 정지
                const finalTime = Timer.stop();
                
                // 완료 상태 저장
                Storage.setCompleted(finalTime);
                
                // 결과 화면 표시
                showResult();
            });
        }
    }
    
    /**
     * 결과 화면 이벤트 설정
     */
    function setupResult() {
        if (elements.restartBtn) {
            elements.restartBtn.addEventListener('click', () => {
                if (confirm('정말 처음부터 다시 시작하시겠습니까?\n모든 진행 상황이 초기화됩니다.')) {
                    // 데이터 초기화
                    Storage.reset();
                    Timer.reset();
                    Hints.reset();
                    
                    // Step 0으로 이동
                    showStage(0);
                    
                    // 페이지 새로고침
                    location.reload();
                }
            });
        }
    }
    
    /**
     * 모든 단계 이벤트 설정
     */
    function setupAllStages() {
        initElements();
        setupStage1();
        setupStage2();
        setupStage3();
        setupStage4();
        setupStage5();
        setupResult();
        
        console.log('[Stages] All stages setup complete');
    }
    
    /**
     * 저장된 단계로 복원
     * @returns {number} 복원된 단계 번호
     */
    function restore() {
        const currentStage = Storage.getCurrentStage();
        
        if (currentStage > 0) {
            showStage(currentStage);
            return currentStage;
        }
        
        return 0;
    }
    
    // Public API
    return {
        initElements,
        showStage,
        showResult,
        showFeedback,
        hideFeedback,
        setupAllStages,
        restore,
        elements
    };
})();
