/**
 * PROXIMA RESCUE COMMAND - Scoring Config
 * 점수 설정 - 수업 상황에 맞게 여기만 고치면 화면·보고서에 모두 반영됩니다.
 */

const Scoring = (function () {

    // 제한 시간(분). 최종 점수 = (제한시간 - 소요시간) - (힌트 감점)
    // 9시~12시 30분 수업 기준, 앱에 실제 누적되는 시간은 135~150분 정도로 잡았습니다.
    // 쉬는 시간에는 홈 버튼을 눌러 타이머를 멈추게 하세요.
    const MAX_TIME_MINUTES = 250;

    // 힌트는 한 문제당 두 단계다.
    //   1차 = 방향만 알려주는 힌트, 2차 = 답 직전까지 알려주는 힌트
    // 한 단계를 열 때마다 아래 점수가 깎인다. 한 문제를 끝까지 보면 5 + 5 = 10점.
    const HINT_PENALTY = 5;
    const MAX_HINT_LEVEL = 2;

    /**
     * 힌트 감점 계산
     * @param {number} hintCount - 열어본 힌트 단계의 총합 (문제 수가 아니라 단계 수)
     * @returns {number} 감점
     */
    function penaltyFor(hintCount) {
        return (hintCount || 0) * HINT_PENALTY;
    }

    /**
     * 최종 점수 계산
     * @param {number} elapsedSeconds - 경과 시간(초)
     * @param {number} hintCount - 힌트 사용 횟수
     * @returns {{elapsedMinutes: number, baseScore: number, penalty: number, finalScore: number}}
     */
    function calculate(elapsedSeconds, hintCount) {
        const elapsedMinutes = Math.floor((elapsedSeconds || 0) / 60);
        const baseScore = Math.max(0, MAX_TIME_MINUTES - elapsedMinutes);
        const penalty = penaltyFor(hintCount);

        return {
            elapsedMinutes,
            baseScore,
            penalty,
            finalScore: Math.max(0, baseScore - penalty)
        };
    }

    // Public API
    return {
        MAX_TIME_MINUTES,
        HINT_PENALTY,
        MAX_HINT_LEVEL,
        penaltyFor,
        calculate
    };
})();
