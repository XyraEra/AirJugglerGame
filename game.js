// game.js: Final Verified Code

// Game configuration
const config = {
  ballCount: 1,
  ballRadius: 20,
  gravity: 0.2,
  bounceVelocity: -8,
  handRadius: 50,
  countdownTime: 3,
};

let ballSpawnIntervalId = null; 
const SPAWN_INTERVAL_MS = 20000;

// Game state
let gameState = {
  balls: [],
  hands: [],
  score: 0,
  gameOver: false,
  startTime: null,
  animationId: null,
  countdown: 0,
  isCountingDown: false,
};

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI elements
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const scoreDisplay = document.getElementById("score");
const overlayMessage = document.getElementById("overlayMessage");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingStatus = document.getElementById("loadingStatus");

function spawnNewBall() {
    const newBallIndex = gameState.balls.length;
    gameState.balls.push({
        x: canvas.width / 2, 
        y: 100, 
        vx: 0,
        vy: 0,
        radius: config.ballRadius,
        color: `hsl(${newBallIndex * 120}, 70%, 60%)`, 
    });
}

function initBalls() {
  gameState.balls = [];
  for (let i = 0; i < config.ballCount; i++) {
    spawnNewBall();
  }
}

function updateBalls() {
  gameState.balls.forEach((ball) => {
    ball.vy += config.gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
      ball.vx *= -1;
      ball.x =
        ball.x < canvas.width / 2 ? ball.radius : canvas.width - ball.radius;
    }

    if (ball.y - ball.radius < 0) {
      ball.vy *= -1;
      ball.y = ball.radius;
    }
  });
}

function checkCollisions() {
  gameState.balls.forEach((ball) => {
    gameState.hands.forEach((hand) => {
      const dx = ball.x - hand.x;
      const dy = ball.y - hand.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ball.radius + config.handRadius) {
        ball.vy = config.bounceVelocity;
        ball.vx += dx * 0.1;

        const angle = Math.atan2(dy, dx);
        const targetX =
          hand.x + Math.cos(angle) * (ball.radius + config.handRadius);
        const targetY =
          hand.y + Math.sin(angle) * (ball.radius + config.handRadius);
        ball.x = targetX;
        ball.y = targetY;
      }
    });
  });
}

function checkGameOver() {
  return gameState.balls.some((ball) => ball.y - ball.radius > canvas.height);
}

function updateScore() {
  if (gameState.startTime && !gameState.gameOver) {
    gameState.score = Math.floor((Date.now() - gameState.startTime) / 1000);
    scoreDisplay.textContent = gameState.score;
  }
}

function startBallSpawning() {
    if (ballSpawnIntervalId === null) {
      ballSpawnIntervalId = setInterval(spawnNewBall, SPAWN_INTERVAL_MS);
    }
}

function stopBallSpawning() {
    if (ballSpawnIntervalId !== null) {
      clearInterval(ballSpawnIntervalId);
      ballSpawnIntervalId = null;
    }
}

function checkTensorFlowLoaded() {
  if (typeof tf !== "undefined" && typeof handPoseDetection !== "undefined") {
    loadingOverlay.classList.add("hidden");
  } else {
    setTimeout(checkTensorFlowLoaded, 100);
  }
}

function render() {
  const webcam = document.getElementById("webcam");
  if (webcam && webcam.readyState === webcam.HAVE_ENOUGH_DATA) {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(webcam, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  gameState.balls.forEach((ball) => {
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  gameState.hands.forEach((hand, index) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, config.handRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(100, 200, 255, 0.3)";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Hand ${index + 1}`, hand.x, hand.y - config.handRadius - 10);
  });

  if (gameState.isCountingDown) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      Math.ceil(gameState.countdown),
      canvas.width / 2,
      canvas.height / 2,
    );

    ctx.font = "bold 24px Arial";
    ctx.fillText("Get Ready!", canvas.width / 2, canvas.height / 2 + 60);
  }
}

function gameLoop() {
  if (gameState.gameOver) return;

  if (gameState.isCountingDown) {
    gameState.countdown -= 1 / 60;

    if (gameState.countdown <= 0) {
      gameState.isCountingDown = false;
      gameState.startTime = Date.now();
      startBallSpawning(); 
    }
  } else {
    updateBalls();
    checkCollisions();
    updateScore();

    if (checkGameOver()) {
      endGame();
      return;
    }
  }

  render();
  gameState.animationId = requestAnimationFrame(gameLoop);
}

async function startGame() {
  gameState.gameOver = false;
  gameState.startTime = null;
  gameState.score = 0;
  gameState.hands = [];
  gameState.countdown = config.countdownTime;
  gameState.isCountingDown = true;
  stopBallSpawning(); 

  // Initialize hand tracking if not already done
  if (!window.handTrackingInitialized) {
    loadingOverlay.classList.remove("hidden");
    loadingStatus.textContent = "Requesting camera access...";

    const webcam = document.getElementById("webcam");

    loadingStatus.textContent = "Loading MediaPipe Hands model...";

    // This block requires 'handtracking.js' to be loaded in index.html
    const success = await window.handTracking.setupHandTracking(
      webcam,
      function receiveHands(hands) {
        gameState.hands = hands;
      },
    );

    loadingOverlay.classList.add("hidden");

    if (!success) {
      endGame();
      overlayMessage.innerHTML = 'Could not access the camera. Please ensure it is available and try again.';
      return;
    }

    window.handTracking.startDetection();
    window.handTrackingInitialized = true;
  }
  
  initBalls();

  overlay.classList.add("hidden");
  gameLoop();
}

function endGame() {
  gameState.gameOver = true;
  cancelAnimationFrame(gameState.animationId);

  stopBallSpawning();

  const emoji =
    gameState.score > 30 ? "🎉" : gameState.score > 15 ? "👏" : "💪";
  const message =
    gameState.score > 30
      ? "Amazing!"
      : gameState.score > 15
        ? "Great Job!"
        : "Game Over!";

  // FIX: Compact HTML structure for consistent box height
  overlayMessage.innerHTML = `
        <div style="font-size: 2.8rem; margin-bottom: 0.5rem; line-height: 1.1; font-family: 'Fredoka One', cursive; background: linear-gradient(135deg, #ff6b6b, #4ecdc4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            ${message}
        </div>
        <p style="font-size: 1.1rem; color: #666; font-family: 'Poppins', sans-serif; font-weight: 600; padding-bottom: 0.5rem;">
            ${emoji} You survived ${gameState.score} seconds
        </p>
    `;
  
  startButton.textContent = "Play Again";
  overlay.classList.remove("hidden");
}

// Event listener (CRITICAL: must be present and correct)
startButton.addEventListener("click", startGame);

// Initial setup checks
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkTensorFlowLoaded);
} else {
  checkTensorFlowLoaded();
}

render();
