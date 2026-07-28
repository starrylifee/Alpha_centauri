/**
 * PROXIMA RESCUE COMMAND - Validation Module
 * 정답 검증 로직
 *
 * 정답 문자열은 vault.js 에 섞어서 보관한다. 학생이 '소스 보기'로
 * 정답을 읽는 것을 막기 위한 것으로, 바꾸려면 worksheets/make_vault.py 를 본다.
 */

const Validation = (function() {

    /**
     * 마스터 코드 확인 (모든 단계 통과용)
     *
     * 평문 비교 대신 Auth(서버 함수 → 환경변수, 실패 시 vault)를 거친다.
     * 네트워크를 탈 수 있으므로, 각 validate는 정답을 먼저 확인하고
     * 틀렸을 때만 이걸 부른다.
     * @param {string} input - 사용자 입력
     * @returns {Promise<boolean>} 마스터 코드 여부
     */
    function isMasterCode(input) {
        return Auth.check('admin', String(input));
    }
    
    /**
     * SHA-256 해시 생성 (비동기)
     * @param {string} message - 해시할 문자열
     * @returns {Promise<string>} 해시값
     */
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    /**
     * 문자열 정규화 (공백 제거, 소문자 변환)
     * @param {string} str - 입력 문자열
     * @returns {string} 정규화된 문자열
     */
    function normalize(str) {
        return str.toLowerCase().replace(/\s+/g, '').trim();
    }
    
    /**
     * Stage 1 검증: 보안 접속 코드
     * 정답: "프록시마b적색왜성4.24" (공백 무시)
     * @param {string} input - 사용자 입력
     * @returns {Promise<boolean>} 검증 결과
     */
    async function validateStage1(input) {
        const normalized = normalize(input);

        // 직접 비교
        const correctAnswer = normalize(Vault.get('s1'));
        if (normalized === correctAnswer) {
            return true;
        }

        // 마스터 코드 체크
        return isMasterCode(input);
    }
    
    /**
     * Stage 2 검증: 생존 구역
     * 정답 키워드: "황혼", "경계", "twilight" 중 하나 포함
     * @param {string} input - 사용자 입력
     * @returns {Promise<boolean>} 검증 결과
     */
    async function validateStage2(input) {
        const normalized = normalize(input);

        // 정답 키워드 목록
        const keywords = Vault.list('s2kw');

        if (keywords.some(keyword => normalized.includes(normalize(keyword)))) {
            return true;
        }

        // 마스터 코드 체크
        return isMasterCode(input);
    }
    
    /**
     * Stage 3 검증: 좌표 추적
     * 정답: 구역="night" (밤의 지역), 위도=30~60 범위
     * @param {string} region - 선택한 구역
     * @param {number|string} latitude - 입력한 위도
     * @param {string} masterInput - 마스터코드 체크용 (선택)
     * @returns {Promise<Object>} 검증 결과 { isValid, regionValid, latitudeValid }
     */
    async function validateStage3(region, latitude, masterInput = '') {
        const lat = parseFloat(latitude);

        // 구역 검증: "밤의 지역"만 정답
        const regionValid = region === 'night';

        // 위도 검증: 30~60도 범위 허용 (교실 측정 상황에 따라 유연하게)
        const latitudeValid = !isNaN(lat)
            && lat >= Vault.num('latmin') && lat <= Vault.num('latmax');

        if (regionValid && latitudeValid) {
            return { isValid: true, regionValid, latitudeValid };
        }

        // 마스터 코드 체크 (위도 입력란에 마스터코드 입력 시)
        if (await isMasterCode(String(latitude)) || await isMasterCode(masterInput)) {
            return {
                isValid: true,
                regionValid: true,
                latitudeValid: true
            };
        }

        return {
            isValid: false,
            regionValid,
            latitudeValid
        };
    }
    
    /**
     * Stage 4 검증: 궤도 시뮬레이션
     * 정답 없음 - 학습자 입력 기반
     * @param {string} result - 성공/실패 선택
     * @param {number|string} angle - 발사 각도 (선택)
     * @param {string} time - 소요 시간 (선택)
     * @returns {Promise<Object>} 입력 데이터
     */
    async function validateStage4(result, angle, time) {
        // 마스터 코드 체크 (각도나 시간에 마스터코드 입력 시)
        // 스테이지 4는 정답이 없어서 마스터 체크가 먼저 온다. angle은 숫자
        // 입력칸이라 코드가 들어올 일이 거의 없고, 빈 값은 Auth가 바로 걸러낸다.
        if (await isMasterCode(String(angle)) || await isMasterCode(time)) {
            return {
                isValid: true,
                isSuccess: true,
                isMasterCode: true,
                data: {
                    result: 'success',
                    angle: 'MASTER',
                    time: 'MASTER'
                }
            };
        }
        
        const isSuccess = result === 'success';
        
        return {
            isValid: result === 'success' || result === 'fail',
            isSuccess,
            isMasterCode: false,
            data: {
                result,
                angle: angle || null,
                time: time || null
            }
        };
    }
    
    /**
     * 정답 해시 생성 유틸리티 (개발용)
     * @param {string} answer - 정답 문자열
     * @returns {Promise<string>} 해시값
     */
    async function generateHash(answer) {
        const normalized = normalize(answer);
        const hash = await sha256(normalized);
        console.log(`Answer: "${answer}" => Hash: "${hash}"`);
        return hash;
    }
    
    // Public API
    return {
        validateStage1,
        validateStage2,
        validateStage3,
        validateStage4,
        generateHash,
        normalize,
        isMasterCode
    };
})();
