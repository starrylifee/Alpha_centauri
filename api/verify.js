/**
 * 비밀번호 검증 서버리스 함수 (Vercel)
 *
 * 관문 비밀번호 4개를 Vercel 환경변수에 두고 여기서만 대조한다.
 * 브라우저에는 맞다/틀리다만 내려가므로 소스 보기로는 비밀번호를 찾을 수 없다.
 *
 * 필요한 환경변수 (Vercel 대시보드 → Settings → Environment Variables):
 *   PW_STAGE2, PW_STAGE3, PW_STAGE4  — 스테이지 진입 비밀번호
 *   ADMIN_CODE                       — 관리자 코드 (영상 건너뛰기 · 마스터 키 · 톱니바퀴)
 *
 * 환경변수가 없으면 {configured:false}를 돌려주고, 클라이언트(js/auth.js)는
 * vault 값으로 대체 동작한다. 로컬 개발에서도 같은 대체 경로를 탄다.
 */
module.exports = (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'POST only' });
        return;
    }

    const ENV = {
        stage2: process.env.PW_STAGE2,
        stage3: process.env.PW_STAGE3,
        stage4: process.env.PW_STAGE4,
        admin: process.env.ADMIN_CODE
    };

    if (!ENV.stage2 || !ENV.stage3 || !ENV.stage4 || !ENV.admin) {
        res.status(200).json({ configured: false });
        return;
    }

    const body = req.body || {};
    const kind = body.kind;
    const value = String(body.value || '').trim();

    if (kind === 'admin') {
        res.status(200).json({ ok: value === ENV.admin });
        return;
    }

    // 관리자 코드를 확인한 뒤에만 목록을 내려준다 (교사용 관리자 모달)
    if (kind === 'list') {
        if (value === ENV.admin) {
            res.status(200).json({ ok: true, passwords: ENV });
        } else {
            res.status(200).json({ ok: false });
        }
        return;
    }

    if (kind === 'stage2' || kind === 'stage3' || kind === 'stage4') {
        // 스테이지 비밀번호는 대소문자를 구분하지 않는다 (기존 동작 유지)
        res.status(200).json({ ok: value.toUpperCase() === ENV[kind].toUpperCase() });
        return;
    }

    res.status(400).json({ error: 'unknown kind' });
};
