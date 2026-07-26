/**
 * PROXIMA RESCUE COMMAND - Storage Module
 * LocalStorage 관리 시스템
 */

const Storage = (function() {
    const STORAGE_KEY = 'proxima_rescue_data';
    
    // 기본 데이터 구조
    const defaultData = {
        currentStage: 0,
        startTimestamp: null,
        elapsedTime: 0,
        hintCount: 0,
        usedHints: [],
        teamName: '',
        stageData: {
            stage4: {
                result: null,
                angle: null,
                time: null
            }
        },
        // 새로고침 복원용. formValues는 입력칸 id -> 값, phases는 단계 번호 -> 화면 번호
        formValues: {},
        phases: {},
        isCompleted: false,
        completedTimestamp: null
    };
    
    /**
     * 저장된 데이터 불러오기
     * @returns {Object} 게임 데이터
     */
    function load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Storage load error:', e);
        }
        return { ...defaultData };
    }
    
    /**
     * 데이터 저장
     * @param {Object} data - 저장할 데이터
     */
    function save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Storage save error:', e);
        }
    }
    
    /**
     * 특정 필드 업데이트
     * @param {string} key - 필드 키
     * @param {*} value - 값
     */
    function update(key, value) {
        const data = load();
        data[key] = value;
        save(data);
        return data;
    }
    
    /**
     * 여러 필드 한번에 업데이트
     * @param {Object} updates - 업데이트할 필드들
     */
    function updateMultiple(updates) {
        const data = load();
        Object.assign(data, updates);
        save(data);
        return data;
    }
    
    /**
     * 현재 단계 가져오기
     * @returns {number} 현재 단계
     */
    function getCurrentStage() {
        return load().currentStage;
    }
    
    /**
     * 현재 단계 설정
     * @param {number} stage - 단계 번호
     */
    function setCurrentStage(stage) {
        return update('currentStage', stage);
    }
    
    /**
     * 시작 시간 설정
     */
    function setStartTime() {
        const data = load();
        if (!data.startTimestamp) {
            data.startTimestamp = Date.now();
            save(data);
        }
        return data.startTimestamp;
    }
    
    /**
     * 시작 시간 가져오기
     * @returns {number|null} 시작 타임스탬프
     */
    function getStartTime() {
        return load().startTimestamp;
    }
    
    /**
     * 경과 시간 저장 (새로고침 대비)
     * @param {number} elapsed - 경과 시간 (초)
     */
    function saveElapsedTime(elapsed) {
        return update('elapsedTime', elapsed);
    }
    
    /**
     * 저장된 경과 시간 가져오기
     * @returns {number} 경과 시간 (초)
     */
    function getElapsedTime() {
        return load().elapsedTime;
    }
    
    /**
     * 힌트 사용 횟수 증가
     * @returns {number} 증가된 힌트 횟수
     */
    function incrementHintCount() {
        const data = load();
        data.hintCount = (data.hintCount || 0) + 1;
        save(data);
        return data.hintCount;
    }
    
    /**
     * 힌트 사용 횟수 가져오기
     * @returns {number} 힌트 사용 횟수
     */
    function getHintCount() {
        return load().hintCount || 0;
    }

    /**
     * 해당 단계 힌트를 이미 봤는지 확인
     * (새로고침해도 유지되므로 같은 힌트로 두 번 감점되지 않는다)
     * @param {number} stage - 단계 번호
     * @returns {boolean} 사용 여부
     */
    function isHintUsed(stage) {
        const used = load().usedHints || [];
        return used.includes(Number(stage));
    }

    /**
     * 해당 단계 힌트를 봤다고 기록
     * @param {number} stage - 단계 번호
     */
    function markHintUsed(stage) {
        const data = load();
        const used = data.usedHints || [];

        if (!used.includes(Number(stage))) {
            used.push(Number(stage));
            data.usedHints = used;
            save(data);
        }
        return used;
    }
    
    /**
     * 팀 이름 설정
     * @param {string} name - 팀 이름
     */
    function setTeamName(name) {
        return update('teamName', name);
    }
    
    /**
     * 팀 이름 가져오기
     * @returns {string} 팀 이름
     */
    function getTeamName() {
        return load().teamName || '';
    }
    
    /**
     * Stage 4 데이터 저장
     * @param {Object} stageData - 단계 데이터
     */
    function setStage4Data(stageData) {
        const data = load();
        data.stageData = data.stageData || {};
        data.stageData.stage4 = stageData;
        save(data);
        return data;
    }
    
    /**
     * Stage 4 데이터 가져오기
     * @returns {Object} Stage 4 데이터
     */
    function getStage4Data() {
        const data = load();
        return data.stageData?.stage4 || { result: null, angle: null, time: null };
    }
    
    /**
     * 입력칸 값 저장 (새로고침 복원용)
     * @param {string} id - 입력 요소의 id
     * @param {string} value - 입력값
     */
    function saveFormValue(id, value) {
        const data = load();
        data.formValues = data.formValues || {};
        data.formValues[id] = value;
        save(data);
        return data;
    }

    /**
     * 저장된 입력칸 값 전체
     * @returns {Object} { id: value }
     */
    function getFormValues() {
        return load().formValues || {};
    }

    /**
     * 단계 안에서 지금 보고 있는 화면(Phase) 저장
     * @param {number} stage - 단계 번호
     * @param {number} phase - 화면 번호 (1부터)
     */
    function setStagePhase(stage, phase) {
        const data = load();
        data.phases = data.phases || {};
        data.phases[stage] = phase;
        save(data);
        return data;
    }

    /**
     * 저장된 화면 번호 (없으면 1)
     * @param {number} stage - 단계 번호
     * @returns {number} 화면 번호
     */
    function getStagePhase(stage) {
        return (load().phases || {})[stage] || 1;
    }

    /**
     * 게임 완료 처리
     * @param {number} finalTime - 최종 시간 (초)
     */
    function setCompleted(finalTime) {
        return updateMultiple({
            isCompleted: true,
            completedTimestamp: Date.now(),
            elapsedTime: finalTime
        });
    }
    
    /**
     * 완료 여부 확인
     * @returns {boolean} 완료 여부
     */
    function isCompleted() {
        return load().isCompleted || false;
    }
    
    /**
     * 모든 데이터 초기화
     */
    function reset() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Storage reset error:', e);
        }
        return { ...defaultData };
    }
    
    /**
     * 저장된 데이터 존재 여부 확인
     * @returns {boolean} 데이터 존재 여부
     */
    function hasData() {
        try {
            return localStorage.getItem(STORAGE_KEY) !== null;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 전체 데이터 가져오기
     * @returns {Object} 전체 게임 데이터
     */
    function getAllData() {
        return load();
    }
    
    // Public API
    return {
        load,
        save,
        update,
        updateMultiple,
        getCurrentStage,
        setCurrentStage,
        setStartTime,
        getStartTime,
        saveElapsedTime,
        getElapsedTime,
        incrementHintCount,
        getHintCount,
        isHintUsed,
        markHintUsed,
        setTeamName,
        getTeamName,
        setStage4Data,
        getStage4Data,
        saveFormValue,
        getFormValues,
        setStagePhase,
        getStagePhase,
        setCompleted,
        isCompleted,
        reset,
        hasData,
        getAllData
    };
})();
