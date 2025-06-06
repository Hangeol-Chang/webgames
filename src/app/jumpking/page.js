'use client';
import React, { useRef, useEffect } from 'react';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 32;
const GRAVITY = 0.5;
const JUMP_VELOCITY = -10;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 16;
const PLATFORM_GAP = 100;
const PLATFORM_COUNT = 8;

// 발판 타입 정의
const PLATFORM_TYPES = ['static', 'moving', 'vanish'];

function getRandomX() {
  return Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
}

function getRandomPlatformType() {
  // 첫 발판은 반드시 static
  if (arguments[0] === 'first') return 'static';
  return PLATFORM_TYPES[Math.floor(Math.random() * PLATFORM_TYPES.length)];
}

function createPlatforms() {
  const platforms = [];
  // 첫 시작 위치에 반드시 발판 추가 (static)
  platforms.push({
    x: GAME_WIDTH / 2 - PLATFORM_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_SIZE,
    type: getRandomPlatformType('first'),
    dir: 1, // moving용
    speed: 1.2, // moving용: 첫 발판은 고정이므로 의미 없음
    vanishTimer: 0, // vanish용
    touched: false, // vanish용
  });
  for (let i = 1; i < PLATFORM_COUNT; i++) {
    const type = getRandomPlatformType();
    platforms.push({
      x: getRandomX(),
      y: GAME_HEIGHT - (i + 1) * PLATFORM_GAP,
      type,
      dir: Math.random() < 0.5 ? 1 : -1, // moving용
      speed: 0.7 + Math.random() * 1.0, // moving용: 0.7~1.7 사이 랜덤
      vanishTimer: 0, // vanish용
      touched: false, // vanish용
    });
  }
  return platforms;
}

