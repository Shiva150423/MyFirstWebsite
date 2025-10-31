// Simple Snake game using canvas
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  // Grid settings
  const GRID = 20; // size of a cell in pixels
  const COLS = Math.floor(canvas.width / GRID);
  const ROWS = Math.floor(canvas.height / GRID);

  let snake = [];
  let direction = { x: 1, y: 0 }; // start moving right
  let food = null;
  let score = 0;
  let gameInterval = null;
  let isRunning = false;
  let speed = 120; // ms per move, lower = faster

  // Initialize/reset the game
  function resetGame() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];
    direction = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = score;
    placeFood();
    stopLoop();
    draw();
    statusEl.textContent = 'Ready — press Start ▶';
  }

  function startLoop() {
    if (isRunning) return;
    isRunning = true;
    statusEl.textContent = 'Playing...';
    gameInterval = setInterval(tick, speed);
    startBtn.disabled = true;
    pauseBtn.disabled = false;
  }

  function stopLoop() {
    isRunning = false;
    clearInterval(gameInterval);
    gameInterval = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function placeFood() {
    let tries = 0;
    while (tries < 1000) {
      const fx = Math.floor(Math.random() * COLS);
      const fy = Math.floor(Math.random() * ROWS);
      if (!snake.some(s => s.x === fx && s.y === fy)) {
        food = { x: fx, y: fy };
        return;
      }
      tries++;
    }
    // fallback
    food = { x: 0, y: 0 };
  }

  function tick() {
    // New head
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      return gameOver();
    }

    snake.unshift(head);

    // Eating food
    if (food && head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      // speed up a little every 5 points
      if (score % 5 === 0 && speed > 40) {
        speed -= 8;
        // restart interval with new speed
        clearInterval(gameInterval);
        gameInterval = setInterval(tick, speed);
      }
      placeFood();
    } else {
      // Move forward: remove tail
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    stopLoop();
    statusEl.textContent = `Game Over — Score: ${score}. Press Restart ↺`;
    // flash canvas red then redraw
    flashCanvas();
  }

  function flashCanvas() {
    const prev = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(220,38,38,0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTimeout(() => {
      ctx.putImageData(prev, 0, 0);
    }, 120);
  }

  function drawCell(x, y, color, radius = 4) {
    const px = x * GRID;
    const py = y * GRID;
    // rounded rect
    ctx.fillStyle = color;
    const r = Math.min(radius, GRID / 2 - 1);
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + GRID, py, px + GRID, py + GRID, r);
    ctx.arcTo(px + GRID, py + GRID, px, py + GRID, r);
    ctx.arcTo(px, py + GRID, px, py, r);
    ctx.arcTo(px, py, px + GRID, py, r);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background grid optional (light)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw food
    if (food) {
      drawCell(food.x, food.y, '#ef4444', 6);
    }

    // draw snake: head different color
    snake.forEach((segment, idx) => {
      const col = idx === 0 ? '#065f46' : '#059669';
      drawCell(segment.x, segment.y, col, 6);
    });
  }

  // Input handling
  function setDirection(dx, dy) {
    // prevent reversing directly
    if (snake.length > 1) {
      const nextX = snake[0].x + dx;
      const nextY = snake[0].y + dy;
      if (nextX === snake[1].x && nextY === snake[1].y) {
        return;
      }
    }
    direction = { x: dx, y: dy };
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)) {
      e.preventDefault();
    }
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': setDirection(0, -1); break;
      case 'ArrowDown': case 's': case 'S': setDirection(0, 1); break;
      case 'ArrowLeft': case 'a': case 'A': setDirection(-1, 0); break;
      case 'ArrowRight': case 'd': case 'D': setDirection(1, 0); break;
      case ' ': // space to toggle
        if (isRunning) stopLoop(); else startLoop();
        break;
    }
  });

  // Buttons
  startBtn.addEventListener('click', () => startLoop());
  pauseBtn.addEventListener('click', () => stopLoop());
  restartBtn.addEventListener('click', () => {
    resetGame();
    startLoop();
  });

  // Prevent accidental text selection on double-click
  canvas.addEventListener('mousedown', (e) => e.preventDefault());

  // initialize
  resetGame();
  // enable pause disabled state initially
  pauseBtn.disabled = true;
})();
