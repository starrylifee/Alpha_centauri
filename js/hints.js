/**
 * PROXIMA RESCUE COMMAND - Hints Module
 * 힌트 시스템 (문제당 2단계)
 *
 * 1차 힌트는 어디를 봐야 할지 방향만 잡아 주고, 2차 힌트는 답 바로 앞까지 데려간다.
 * 답 자체는 어느 쪽도 적지 않는다 — 마지막 한 걸음은 학생이 딛게 한다.
 * 한 단계를 열 때마다 Scoring.HINT_PENALTY 만큼 깎인다.
 */

const Hints = (function () {

    const MAX_LEVEL = Scoring.MAX_HINT_LEVEL;

    // 단계별 힌트. level1 = 방향 제시(+ 초성), level2 = 답 직전
    //
    // chosung은 답을 직접 적는 문제에만 넣는다. 3단계는 드롭다운 선택과 측정한 숫자,
    // 4단계는 팀마다 다른 계산값이라 초성으로 좁힐 것이 없다.
    const hintData = {
        1: {
            level1: '세 답은 모두 브리핑 영상과 자료 화면에 나와 있습니다. 놓친 부분이 없는지 다시 보고 오세요. 세 답은 띄어쓰기 없이 순서대로 이어 붙여 입력합니다.',
            chosung: '행성 ㅍㄹㅅㅁ + 소문자 1글자 · 별 종류 ㅈㅅㅇㅅ · 거리 4.□□',
            level2: '행성 이름은 별 이름 뒤에 소문자 알파벳이 하나 붙은 형태입니다. 별의 종류는 "크기가 작고 붉은 별"을 뜻하는 네 글자입니다. 거리는 4보다 조금 크고, 소수점 둘째 자리까지 씁니다.'
        },
        2: {
            // 여기서 "조석 고정"이라는 말을 쓰지 않는다 — 앞 화면의 빈칸 답이라 미리 알려주게 된다
            level1: '이 행성은 한쪽 면만 계속 별을 향하고 있습니다. 그쪽은 영원히 낮, 반대쪽은 영원히 밤입니다. 두 곳 다 사람이 살 수 없는 이유를 먼저 생각해 보세요.',
            chosung: 'ㅎㅎ (두 글자)',
            level2: '낮인 곳과 밤인 곳 사이에는 해가 뜨지도 지지도 않는 띠가 있습니다. 지구에서 낮이 밤으로 넘어가는 그 어스름한 무렵을 뭐라고 부르나요? 그 말이 그대로 답입니다.'
        },
        3: {
            level1: '별이 24시간에 30도밖에 안 움직였다면 이 행성의 자전은 아주 느립니다. 그리고 별 궤적 사진을 찍으려면 하늘이 계속 어두워야 합니다. 대원이 어느 구역에 있어야 하는지가 여기서 나옵니다.',
            level2: '별들은 하늘의 한 점을 중심으로 원을 그립니다. 시뮬레이션 룸에서 그 중심점을 찾아, 지평선에서 몇 도 높이에 있는지 재세요. 그 값이 곧 그곳의 위도입니다.'
        },
        4: {
            level1: '로켓이 날아가는 동안에도 조난자는 계속 돕니다. 지금 조난자가 있는 자리를 겨냥해 쏘면, 로켓이 도착했을 때 조난자는 이미 지나가 버립니다. 그럼 어디를 겨냥해야 할까요?',
            level2: '먼저 외행성이 1초에 몇 도를 도는지 구하세요 (한 바퀴는 360도입니다). 거기에 로켓이 날아가는 시간을 곱하면, 로켓이 나는 동안 조난자가 움직이는 각도가 나옵니다. 조난자가 도착 지점보다 그만큼 뒤에 있을 때 발사하세요.'
        }
    };

    // 현재 선택된 단계와, 확인 모달에서 열려는 레벨
    let currentStage = null;
    let pendingLevel = 0;
    let onConfirmCallback = null;

    /**
     * 힌트 시스템 초기화
     */
    function init() {
        console.log('[Hints] Initializing...');

        const cancelBtn = document.getElementById('hint-cancel');
        const confirmBtn = document.getElementById('hint-confirm');
        const closeBtn = document.getElementById('hint-close');
        const moreBtn = document.getElementById('hint-more');
        const confirmModal = document.getElementById('hint-modal');
        const displayModal = document.getElementById('hint-display-modal');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', hideConfirmModal);
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', confirmHint);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', hideDisplayModal);
        }

        // 힌트를 보다가 그래도 막히면 여기서 다음 단계로 올린다
        if (moreBtn) {
            moreBtn.addEventListener('click', function () {
                const stage = currentStage;
                hideDisplayModal();
                requestHint(stage);
            });
        }

        // 배경 클릭시 모달 닫기
        if (confirmModal) {
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) hideConfirmModal();
            });
        }

        if (displayModal) {
            displayModal.addEventListener('click', (e) => {
                if (e.target === displayModal) hideDisplayModal();
            });
        }

        // 감점 안내는 설정값으로 채운다 (HTML에 숫자를 박아두지 않는다)
        updatePenaltyDisplay();

        console.log('[Hints] Initialized successfully');
    }

    /**
     * 각 단계 힌트 버튼의 문구를 지금 상태에 맞게 갱신
     */
    function refreshHintButtons() {
        const penalty = Scoring.HINT_PENALTY;

        Object.keys(hintData).forEach(stage => {
            const btn = document.getElementById(`stage${stage}-hint`);
            if (!btn) return;

            const label = btn.querySelector('span:last-child');
            if (!label) return;

            const level = Storage.getHintLevel(stage);
            if (level >= MAX_LEVEL) {
                label.textContent = '힌트 다시 보기';
            } else if (level === 1) {
                label.textContent = `2차 힌트 보기 (-${penalty}점)`;
            } else {
                label.textContent = `힌트 보기 (-${penalty}점)`;
            }
        });
    }

    /**
     * 힌트 요청
     *
     * 아직 안 본 단계가 남았으면 확인 모달을 띄우고, 이미 다 본 힌트는 감점 없이 바로 보여준다.
     * @param {number} stage - 단계 번호
     * @param {Function} [callback] - 힌트 사용 확인 후 콜백
     */
    function requestHint(stage, callback) {
        console.log('[Hints] requestHint called for stage:', stage);

        if (!hintData[stage]) {
            console.warn('[Hints] No hint available for stage', stage);
            return;
        }

        currentStage = stage;
        onConfirmCallback = callback;

        const level = Storage.getHintLevel(stage);

        // 이미 본 힌트를 다시 보는 것은 감점하지 않는다
        if (level >= MAX_LEVEL) {
            console.log('[Hints] Already at max level, showing for free');
            showHint(stage);
            return;
        }

        pendingLevel = level + 1;
        showConfirmModal(pendingLevel);
    }

    /**
     * 힌트 확인 처리
     */
    function confirmHint() {
        console.log('[Hints] confirmHint, stage:', currentStage, 'level:', pendingLevel);

        hideConfirmModal();

        if (!currentStage || !hintData[currentStage] || !pendingLevel) {
            console.warn('[Hints] confirmHint called with nothing pending');
            return;
        }

        Storage.raiseHintLevel(currentStage, pendingLevel);
        pendingLevel = 0;

        showHint(currentStage);
        updatePenaltyDisplay();

        if (typeof onConfirmCallback === 'function') {
            onConfirmCallback(Storage.getHintCount());
        }
    }

    /**
     * 힌트 표시 (지금까지 연 단계를 모두 보여준다)
     * @param {number} stage - 단계 번호
     */
    function showHint(stage) {
        const level = Storage.getHintLevel(stage);
        const data = hintData[stage];

        if (!data || level < 1) {
            console.warn('[Hints] Nothing to show for stage', stage);
            return;
        }

        const text1 = document.getElementById('hint-text');
        const chosung = document.getElementById('hint-chosung');
        const block2 = document.getElementById('hint-level2');
        const text2 = document.getElementById('hint-text-2');
        const moreBtn = document.getElementById('hint-more');

        if (text1) text1.textContent = data.level1;

        // 초성은 답을 적는 문제에만 있다
        if (chosung) {
            chosung.textContent = data.chosung ? `초성  ${data.chosung}` : '';
            chosung.classList.toggle('hidden', !data.chosung);
        }

        if (block2 && text2) {
            text2.textContent = data.level2;
            block2.classList.toggle('hidden', level < 2);
        }

        // 아직 남은 단계가 있을 때만 "더 자세한 힌트" 버튼을 보인다
        if (moreBtn) {
            moreBtn.classList.toggle('hidden', level >= MAX_LEVEL);
            moreBtn.textContent = `더 자세한 힌트 (-${Scoring.HINT_PENALTY}점)`;
        }

        showDisplayModal();
        console.log('[Hints] Showing stage', stage, 'up to level', level);
    }

    /**
     * 페널티 표시와 버튼 문구 갱신
     */
    function updatePenaltyDisplay() {
        refreshHintButtons();

        const penaltyDisplay = document.getElementById('penalty-display');
        if (!penaltyDisplay) {
            console.warn('[Hints] penalty-display element not found');
            return;
        }

        const penalty = Scoring.penaltyFor(Storage.getHintCount());
        penaltyDisplay.textContent = `-${penalty}점`;
        penaltyDisplay.classList.toggle('has-penalty', penalty > 0);
    }

    /**
     * 확인 모달 표시
     * @param {number} level - 열려는 힌트 레벨
     */
    function showConfirmModal(level) {
        const confirmModal = document.getElementById('hint-modal');
        if (!confirmModal) {
            console.error('[Hints] hint-modal element not found!');
            return;
        }

        const title = document.getElementById('hint-confirm-title');
        const warning = document.getElementById('hint-warning');
        const question = document.getElementById('hint-confirm-question');
        const penalty = Scoring.HINT_PENALTY;

        if (title) {
            title.textContent = level === 1 ? '⚠️ 1차 힌트' : '⚠️ 2차 힌트';
        }

        if (warning) {
            warning.innerHTML = `힌트를 열면 <strong>${penalty}점</strong>이 차감됩니다.`;
        }

        if (question) {
            question.textContent = level === 1
                ? '1차 힌트는 어디를 봐야 할지 방향만 알려줍니다. 조금 더 생각해 보고 열까요?'
                : '2차 힌트는 답 바로 앞까지 알려줍니다. 정말 열까요?';
        }

        confirmModal.classList.remove('hidden');
    }

    /**
     * 확인 모달 숨김
     */
    function hideConfirmModal() {
        const confirmModal = document.getElementById('hint-modal');
        if (confirmModal) confirmModal.classList.add('hidden');
        // currentStage는 유지 (confirmHint에서 사용)
    }

    /**
     * 힌트 표시 모달 보이기
     */
    function showDisplayModal() {
        const displayModal = document.getElementById('hint-display-modal');
        if (displayModal) {
            displayModal.classList.remove('hidden');
        } else {
            console.error('[Hints] hint-display-modal element not found!');
        }
    }

    /**
     * 힌트 표시 모달 숨김
     */
    function hideDisplayModal() {
        const displayModal = document.getElementById('hint-display-modal');
        if (displayModal) displayModal.classList.add('hidden');

        currentStage = null;
        pendingLevel = 0;
        onConfirmCallback = null;
    }

    /**
     * 특정 단계의 힌트 텍스트 가져오기
     * @param {number} stage - 단계 번호
     * @param {number} [level=1] - 힌트 레벨
     * @returns {string|null} 힌트 텍스트
     */
    function getHintText(stage, level) {
        const data = hintData[stage];
        if (!data) return null;
        return (Number(level) >= 2 ? data.level2 : data.level1) || null;
    }

    /**
     * 힌트 사용 여부 확인
     * @param {number} stage - 단계 번호
     * @returns {boolean} 사용 여부
     */
    function isHintUsed(stage) {
        return Storage.isHintUsed(stage);
    }

    /**
     * 힌트 상태 초기화 (저장소는 Storage.reset이 지운다)
     */
    function reset() {
        currentStage = null;
        pendingLevel = 0;
        onConfirmCallback = null;
    }

    /**
     * 현재 페널티 점수 가져오기
     * @returns {number} 페널티 점수
     */
    function getPenalty() {
        return Scoring.penaltyFor(Storage.getHintCount());
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
        getPenalty
    };
})();
