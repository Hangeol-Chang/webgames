"use client";

import { useEffect, useRef } from "react";

export default function JumpKingGame() {
  const canvasRef = useRef(null);
  const playerRef = useRef({ x: 250, y: 400, vx: 0, vy: 0 });
  const platformsRef = useRef([
    { x: 200, y: 450, width: 100, height: 10 },
    { x: 300, y: 350, width: 100, height: 10 },
    { x: 100, y: 250, width: 100, height: 10 },
    { x: 200, y: 150, width: 100, height: 10 },
  ]);
  const cameraYRef = useRef(0); // 카메라의 Y 위치
  const gravity = 0.5;
  const jumpStrength = -10;
  const speed = 5;
  const platformWidth = 100;
  const platformHeight = 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const handleKeyDown = (e) => {
      const player = playerRef.current;
      if (e.key === "ArrowLeft") player.vx = -speed;
      if (e.key === "ArrowRight") player.vx = speed;
      if (e.key === " " && player.vy === 0) player.vy = jumpStrength;
    };

    const handleKeyUp = (e) => {
      const player = playerRef.current;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.vx = 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const update = () => {
      const player = playerRef.current;
      const platforms = platformsRef.current;

      // Apply gravity and update position
      player.vy += gravity;
      player.y += player.vy;
      player.x += player.vx;

      // Prevent the player from falling below the ground
      if (player.y > cameraYRef.current + canvas.height - 20) {
        player.y = cameraYRef.current + canvas.height - 20;
        player.vy = 0;
      }

      // Collision detection with platforms
      platforms.forEach((platform) => {
        if (
          player.x + 20 > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + 20 > platform.y &&
          player.y + 20 < platform.y + platform.height &&
          player.vy > 0
        ) {
          player.y = platform.y - 20;
          player.vy = 0;
        }
      });

      // 카메라 이동: 플레이어가 화면 상단 200px 이상 올라가면 카메라 위로 이동
      if (player.y < cameraYRef.current + 200) {
        cameraYRef.current = player.y - 200;
      }

      // Keep player within bounds
      player.x = Math.max(0, Math.min(canvas.width - 20, player.x));

      // 동적 발판 생성: 카메라 기준 위쪽에 새로운 발판 추가
      const highestPlatform = Math.min(...platforms.map((p) => p.y));
      if (highestPlatform > cameraYRef.current - 100) {
        const newPlatform = {
          x: Math.random() * (canvas.width - platformWidth),
          y: highestPlatform - 100,
          width: platformWidth,
          height: platformHeight,
        };
        platforms.push(newPlatform);
      }

      // 오래된 발판 제거: 화면 아래로 사라진 발판은 제거
      platformsRef.current = platforms.filter(
        (platform) => platform.y < cameraYRef.current + canvas.height + 100
      );
    };

    const render = () => {
      const player = playerRef.current;
      const platforms = platformsRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Adjust for camera position
      ctx.save();
      ctx.translate(0, -cameraYRef.current);

      // Draw platforms
      ctx.fillStyle = "blue";
      platforms.forEach((platform) => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      });

      // Draw player
      ctx.fillStyle = "red";
      ctx.fillRect(player.x, player.y, 20, 20);

      ctx.restore();
    };

    const gameLoop = () => {
      update();
      render();
      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} width={500} height={500} style={{ border: "1px solid black" }} />;
}