const JumpKing = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const player = useRef({
    x: GAME_WIDTH / 2 - PLAYER_SIZE / 2,
    y: GAME_HEIGHT - PLAYER_SIZE - 10,
    vy: 0,
    isJumping: false,
    jumpCount: 0, // 더블점프 카운트
    vx: 0, // 좌우 속도
  });
  const platforms = useRef(createPlatforms());
  const cameraOffset = useRef(0);
  const keys = useRef({ left: false, right: false });
  const gameOver = useRef(false);
  const deadlineY = useRef(GAME_HEIGHT); // 데드라인 y좌표 (카메라 기준)
  const deadlineSpeed = useRef(0.002); // 데드라인 기본 속도(더 느리게)
  const deadlineActive = useRef(false);

  // gameOver 상태를 ref와 연동해서 setGameOver처럼 쓸 수 있게 함수 정의
  const [, forceUpdate] = React.useState(0); // 강제 리렌더용
  function setGameOver(val) {
    gameOver.current = val;
    forceUpdate(v => v + 1); // 게임오버 시 강제 리렌더
  }

  // 게임 리셋 함수
  function resetGame() {
    player.current.x = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
    player.current.y = GAME_HEIGHT - PLAYER_SIZE - 10;
    player.current.vy = 0;
    player.current.vx = 0;
    player.current.isJumping = false;
    player.current.jumpCount = 0;
    cameraOffset.current = 0;
    platforms.current = createPlatforms();
    gameOver.current = false;
    deadlineActive.current = false;
    deadlineY.current = GAME_HEIGHT;
    deadlineSpeed.current = 0.002;
    // requestAnimationFrame 루프 재시작
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    forceUpdate(v => v + 1); // 리렌더링 강제
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === 'w' || e.key === 'ArrowUp') {
        // 더블점프: jumpCount < 2
        if (player.current.jumpCount < 2) {
          player.current.vy = JUMP_VELOCITY;
          player.current.isJumping = true;
          player.current.jumpCount++;
        }
      }
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        keys.current.left = true;
      }
      if (e.key === 'd' || e.key === 'ArrowRight') {
        keys.current.right = true;
      }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        keys.current.left = false;
      }
      if (e.key === 'd' || e.key === 'ArrowRight') {
        keys.current.right = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const VANISH_DELAY = 100; // vanish 발판이 밟힌 후 사라지는 프레임 수 (늘림)
  const MOVING_SPEED = 2.5;

  const gameLoop = () => {
    if (gameOver.current) return;
    // 좌우 이동 가속
    const MOVE_ACC = 0.7;
    const MAX_VX = 6;
    if (keys.current.left) {
      player.current.vx -= MOVE_ACC;
    }
    if (keys.current.right) {
      player.current.vx += MOVE_ACC;
    }
    // 마찰
    player.current.vx *= 0.85;
    // 속도 제한
    if (player.current.vx > MAX_VX) player.current.vx = MAX_VX;
    if (player.current.vx < -MAX_VX) player.current.vx = -MAX_VX;
    player.current.x += player.current.vx;

    // Physics
    player.current.vy += GRAVITY;
    player.current.y += player.current.vy;
    // 좌우 벽
    if (player.current.x < 0) {
      player.current.x = 0;
      player.current.vx = 0;
    }
    if (player.current.x > GAME_WIDTH - PLAYER_SIZE) {
      player.current.x = GAME_WIDTH - PLAYER_SIZE;
      player.current.vx = 0;
    }

    // 발판 동작 업데이트
    for (let plat of platforms.current) {
      if (plat.type === 'moving') {
        plat.x += plat.dir * plat.speed;
        if (plat.x < 0) {
          plat.x = 0;
          plat.dir = 1;
        }
        if (plat.x > GAME_WIDTH - PLATFORM_WIDTH) {
          plat.x = GAME_WIDTH - PLATFORM_WIDTH;
          plat.dir = -1;
        }
      }
      if (plat.type === 'vanish' && plat.touched) {
        plat.vanishTimer++;
      }
    }

    // 플랫폼 충돌
    let onPlatform = false;
    for (let plat of platforms.current) {
      // vanish 발판이 사라졌으면 충돌 없음
      if (plat.type === 'vanish' && plat.touched && plat.vanishTimer > VANISH_DELAY) continue;
      if (
        player.current.vy > 0 &&
        player.current.x + PLAYER_SIZE > plat.x &&
        player.current.x < plat.x + PLATFORM_WIDTH &&
        player.current.y + PLAYER_SIZE > plat.y &&
        player.current.y + PLAYER_SIZE < plat.y + PLATFORM_HEIGHT + 10
      ) {
        player.current.y = plat.y - PLAYER_SIZE;
        player.current.vy = 0;
        player.current.isJumping = false;
        player.current.jumpCount = 0;
        onPlatform = true;
        if (plat.type === 'vanish') {
          plat.touched = true;
        }
      }
    }
    if (!onPlatform && player.current.vy > 0) {
      player.current.isJumping = true;
    }

    // 카메라 이동 (플레이어가 화면 중간 이상 올라가면)
    if (player.current.y < GAME_HEIGHT / 2 - cameraOffset.current) {
      cameraOffset.current = GAME_HEIGHT / 2 - player.current.y;
    }

    // 플랫폼 재생성 (아래로 내려간 플랫폼은 위로 올림)
    for (let plat of platforms.current) {
      if (plat.y + cameraOffset.current > GAME_HEIGHT) {
        plat.y -= PLATFORM_COUNT * PLATFORM_GAP;
        const type = getRandomPlatformType();
        plat.type = type;
        plat.x = getRandomX();
        plat.dir = Math.random() < 0.5 ? 1 : -1;
        plat.speed = 0.7 + Math.random() * 1.0;
        plat.vanishTimer = 0;
        plat.touched = false;
      }
    }

    // 게임 오버 체크: 플레이어가 카메라 아래로 벗어나면
    if (player.current.y + cameraOffset.current > GAME_HEIGHT) {
      setGameOver(true);
      return;
    }

    // 데드라인 활성화 조건: 플레이어가 100px 이상 올라가면
    if (!deadlineActive.current && player.current.y < -100) {
      deadlineActive.current = true;
      deadlineY.current = GAME_HEIGHT; // 카메라 기준 하단에서 시작
      deadlineSpeed.current = 0.002; // 기본 속도 느리게
    }
    // 데드라인 동작
    if (deadlineActive.current) {
      // 점점 빨라짐 (최대 4)
      deadlineSpeed.current += 0.0002; // 가속도도 더 느리게
      if (deadlineSpeed.current > 4) deadlineSpeed.current = 4;
      deadlineY.current -= deadlineSpeed.current;
      // 플레이어가 데드라인에 닿으면 게임 오버
      if (player.current.y + PLAYER_SIZE > deadlineY.current - cameraOffset.current) {
        setGameOver(true);
        return;
      }
    }

    // Draw
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.save();
    ctx.translate(0, cameraOffset.current);
    // Draw platforms
    for (let plat of platforms.current) {
      // vanish 발판이 사라졌으면 그리지 않음
      if (plat.type === 'vanish' && plat.touched && plat.vanishTimer > VANISH_DELAY) continue;
      if (plat.type === 'static') ctx.fillStyle = '#4caf50';
      else if (plat.type === 'moving') ctx.fillStyle = '#ff9800';
      else if (plat.type === 'vanish') ctx.fillStyle = plat.touched ? '#bdbdbd' : '#9c27b0';
      ctx.fillRect(plat.x, plat.y, PLATFORM_WIDTH, PLATFORM_HEIGHT);
    }
    // Draw player
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(player.current.x, player.current.y, PLAYER_SIZE, PLAYER_SIZE);
    // Draw deadline (타일처럼 네모로 채우기)
    if (deadlineActive.current) {
      ctx.save();
      ctx.fillStyle = '#e53935';
      const screenY = deadlineY.current - cameraOffset.current;
      const tileHeight = 16;
      for (let y = screenY; y < GAME_HEIGHT; y += tileHeight) {
        ctx.fillRect(0, y, GAME_WIDTH, Math.min(tileHeight, GAME_HEIGHT - y));
      }
      ctx.restore();
    }
    ctx.restore();

    // Draw score (높이)
    ctx.fillStyle = '#222';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Height: ${Math.floor(-cameraOffset.current)}`, 10, 30);

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameOver.current) return; // 게임 오버 시 루프 중단
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line
  }, [gameOver]);

  // 게임 오버 시 R키로도 resetGame 호출
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'r' || e.key === 'R') && gameOver.current) {
        resetGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // useEffect에서 gameOver.current가 false가 되면 루프가 재시작되도록 보장
  useEffect(() => {
    if (!gameOver.current && !requestRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    if (gameOver.current && requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [gameOver.current]);

  return (
    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <h2>Jump King (Canvas Demo)</h2>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{ border: '2px solid #333', background: '#e3f2fd' }}
        />
        {gameOver.current && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            zIndex: 2,
          }}>
            <div style={{ marginBottom: 24 }}>Game Over</div>
            <button onClick={resetGame} style={{ fontSize: 20, padding: '10px 30px', borderRadius: 8, border: 'none', background: '#2196f3', color: '#fff', cursor: 'pointer' }}>다시 시작</button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 10 }}>
        <b>조작:</b> ← → (A/D) 이동, 스페이스/W/↑ 점프, <b>R: 다시 시작</b>
      </div>
    </div>
  );
};

export default JumpKing;
