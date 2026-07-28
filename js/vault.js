/**
 * PROXIMA RESCUE COMMAND - Vault
 *
 * 비밀번호와 정답 문자열을 소스에서 바로 읽지 못하게 섞어서 보관한다.
 * 첫 수업 때 학생이 브라우저 '소스 보기'로 stages.js의 비밀번호를 읽고
 * 다음 스테이지를 미리 연 일이 있어서 만들었다.
 *
 * 암호학적 보호가 아니라 열람 방지다(XOR + base64). 콘솔을 다룰 줄 아는
 * 사람은 풀 수 있지만, 소스 보기로 훑는 수준은 막는다.
 *
 * 값을 바꾸려면 worksheets/make_vault.py(저장소에 안 올라감)의 PLAIN을
 * 고치고 다시 돌려서 아래 DATA 블록을 갈아끼운다.
 */
const Vault = (function () {
    const K = 'proxima-rescue';

    // 비밀번호 항목(pw2~4, admin)은 개발용 가짜 값이다. 진짜는 Vercel 환경변수에만
    // 있고 서버(api/verify.js)가 대조한다. 여기 값이 쓰이는 건 로컬 개발뿐이다.
    // 콘솔에서 Vault.get()을 쳐보는 학생이 있어도 나오는 건 가짜 값이다.
    const DATA = {
        pw2: 'NDc5Sg==',
        pw3: 'NDc5Sw==',
        pw4: 'NDc5TA==',
        admin: 'FBcZFQYJBA==',
        s1: 'nebrk8jwjabujtTrF4nQ84P74IH4sZ7hwldbV0Q=',
        s2kw: 'nevGlfHRHcfA2JnQ8RkEBQYUAAoJWQ4RFhEYDB4TGxcb',
        q1: 'nfHzlP/8HcDnyJ/nxBmbwesEhPnlxtP4n+jpjtf6E5X96YqM74n4/57C+J7rxITu4cHo1ZjF2Rmc1v6U4sGKnvYZmMndiOXfg/zY',
        q2: 'nNPflO3wi57SidP2CY7/64Pb1YfZnZ7744/V4Q==',
        loc: 'm8LLBILdxcHv/VOP0uWc5cIEgt3Fwe/9n8T1ieffE5PZyUHB1eWf9NgZHhsIEB0RjbvGjuLDCYnmxoTp+YH7mVKPwNA=',
        ang: 'Q0I=',
        hrs: 'QkY=',
        latmin: 'Q0I=',
        latmax: 'RkI='
    };

    function open(b64) {
        const raw = atob(b64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i) ^ K.charCodeAt(i % K.length);
        }
        return new TextDecoder().decode(bytes);
    }

    return {
        /** 단일 값 */
        get: (key) => open(DATA[key]),
        /** '|'로 묶어둔 목록 */
        list: (key) => open(DATA[key]).split('|'),
        /** 숫자 값 */
        num: (key) => parseFloat(open(DATA[key]))
    };
})();
