/**
 * PROXIMA RESCUE COMMAND - Auth
 *
 * 관문 비밀번호 검증 창구. 배포(Vercel)에서는 서버 함수 /api/verify 가
 * 환경변수와 대조하므로 비밀번호가 브라우저 소스에 아예 없다.
 *
 * 로컬 개발(파이썬 서버 등)이나 환경변수를 아직 안 넣은 배포에서는
 * API가 없거나 {configured:false}를 주므로, 그때만 vault 값으로 대조한다.
 * 즉 환경변수를 넣는 순간 vault의 비밀번호 항목은 안 쓰인다.
 */
const Auth = (function () {
    // 한 번 실패하면 이후엔 API를 다시 두드리지 않고 바로 vault로 간다
    let apiDown = false;

    async function post(payload) {
        if (apiDown) return null;
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                apiDown = true;
                return null;
            }
            const data = await res.json();
            if (!data || data.configured === false) {
                apiDown = true;
                return null;
            }
            return data;
        } catch (e) {
            apiDown = true;
            return null;
        }
    }

    // API 종류 → vault 키
    const FALLBACK_KEY = { stage2: 'pw2', stage3: 'pw3', stage4: 'pw4', admin: 'admin' };

    /**
     * 비밀번호 확인
     * @param {string} kind - 'stage2' | 'stage3' | 'stage4' | 'admin'
     * @param {string} value - 입력값
     * @returns {Promise<boolean>}
     */
    async function check(kind, value) {
        const v = String(value || '').trim();
        if (!v) return false;

        const data = await post({ kind, value: v });
        if (data) return !!data.ok;

        const target = Vault.get(FALLBACK_KEY[kind]);
        return kind === 'admin'
            ? v === target
            : v.toUpperCase() === target.toUpperCase();
    }

    /**
     * 관리자 코드가 맞으면 비밀번호 목록을 준다 (교사용 관리자 모달)
     * @param {string} adminCode
     * @returns {Promise<Object|null>} {stage2, stage3, stage4, admin} 또는 null
     */
    async function passwords(adminCode) {
        const v = String(adminCode || '').trim();
        const data = await post({ kind: 'list', value: v });
        if (data) return data.ok ? data.passwords : null;

        if (v !== Vault.get('admin')) return null;
        return {
            stage2: Vault.get('pw2'),
            stage3: Vault.get('pw3'),
            stage4: Vault.get('pw4'),
            admin: Vault.get('admin')
        };
    }

    return { check, passwords };
})();
