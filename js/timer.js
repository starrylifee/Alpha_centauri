/**
 * PROXIMA RESCUE COMMAND - Timer Module
 * 타이머 시스템
 */

const Timer = (function() {
    let timerInterval = null;
    let startTime = null;
    let elapsedSeconds = 0;
    let isRunning = false;
    let isPaused = false;
    
    const timerDisplay = document.getElementById('timer');
    
    /**
     * 시간을 MM:SS 형식으로 포맷팅
     * @param {number} totalSeconds - 총 초
     * @returns {string} 포맷팅된 시간 문자열
     */
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    /**
     * 디스플레이 업데이트
     */
    function updateDisplay() {
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(elapsedSeconds);
        }
    }
    
    /**
     * 틱 처리 (1초마다 호출)
     */
    function tick() {
        elapsedSeconds++;
        updateDisplay();
        
        // 주기적으로 LocalStorage에 저장 (10초마다)
        if (elapsedSeconds % 10 === 0) {
            Storage.saveElapsedTime(elapsedSeconds);
        }
    }
    
    /**
     * 타이머 시작
     * @param {number} savedElapsed - 저장된 경과 시간 (복원용)
     */
    function start(savedElapsed = 0) {
        if (isRunning) return;
        
        elapsedSeconds = savedElapsed;
        startTime = Date.now() - (elapsedSeconds * 1000);
        isRunning = true;
        isPaused = false;
        
        // 시작 시간 저장
        Storage.setStartTime();
        
        updateDisplay();
        
        timerInterval = setInterval(tick, 1000);
        
        console.log('[Timer] Started at', elapsedSeconds, 'seconds');
    }
    
    /**
     * 타이머 정지
     * @returns {number} 최종 경과 시간
     */
    function stop() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        isRunning = false;
        
        // 최종 시간 저장
        Storage.saveElapsedTime(elapsedSeconds);
        
        console.log('[Timer] Stopped at', elapsedSeconds, 'seconds');
        
        return elapsedSeconds;
    }
    
    /**
     * 타이머 일시정지
     */
    function pause() {
        if (!isRunning || isPaused) return;
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        isPaused = true;
        Storage.saveElapsedTime(elapsedSeconds);
        
        console.log('[Timer] Paused at', elapsedSeconds, 'seconds');
    }
    
    /**
     * 타이머 재개
     */
    function resume() {
        if (!isPaused) return;
        
        isPaused = false;
        timerInterval = setInterval(tick, 1000);
        
        console.log('[Timer] Resumed at', elapsedSeconds, 'seconds');
    }
    
    /**
     * 타이머 리셋
     */
    function reset() {
        stop();
        elapsedSeconds = 0;
        startTime = null;
        updateDisplay();
        
        console.log('[Timer] Reset');
    }
    
    /**
     * 현재 경과 시간 가져오기
     * @returns {number} 경과 시간 (초)
     */
    function getElapsed() {
        return elapsedSeconds;
    }
    
    /**
     * 포맷팅된 현재 시간 가져오기
     * @returns {string} 포맷팅된 시간
     */
    function getFormattedTime() {
        return formatTime(elapsedSeconds);
    }
    
    /**
     * 타이머 실행 여부 확인
     * @returns {boolean} 실행 여부
     */
    function getIsRunning() {
        return isRunning;
    }
    
    /**
     * 저장된 시간으로 복원
     */
    function restore() {
        const savedElapsed = Storage.getElapsedTime();
        const savedStart = Storage.getStartTime();
        
        if (savedStart && savedElapsed > 0) {
            elapsedSeconds = savedElapsed;
            updateDisplay();
            
            console.log('[Timer] Restored to', elapsedSeconds, 'seconds');
            
            return true;
        }
        
        return false;
    }
    
    // Public API
    return {
        start,
        stop,
        pause,
        resume,
        reset,
        getElapsed,
        getFormattedTime,
        getIsRunning,
        restore,
        formatTime,
        updateDisplay
    };
})();
