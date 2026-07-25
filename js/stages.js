/**
 * PROXIMA RESCUE COMMAND - Stages Module
 * 각 단계별 로직
 */

const Stages = (function () {

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

    // 비밀번호 설정
    const STAGE_PASSWORDS = {
        2: 'ZEBRA',
        3: 'PIZZA',
        4: 'JAZZ'
    };
    const ADMIN_PASSWORD = 'tlsekq';

    /**
     * 비밀번호 확인 및 단계 이동
     * @param {number} targetStage - 이동할 단계
     */
    function checkStagePassword(targetStage) {
        // 이미 클리어한 단계거나 비밀번호가 없는 단계는 바로 이동
        if (targetStage <= 1 || !STAGE_PASSWORDS[targetStage]) {
            showStage(targetStage);
            return;
        }

        const modal = document.getElementById('password-modal');
        const input = document.getElementById('stage-password-input');
        const submitBtn = document.getElementById('password-submit-btn');
        const errorMsg = document.getElementById('password-error');

        if (!modal || !input || !submitBtn) return;

        // 모달 표시
        modal.classList.remove('hidden');
        input.value = '';
        errorMsg.classList.add('hidden');
        input.focus();

        // 닫기 핸들러
        const closeModal = () => {
            modal.classList.add('hidden');
            // 이벤트 리스너 정리
            submitBtn.onclick = null;
            input.onkeypress = null;
            modal.onclick = null;
            document.removeEventListener('keydown', handleEsc);
            if (closeBtn) closeBtn.onclick = null;
        };

        // 이벤트 핸들러 (중복 방지)
        const handleSubmit = () => {
            const password = input.value.trim();

            if (password.toUpperCase() === STAGE_PASSWORDS[targetStage]) {
                closeModal();
                showStage(targetStage);
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

        // 기존 리스너 제거 후 추가
        submitBtn.onclick = handleSubmit;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') handleSubmit();
        };
        document.addEventListener('keydown', handleEsc);
    }

    /**
     * 관리자 모달 표시
     */
    function showAdminModal() {
        const modal = document.getElementById('admin-modal');
        const closeBtn = document.getElementById('admin-close-btn');
        const headerCloseBtn = modal?.querySelector('.modal-close-btn');

        if (modal) {
            modal.classList.remove('hidden');

            const close = () => {
                modal.classList.add('hidden');
                document.removeEventListener('keydown', handleEsc);
            };

            const handleEsc = (e) => {
                if (e.key === 'Escape') close();
            };

            if (closeBtn) closeBtn.onclick = close;
            if (headerCloseBtn) headerCloseBtn.onclick = close;

            modal.onclick = (e) => {
                if (e.target === modal) close();
            };

            document.addEventListener('keydown', handleEsc);
        }
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

        // 호만 전이 시뮬레이션은 스테이지 4에서만 돌린다 (배터리·발열 절약)
        if (typeof HohmannSim !== 'undefined') {
            HohmannSim.setActive(stageNum === 4);
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

        // 결과 화면에서는 시뮬레이션도 멈춘다
        if (typeof HohmannSim !== 'undefined') {
            HohmannSim.setActive(false);
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
                const trimmedInput = input.trim();

                // 관리자 코드(마스터 키) 확인 -> 바로 통과
                if (trimmedInput === ADMIN_PASSWORD) {
                    showFeedback(elements.stage1Feedback, '✓ 마스터 키 승인. 시스템 접속 허가.', 'success');
                    // 보고서용 정답 데이터 저장
                    Storage.update('securityCode', '프록시마b적색왜성4.24');
                    setTimeout(() => {
                        checkStagePassword(2);
                    }, 1000);
                    return;
                }

                if (!trimmedInput) {
                    showFeedback(elements.stage1Feedback, '보안 코드를 입력해주세요.', 'warning');
                    return;
                }

                const isValid = await Validation.validateStage1(trimmedInput);

                if (isValid) {
                    showFeedback(elements.stage1Feedback, '✓ 보안 인증 성공! 시스템 접속 허가.', 'success');
                    setTimeout(() => {
                        checkStagePassword(2);
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
     * 관리자 버튼 설정
     */
    function setupAdminButton() {
        const adminBtn = document.getElementById('admin-mode-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                // 비밀번호 모달 재사용
                const modal = document.getElementById('password-modal');
                const input = document.getElementById('stage-password-input');
                const submitBtn = document.getElementById('password-submit-btn');
                const errorMsg = document.getElementById('password-error');
                const title = modal.querySelector('.modal-header h2');
                const instruction = modal.querySelector('.password-instruction');

                if (!modal || !input || !submitBtn) return;

                // 모달 UI 설정 (관리자용)
                const originalTitle = title.textContent;
                const originalInstruction = instruction.textContent;

                title.textContent = '🔑 관리자 로그인';
                instruction.textContent = '관리자 접근 권한을 확인합니다.';

                modal.classList.remove('hidden');
                input.value = '';
                errorMsg.classList.add('hidden');
                input.focus();

                const handleAdminLogin = () => {
                    if (input.value.trim() === ADMIN_PASSWORD) {
                        modal.classList.add('hidden');
                        showAdminModal();

                        // UI 복구 및 리스너 제거
                        title.textContent = originalTitle;
                        instruction.textContent = originalInstruction;
                        submitBtn.removeEventListener('click', handleAdminLogin);
                    } else {
                        errorMsg.classList.remove('hidden');
                        input.value = '';
                        input.focus();
                    }
                };

                submitBtn.onclick = handleAdminLogin;

                input.onkeypress = (e) => {
                    if (e.key === 'Enter') handleAdminLogin();
                };

                // 모달 닫힐 때 UI 복구 (배경 클릭 등 고려 필요하지만 여기선 생략하거나 간단히 처리)
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
                const reason = document.getElementById('stage2-reason')?.value || '';

                if (!input.trim()) {
                    showFeedback(elements.stage2Feedback, '생존 가능 구역을 입력해주세요.', 'warning');
                    return;
                }

                if (!reason.trim()) {
                    showFeedback(elements.stage2Feedback, '선정 이유를 적어주세요.', 'warning');
                    return;
                }

                const isValid = Validation.validateStage2(input);

                if (isValid) {
                    // 보고서용 데이터 저장
                    Storage.update('stage2Data', {
                        starType: '적색왜성 (Red Dwarf)',
                        planetRotation: '동주기 자전 (Tidal Locking)',
                        survivalZone: input,
                        reason: reason
                    });
                    showFeedback(elements.stage2Feedback, '✓ 맞습니다! 황혼 지역을 1차 수색 지점으로 설정합니다...', 'success');
                    setTimeout(() => {
                        checkStagePassword(3);
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
        // 별의 이동 각도 입력 (Phase 1)
        const checkAngleBtn = document.getElementById('check-angle-btn');
        if (checkAngleBtn) {
            checkAngleBtn.addEventListener('click', () => {
                const angleInput = document.getElementById('star-angle-input');
                const angle = angleInput?.value || '';

                // 보고서용 데이터 임시 저장
                if (angle) {
                    Storage.update('stage3Angle', angle);
                }
            });
        }

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
                    // 구역 텍스트 가져오기
                    const regionSelect = document.getElementById('stage3-region');
                    const regionText = regionSelect.options[regionSelect.selectedIndex].text;

                    // 저장된 각도 사용 (Phase 1 정답이 30도)
                    const starAngle = Storage.getAllData().stage3Angle || '30';

                    // 자전 속도 = 24시간 동안 움직인 각도 / 24
                    // 지구는 360/24 = 15도/시간, 이 행성은 30/24 = 1.25도/시간으로 훨씬 느리다
                    const angleNum = parseFloat(starAngle);
                    const rotationSpeed = isNaN(angleNum)
                        ? '-'
                        : `${(angleNum / 24).toFixed(2)}도/시간`;

                    // 보고서용 데이터 저장
                    Storage.update('stage3Data', {
                        region: region,
                        latitude: latitude,
                        angle: starAngle + '도', // 사용자 입력값
                        speed: rotationSpeed,   // 입력 각도에서 계산
                        location: regionText,   // 선택한 구역 텍스트
                    });
                    showFeedback(elements.stage3Feedback, '✓ 구조 포인트 생성 완료! 궤도 진입 시퀀스 가동...', 'success');
                    setTimeout(() => {
                        checkStagePassword(4);
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

                // 보고서용 데이터 저장
                Storage.update('stage4Averages', {
                    inner: innerAvg,
                    outer: outerAvg
                });
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


        // Simulation Check (Phase 1)
        // Simulation Check (Phase 1)
        const simFailBtn = document.getElementById('sim-fail-btn');
        // Stage 4의 Phase 1 버튼만 선택하도록 수정
        const phase1NextBtn = document.querySelector('#step-4 .stage-phase.phase-1 .btn-next');

        if (phase1NextBtn) {
            // 초기에는 비활성화 (CSS로 스타일링 필요할 수 있음)
            phase1NextBtn.style.opacity = '0.5';
            phase1NextBtn.style.pointerEvents = 'none';
        }

        if (simFailBtn && phase1NextBtn) {
            simFailBtn.addEventListener('click', () => {
                // 시뮬레이션 버튼 클릭 시 다음 버튼 활성화
                phase1NextBtn.style.opacity = '1';
                phase1NextBtn.style.pointerEvents = 'auto';
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
     * PDF 보고서 생성
     */
    async function generateReport() {
        const data = Storage.getAllData();
        const template = document.getElementById('report-template');

        if (!template) return;

        // 라이브러리 로드 실패 시 조용히 아무 일도 안 일어나는 것을 막는다
        if (typeof html2canvas === 'undefined' || !window.jspdf) {
            alert('보고서 생성 도구를 불러오지 못했습니다.\n페이지를 새로고침한 뒤 다시 시도해주세요.');
            return;
        }

        // 데이터 채우기
        document.getElementById('report-team').textContent = data.teamName || '익명 팀';
        document.getElementById('report-date').textContent = new Date().toLocaleDateString();
        document.getElementById('report-time').textContent = Timer.formatTime(Timer.getElapsed());

        // Stage 2
        const s2 = data.stage2Data || {};
        document.getElementById('report-q1').textContent = s2.starType || '적색왜성';
        document.getElementById('report-q2').textContent = s2.planetRotation || '동주기 자전';
        document.getElementById('report-zone').textContent = s2.survivalZone || '-';
        document.getElementById('report-reason').textContent = s2.reason || '-';

        // Stage 3
        const s3 = data.stage3Data || {};
        document.getElementById('report-angle').textContent = s3.angle || '-';
        document.getElementById('report-speed').textContent = s3.speed || '-';
        document.getElementById('report-location').textContent = s3.location || '-';
        document.getElementById('report-latitude').textContent = s3.latitude || '-';

        // Stage 4
        const s4Avg = data.stage4Averages || {};
        const s4Data = data.stageData?.stage4 || {};

        document.getElementById('report-inner').textContent = s4Avg.inner ? s4Avg.inner.toFixed(1) : '-';
        document.getElementById('report-outer').textContent = s4Avg.outer ? s4Avg.outer.toFixed(1) : '-';

        // 발사 윈도우 (계산된 각도)
        const launchAngle = s4Data.angle || '-';
        const transferWindowEl = document.querySelector('#report-template .report-section:nth-child(4) p:nth-child(4)'); // Transfer Window 요소 찾기 (기존 템플릿에 ID가 없어서 추가 필요하거나 선택자 사용)

        // 템플릿에 ID가 없으므로 querySelector로 접근 시도, 실패 시 무시
        // 더 정확하게는 HTML 템플릿을 수정하여 ID를 부여하는 것이 좋음.
        // 여기서는 기존 'CALCULATED' 텍스트를 대체하기 위해 HTML 수정 없이 JS로 처리 시도.
        // 하지만 HTML 수정이 더 깔끔함. 일단 JS로 처리.
        const reportBody = template.querySelector('.report-body');
        const stage4Section = reportBody.querySelectorAll('.report-section')[3]; // 4번째 섹션
        if (stage4Section) {
            const pTags = stage4Section.querySelectorAll('p');
            if (pTags[2]) pTags[2].innerHTML = `<strong>Transfer Window:</strong> ${launchAngle}도 (계산됨)`;
        }

        // PDF 생성
        template.classList.remove('hidden');

        try {
            const canvas = await html2canvas(template.querySelector('.report-container'), {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Proxima_Mission_Report_${data.teamName || 'Team'}.pdf`);

        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('보고서 생성 중 오류가 발생했습니다.');
        } finally {
            template.classList.add('hidden');
        }
    }

    /**
     * 결과 화면 이벤트 설정
     */
    function setupResult() {
        // 보고서 다운로드 버튼
        const downloadBtn = document.getElementById('download-report-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', generateReport);
        }
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
        setupAdminButton();

        // 페이즈 이동(.btn-next / .btn-prev)은 main.js의 setupPhaseSystem()이
        // document 위임으로 한 곳에서만 처리한다.
        // 예전에는 여기서도 버튼마다 리스너를 붙였는데, 버튼 리스너가 먼저 실행돼
        // 화면을 넘긴 뒤에 main.js가 뒤늦게 검증하는 바람에 검증이 무력화됐다.

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
        checkStagePassword,
        ADMIN_PASSWORD,
        elements
    };
})();
