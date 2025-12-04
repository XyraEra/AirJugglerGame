// game.js: Final Revised Code (Only the endGame function is changed)
// ... (rest of the game.js code is unchanged) ...

// End game
function endGame() {
  gameState.gameOver = true;
  cancelAnimationFrame(gameState.animationId);

  // Stop the ball spawning timer
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

  // FIX: Simplified the injected HTML to remove unnecessary large divs and padding.
  // We use the <h2> (implicitly the overlay message element itself) for the title,
  // and a single, small paragraph for the score.
  
  // NOTE: Assuming your HTML structure is still 
  // <div id="overlay"> <h2></h2> <div id="overlayMessage">...</div> <button>...</button> </div>
  // If your HTML is: <div id="overlay"> <h2 id="overlayMessage">...</h2> <button>...</button> </div>
  // We need to change the implementation slightly. 
  
  // Based on your original code's approach (where overlayMessage.innerHTML is set):
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

// ... (rest of the game.js code is unchanged) ...
