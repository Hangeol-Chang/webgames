"use client";

import { useEffect, useRef, useState } from "react";

export default function JumpKing() {
  const canvasRef = useRef(null);

  // 플레이어 상태
  const [player, setPlayer] = useState({
    x: 200, // 캐릭터의 X 좌표
    y: 500, // 캐릭터의 Y 좌표
    width: 20,
    height: 20,
    dx: 0,
    dy: 0,
  });

  // 발판 상태
  const [platforms, setPlatforms] = useState([]);
  const [cameraY, setCameraY] = useState(0); // 화면 이동

  const gravity = 0.5;
  const jumpStrength = -10;
  const speed = 5;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 초기 발판 생성 (컴포넌트가 마운트될 때 한 번 실행)
    const generateInitialPlatforms = () => {
      const initialPlatforms = [];
      for (let i = 0; i < 10; i++) {
        initialPlatforms.push({
          x: Math.random() * 360, // 캔버스 너비 안에서 랜덤 위치
          y: 600 - i * 60, // 각 발판이 일정 간격으로 배치
          width: 80,
          height: 10,
        });
      }
      return initialPlatforms;
    };
    setPlatforms(generateInitialPlatforms()); // 초기 발판 설정

    const handleKeyDown = (e) => {
      if (e.code === "ArrowLeft") {
        setPlayer((prev) => ({ ...prev, dx: -speed }));
      } else if (e.code === "ArrowRight") {
        setPlayer((prev) => ({ ...prev, dx: speed }));
      } else if (e.code === "Space") {
        setPlayer((prev) => ({ ...prev, dy: jumpStrength }));
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        setPlayer((prev) => ({ ...prev, dx: 0 }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 플레이어 위치 업데이트
      setPlayer((prev) => {
        let newPlayer = {
          ...prev,
          x: prev.x + prev.dx,
          y: prev.y + prev.dy,
          dy: prev.dy + gravity, // 중력 적용
        };

        // 화면 경계를 넘어가지 않도록
        if (newPlayer.x < 0) newPlayer.x = 0;
        if (newPlayer.x + newPlayer.width > canvas.width)
          newPlayer.x = canvas.width - newPlayer.width;

        return newPlayer;
      });

      // 발판 충돌 체크
      platforms.forEach((platform) => {
        if (
          player.dy > 0 && // 떨어질 때만 충돌 체크
          player.y + player.height <= platform.y && // 발판 위에 있을 때
          player.y + player.height + player.dy >= platform.y && // 다음 프레임에 충돌
          player.x + player.width >= platform.x && // 발판의 좌측 끝보다 오른쪽
          player.x <= platform.x + platform.width // 발판의 우측 끝보다 왼쪽
        ) {
          setPlayer((prev) => ({ ...prev, dy: jumpStrength })); // 점프
        }
      });

      // 카메라 이동
      if (player.y < 300) {
        setCameraY((prev) => prev + (300 - player.y));
        setPlayer((prev) => ({ ...prev, y: 300 }));
      }

      // 발판 생성
      setPlatforms((prevPlatforms) => {
        const newPlatforms = prevPlatforms
          .filter((platform) => platform.y - cameraY < canvas.height) // 화면 위로 벗어난 발판 제거
          .concat(
            Math.random() < 0.02 // 랜덤 확률로 발판 생성
              ? [
                  {
                    x: Math.random() * 360,
                    y: cameraY - 50,
                    width: 80,
                    height: 10,
                  },
                ]
              : []
          );

        return newPlatforms;
      });

      // 발판 그리기
      platforms.forEach((platform) => {
        ctx.fillStyle = "green";
        ctx.fillRect(
          platform.x,
          platform.y - cameraY, // 카메라 위치에 따라 발판 위치 조정
          platform.width,
          platform.height
        );
      });

      // 플레이어 그리기
      ctx.fillStyle = "blue";
      ctx.fillRect(player.x, player.y - cameraY, player.width, player.height);

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [player, cameraY, platforms]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={600}
      style={{ border: "1px solid black" }}
    />
  );
}
