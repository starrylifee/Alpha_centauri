/**
 * PROXIMA RESCUE COMMAND - Hints Module
 * 힌트 시스템
 */

const Hints = (function () {

    // 단계별 힌트 데이터 (적절한 힌트로 수정)
    const hintData = {
        1: {
            text: '💡 힌트 1: 행성 이름은 "프록시마b"입니다. 별의 종류는 크기가 작고 빨간색인 "적색왜성"입니다. 거리는 "4.24"광년입니다. 세 답을 띄어쓰기 없이 순서대로 입력하세요!',
            used: false
        },
        2: {
            text: '💡 힌트 2: 조석 고정된 행성에서 항상 낮인 곳(너무 뜨거움)과 항상 밤인 곳(너무 추움) 사이에 있는 지역을 생각해보세요. 해가 뜨지도 지지도 않는 그 경계 지역의 이름은 "황혼" 지역입니다! (Twilight Zone)',
            used: false
        },
        3: {
            text: '💡 힌트 3: 24시간 동안 별이 30도밖에 안 돌았으니 자전이 매우 느린 겁니다! 그리고 별 사진을 찍으려면 계속 어두워야 하니 대원은 "밤의 지역"에 있겠죠? 시뮬레이션 룸에서 북극성 고도를 측정하면 그게 바로 위도입니다!',
            used: false
        },
        4: {
            text: '💡 힌트 4: 로켓이 날아가는 동안 외행성(조난자)도 움직입니다! 스톱워치로 내행성과 외행성의 공전 시간을 재보세요. 로켓 비행 시간 동안 외행성이 움직이는 각도만큼, 외행성이 도착점보다 "뒤에" 있을 때 발사해야 합니다!',
            used: false
        }
    };

    // 현재 선택된 단계
    let currentStage = null;
    let onConfirmCallback = null;

    /**
     * 힌트 시스템 초기화
     */
    function init() {
        console.log('[Hints] Initializing...');

        // 힌트 확인 모달 버튼 이벤트
        const cancelBtn = document.getElementById('hint-cancel');
        const confirmBtn = document.getElementById('hint-confirm');
        const closeBtn = document.getElementById('hint-close');
        const confirmModal = document.getElementById('hint-modal');
        const displayModal = document.getElementById('hint-display-modal');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                console.log('[Hints] Cancel clicked');
                hideConfirmModal();
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                console.log('[Hints] Confirm clicked, currentStage:', currentStage);
                confirmHint();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                console.log('[Hints] Close clicked');
                hideDisplayModal();
            });
        }

        // 배경 클릭시 모달 닫기
        if (confirmModal) {
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    hideConfirmModal();
                }
            });
        }

        if (displayModal) {
            displayModal.addEventListener('click', (e) => {
                if (e.target === displayModal) {
                    hideDisplayModal();
                }
            });
        }

        // 페널티 표시 업데이트
        updatePenaltyDisplay();

        console.log('[Hints] Initialized successfully');
    }

    /**
     * 힌트 요청 (확인 모달 표시)
     * @param {number} stage - 단계 번호
     * @param {Function} callback - 힌트 사용 확인 후 콜백
     */
    function requestHint(stage, callback) {
        console.log('[Hints] requestHint called for stage:', stage);

        if (!hintData[stage]) {
            console.warn('[Hints] No hint available for stage', stage);
            return;
        }

        currentStage = stage;
        onConfirmCallback = callback;

        showConfirmModal();
    }

    /**
     * 힌트 확인 처리
     */
    function confirmHint() {
        console.log('[Hints] confirmHint called, currentStage:', currentStage);

        hideConfirmModal();

        if (currentStage && hintData[currentStage]) {
            // 힌트 사용 횟수 증가
            const hintCount = Storage.incrementHintCount();
            console.log('[Hints] Hint count incremented to:', hintCount);

            // 힌트 표시
            showHint(currentStage);

            // 페널티 표시 업데이트
            updatePenaltyDisplay();

            // 보너스 프로그램 체크
            checkBonusProgram();

            // 콜백 실행
            if (typeof onConfirmCallback === 'function') {
                onConfirmCallback(hintCount);
            }

            console.log('[Hints] Hint used for stage', currentStage, '- Total hints:', hintCount);
        } else {
            console.warn('[Hints] confirmHint called but currentStage is:', currentStage);
        }
    }

    /**
     * 힌트 표시
     * @param {number} stage - 단계 번호
     */
    function showHint(stage) {
        console.log('[Hints] showHint called for stage:', stage);

        const hintText = document.getElementById('hint-text');

        if (hintData[stage] && hintText) {
            hintText.textContent = hintData[stage].text;
            hintData[stage].used = true;
            showDisplayModal();
            console.log('[Hints] Hint displayed:', hintData[stage].text.substring(0, 50) + '...');
        } else {
            console.warn('[Hints] Could not show hint. hintData:', !!hintData[stage], 'hintText:', !!hintText);
        }
    }

    /**
     * 페널티 표시 업데이트
     */
    function updatePenaltyDisplay() {
        const penaltyDisplay = document.getElementById('penalty-display');
        if (penaltyDisplay) {
            const hintCount = Storage.getHintCount();
            const penalty = hintCount * 5;
            penaltyDisplay.textContent = `-${penalty}점`;

            console.log('[Hints] Penalty display updated:', `-${penalty}점`);

            // 페널티가 있으면 강조
            if (penalty > 0) {
                penaltyDisplay.classList.add('has-penalty');
            } else {
                penaltyDisplay.classList.remove('has-penalty');
            }
        } else {
            console.warn('[Hints] penalty-display element not found');
        }
    }

    /**
     * 보너스 프로그램 체크 (-30점 이상 감점 시)
     */
    function checkBonusProgram() {
        const hintCount = Storage.getHintCount();
        const penalty = hintCount * 5;

        console.log('[Hints] Checking bonus program. Penalty:', penalty);

        // -30점 이상 감점 시 보너스 프로그램 표시
        if (penalty >= 30) {
            showBonusProgram();
        }
    }

    /**
     * 보너스 프로그램 표시
     */
    function showBonusProgram() {
        const bonusModal = document.getElementById('bonus-modal');
        if (bonusModal) {
            bonusModal.classList.remove('hidden');
            console.log('[Hints] Bonus program modal shown');
        }
    }

    /**
     * 확인 모달 표시
     */
    function showConfirmModal() {
        const confirmModal = document.getElementById('hint-modal');
        if (confirmModal) {
            confirmModal.classList.remove('hidden');
            console.log('[Hints] Confirm modal shown');
        } else {
            console.error('[Hints] hint-modal element not found!');
        }
    }

    /**
     * 확인 모달 숨김
     */
    function hideConfirmModal() {
        const confirmModal = document.getElementById('hint-modal');
        if (confirmModal) {
            confirmModal.classList.add('hidden');
            console.log('[Hints] Confirm modal hidden');
        }
        // currentStage는 유지 (confirmHint에서 사용)
    }

    /**
     * 힌트 표시 모달 보이기
     */
    function showDisplayModal() {
        const displayModal = document.getElementById('hint-display-modal');
        if (displayModal) {
            displayModal.classList.remove('hidden');
            console.log('[Hints] Display modal shown');
        } else {
            console.error('[Hints] hint-display-modal element not found!');
        }
    }

    /**
     * 힌트 표시 모달 숨김
     */
    function hideDisplayModal() {
        const displayModal = document.getElementById('hint-display-modal');
        if (displayModal) {
            displayModal.classList.add('hidden');
            console.log('[Hints] Display modal hidden');
        }
        // 모달 닫을 때 currentStage 초기화
        currentStage = null;
        onConfirmCallback = null;
    }

    /**
     * 특정 단계의 힌트 텍스트 가져오기
     * @param {number} stage - 단계 번호
     * @returns {string|null} 힌트 텍스트
     */
    function getHintText(stage) {
        return hintData[stage]?.text || null;
    }

    /**
     * 힌트 사용 여부 확인
     * @param {number} stage - 단계 번호
     * @returns {boolean} 사용 여부
     */
    function isHintUsed(stage) {
        return hintData[stage]?.used || false;
    }

    /**
     * 모든 힌트 초기화
     */
    function reset() {
        Object.keys(hintData).forEach(stage => {
            hintData[stage].used = false;
        });
        currentStage = null;
        onConfirmCallback = null;
    }

    /**
     * 현재 페널티 점수 가져오기
     * @returns {number} 페널티 점수
     */
    function getPenalty() {
        return Storage.getHintCount() * 5;
    }

    // Public API
    return {
        init,
        requestHint,
        showHint,
        getHintText,
        isHintUsed,
        reset,
        updatePenaltyDisplay,
        checkBonusProgram,
        getPenalty
    };
})();
