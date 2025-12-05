/**
 * PROXIMA RESCUE COMMAND - Hohmann Transfer Simulation
 * 호만 전이 궤도 시뮬레이션 및 실패 케이스 시각화
 */

const HohmannSim = (function () {
    let canvas, ctx;
    let animationId;
    let isSimulating = false;

    // 설정값
    const config = {
        centerX: 300,
        centerY: 200,
        sunRadius: 15,
        innerRadius: 80,  // 본부 궤도 반지름
        outerRadius: 140, // 조난자 궤도 반지름
        planetRadius: 8,
        innerSpeed: 0.02, // 본부 공전 속도
        outerSpeed: 0.01, // 조난자 공전 속도
        transferSpeed: 0.015 // 전이 궤도 우주선 속도
    };

    // 상태값
    let state = {
        innerAngle: 0,
        outerAngle: Math.PI, // 초기 위상차
        rocket: null, // { x, y, angle, type, active }
        scenario: 0 // 0: 대기, 1: 너무 늦음, 2: 너무 빠름, 3: 속도 부족
    };

    /**
     * 초기화
     */
    function init() {
        canvas = document.getElementById('hohmann-canvas');
        if (!canvas) return;

        ctx = canvas.getContext('2d');

        // 버튼 이벤트
        const failBtn = document.getElementById('sim-fail-btn');
        if (failBtn) {
            failBtn.addEventListener('click', startFailureSimulation);
        }

        // 애니메이션 시작
        startAnimation();
        console.log('[HohmannSim] Initialized');
    }

    /**
     * 애니메이션 루프
     */
    function startAnimation() {
        if (animationId) cancelAnimationFrame(animationId);

        function loop() {
            update();
            draw();
            animationId = requestAnimationFrame(loop);
        }
        loop();
    }

    /**
     * 상태 업데이트
     */
    function update() {
        // 행성 공전
        state.innerAngle += config.innerSpeed;
        state.outerAngle += config.outerSpeed;

        // 로켓 시뮬레이션
        if (state.rocket && state.rocket.active) {
            updateRocket();
        }
    }

    /**
     * 로켓 업데이트
     */
    function updateRocket() {
        const rocket = state.rocket;
        rocket.progress += 0.01;

        if (rocket.progress >= 1) {
            rocket.active = false;
            showStatus("❌ 도킹 실패! 조난자와 만나지 못했습니다.");

            // 다음 시나리오 준비 (잠시 후)
            if (state.scenario > 0 && state.scenario < 3) {
                setTimeout(() => {
                    runNextScenario();
                }, 2000);
            } else if (state.scenario === 3) {
                setTimeout(() => {
                    state.scenario = 0;
                    showStatus("⚠️ 정확한 타이밍 계산이 필요합니다!");
                    document.getElementById('sim-fail-btn').disabled = false;
                }, 2000);
            }
            return;
        }

        // 타원 궤도 계산 (간략화)
        // 실제 호만 전이는 타원이지만, 여기서는 시각적 연출을 위해 보간 사용
        const startR = config.innerRadius;
        const endR = config.outerRadius;

        // 시나리오별 궤도
        let currentR, currentAngle;

        if (rocket.type === 'late') { // 너무 늦게 출발 (뒤따라감)
            currentR = startR + (endR - startR) * rocket.progress;
            currentAngle = rocket.startAngle + (Math.PI * 0.8) * rocket.progress;
        } else if (rocket.type === 'early') { // 너무 일찍 출발 (앞서감)
            currentR = startR + (endR - startR) * rocket.progress;
            currentAngle = rocket.startAngle + (Math.PI * 1.2) * rocket.progress;
        } else if (rocket.type === 'wrong_speed') { // 속도 부족 (궤도 이탈)
            currentR = startR + (endR - startR) * rocket.progress * 0.7; // 도달 못함
            currentAngle = rocket.startAngle + Math.PI * rocket.progress;
        }

        rocket.x = config.centerX + Math.cos(currentAngle) * currentR;
        rocket.y = config.centerY + Math.sin(currentAngle) * currentR;
    }

    /**
     * 그리기
     */
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 배경 (우주)
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 궤도 그리기
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // 안쪽 궤도 (본부)
        ctx.beginPath();
        ctx.arc(config.centerX, config.centerY, config.innerRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 바깥쪽 궤도 (조난자)
        ctx.beginPath();
        ctx.arc(config.centerX, config.centerY, config.outerRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 태양 (중심별)
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(config.centerX, config.centerY, config.sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 본부 (지구)
        const hqX = config.centerX + Math.cos(state.innerAngle) * config.innerRadius;
        const hqY = config.centerY + Math.sin(state.innerAngle) * config.innerRadius;

        ctx.fillStyle = '#4facfe'; // Blue
        ctx.beginPath();
        ctx.arc(hqX, hqY, config.planetRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('본부', hqX - 10, hqY - 15);

        // 조난자 (프록시마 b)
        const survivorX = config.centerX + Math.cos(state.outerAngle) * config.outerRadius;
        const survivorY = config.centerY + Math.sin(state.outerAngle) * config.outerRadius;

        ctx.fillStyle = '#ff512f'; // Red
        ctx.beginPath();
        ctx.arc(survivorX, survivorY, config.planetRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('조난자', survivorX - 15, survivorY - 15);

        // 로켓
        if (state.rocket && state.rocket.active) {
            ctx.fillStyle = '#00ff00'; // Green
            ctx.beginPath();
            ctx.arc(state.rocket.x, state.rocket.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // 궤적
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(hqX, hqY); // 단순화를 위해 현재 본부 위치에서 시작하는 것처럼 보일 수 있음 (수정 필요 시 궤적 저장)
            // 실제로는 궤적 배열을 저장해서 그려야 예쁨. 여기선 간단히 점만 그림.
        }
    }

    /**
     * 실패 시뮬레이션 시작
     */
    function startFailureSimulation() {
        const btn = document.getElementById('sim-fail-btn');
        if (btn) btn.disabled = true;

        state.scenario = 0;
        runNextScenario();
    }

    /**
     * 다음 시나리오 실행
     */
    function runNextScenario() {
        state.scenario++;

        let msg = "";
        let type = "";

        if (state.scenario === 1) {
            msg = "시나리오 1: 너무 늦게 출발! (조난자가 지나감)";
            type = "late";
        } else if (state.scenario === 2) {
            msg = "시나리오 2: 너무 일찍 출발! (조난자가 아직 안 옴)";
            type = "early";
        } else if (state.scenario === 3) {
            msg = "시나리오 3: 추진력 부족! (궤도 도달 실패)";
            type = "wrong_speed";
        } else {
            return;
        }

        showStatus(msg);

        // 로켓 발사
        state.rocket = {
            x: config.centerX + Math.cos(state.innerAngle) * config.innerRadius,
            y: config.centerY + Math.sin(state.innerAngle) * config.innerRadius,
            startAngle: state.innerAngle,
            progress: 0,
            type: type,
            active: true
        };
    }

    function showStatus(msg) {
        const el = document.getElementById('sim-status');
        if (el) el.textContent = msg;
    }

    return {
        init
    };
})();
