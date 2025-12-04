// game.js: Final Revised Code

// Game configuration
const config = {
  ballCount: 1,
  ballRadius: 20,
  gravity: 0.2,
  bounceVelocity: -8,
  handRadius: 50,
  countdownTime: 3,
};

// ** NEW: Ball Spawning Timer Configuration **
let ballSpawnIntervalId = null; // To store the setInterval reference
const SPAWN_INTERVAL_MS = 20000; // 20 seconds in milliseconds
// ** END NEW **

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

// ** NEW: Function to create and add a single new ball **
function spawnNewBall() {
    const newBallIndex = gameState.balls.length;
    gameState.balls.push({
        x: canvas.width / 2, // Start in the middle
        y: 100,              // Start slightly below the top
        vx: 0,
        vy: 0,
        radius: config.ballRadius,
        // Assign a color based on the new ball's index
        color: `hsl(${newBallIndex * 120}, 70%, 60%)`, 
    });
    console.log(`New ball spawned! Total balls: ${gameState.balls.length}`);
}

// Initialize balls
function initBalls() {
  gameState.balls = [];
  // Use spawnNewBall to initialize the configured number of balls
  for (let i = 0; i < config.ballCount; i++) {
    spawnNewBall();
  }
}

// Update ball physics
function updateBalls() {
  gameState.balls.forEach((ball) => {
    // Apply gravity
    ball.vy += config.gravity;

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce off left/right walls
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
      ball.vx *= -1;
      ball.x =
        ball.x < canvas.width / 2 ? ball.radius : canvas.width - ball.radius;
    }

    // Bounce off top
    if (ball.y - ball.radius < 0) {
      ball.vy *= -1;
      ball.y = ball.radius;
    }
  });
}

// Check collisions between balls and hands
function checkCollisions() {
  gameState.balls.forEach((ball) => {
    gameState.hands.forEach((hand) => {
      // Calculate distance between ball center and hand center
      const dx = ball.x - hand.x;
      const dy = ball.y - hand.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if ball is colliding with hand zone
      if (distance < ball.radius + config.handRadius) {
        // Bounce ball upward
        ball.vy = config.bounceVelocity;

        // Add slight horizontal velocity based on hand position
        ball.vx += dx * 0.1;

        // Prevent ball from getting stuck inside hand zone
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

// Check if any ball fell off screen
function checkGameOver() {
  return gameState.balls.some((ball) => ball.y - ball.radius > canvas.height);
}

// Update score (time in seconds)
function updateScore() {
  if (gameState.startTime && !gameState.gameOver) {
    gameState.score = Math.floor((Date.now() - gameState.startTime) / 1000);
    scoreDisplay.textContent = gameState.score;
  }
}

// ** NEW: Timer control functions **

/**
 * Starts the ball spawning interval (every 20 seconds).
 */
function startBallSpawning() {
    if (ballSpawnIntervalId === null) {
        ballSpawnIntervalId = setInterval(spawnNewBall, SPAWN_INTERVAL_MS);
        console.log(`Ball spawning started every ${SPAWN_INTERVAL_MS / 1000} seconds.`);
    }
}

/**
 * Stops the ball spawning interval.
 */
function stopBallSpawning() {
    if (ballSpawnIntervalId !== null) {
        clearInterval(ballSpawnIntervalId);
        ballSpawnIntervalId = null;
        console.log("Ball spawning stopped.");
    }
}

// ** END NEW **

// Check if TensorFlow.js is loaded
function checkTensorFlowLoaded() {
  if (typeof tf !== "undefined" && typeof handPoseDetection !== "undefined") {
    // TensorFlow.js and dependencies loaded
    loadingOverlay.classList.add("hidden");
  } else {
    // Check again after a short delay
    setTimeout(checkTensorFlowLoaded, 100);
  }
}
// Render everything
function render() {
  // Draw video feed directly onto canvas (provided)
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

  // Draw balls
  gameState.balls.forEach((ball) => {
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Add white outline for visibility
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw hand zones as paddles
  gameState.hands.forEach((hand, index) => {
    // Outer circle
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, config.handRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner fill
    ctx.fillStyle = "rgba(100, 200, 255, 0.3)";
    ctx.fill();

    // Center dot
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Hand label
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Hand ${index + 1}`, hand.x, hand.y - config.handRadius - 10);
  });

  // Draw countdown if active
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

// Main game loop
function gameLoop() {
  if (gameState.gameOver) return;

  // Handle countdown
  if (gameState.isCountingDown) {
    gameState.countdown -= 1 / 60;

    if (gameState.countdown <= 0) {
      gameState.isCountingDown = false;
      gameState.startTime = Date.now();
    }
  } else {
    // Only update game logic after countdown finishes
    updateBalls();
    checkCollisions();
    updateScore();

    // Check lose condition
    if (checkGameOver()) {
      endGame();
      return;
    }
  }

  render();
  gameState.animationId = requestAnimationFrame(gameLoop);
}

// Start game
async function startGame() {
  gameState.gameOver = false;
  gameState.startTime = null;
  gameState.score = 0;
  gameState.hands = [];
  gameState.countdown = config.countdownTime;
  gameState.isCountingDown = true;
// Initialize hand tracking if not already done
if (!window.handTrackingInitialized) {
  // Show loading overlay
  loadingOverlay.classList.remove("hidden");
  loadingStatus.textContent = "Requesting camera access...";

  const webcam = document.getElementById("webcam");

  // Update loading status
  loadingStatus.textContent = "Loading MediaPipe Hands model...";

  const success = await window.handTracking.setupHandTracking(
    webcam,
    function receiveHands(hands) {
      gameState.hands = hands; // Update game state with detected hands
    },
  );

  // Hide loading overlay
  loadingOverlay.classList.add("hidden");

  if (!success) {
    endGame();
    overlayMessage.textContent = "Camera access required to play!";
    return;
  }

  window.handTracking.startDetection();
  window.handTrackingInitialized = true;
}
  initBalls();

  // ** NEW: Start the ball spawning timer **
  startBallSpawning();

  overlay.classList.add("hidden");
  gameLoop();
}

// End game
function endGame() {
  gameState.gameOver = true;
  cancelAnimationFrame(gameState.animationId);

  // ** NEW: Stop the ball spawning timer **
  stopBallSpawning();

  // Create game over message with better formatting
  const emoji =
    gameState.score > 30 ? "🎉" : gameState.score > 15 ? "👏" : "💪";
  const message =
    gameState.score > 30
      ? "Amazing!"
      : gameState.score > 15
        ? "Great Job!"
        : "Game Over!";

  // The original HTML injected multiple <div>s, making the box too tall.
  // We modify it to use fewer lines and smaller top/bottom padding to shrink the box.
  overlayMessage.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.2rem; line-height: 1.1;">${message}</div>
        <div style="font-size: 1.1rem; color: #666; font-family: 'Poppins', sans-serif; font-weight: 600; padding-bottom: 0.5rem;">
            ${emoji} You survived ${gameState.score} seconds
        </div>
    `;
  
  startButton.textContent = "Play Again";
  overlay.classList.remove("hidden");
}

// Event listeners
startButton.addEventListener("click", startGame);

// TODO: Step 2 - Implement Loading Progress Indicator
// Create a function checkTensorFlowLoaded():

// Start checking once DOM is loaded:
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkTensorFlowLoaded);
} else {
  checkTensorFlowLoaded();
}

// Initial render
render();
