(() => {
  const GRID_SIZE = 20;
  const CELL = 2;
  const WIDTH = GRID_SIZE * CELL;
  const HEIGHT = GRID_SIZE * CELL;
  const INITIAL_SPEED = 200;

  const canvas = document.getElementById('glCanvas');
  const scoreEl = document.getElementById('score');
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf9fafb);

  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, GRID_SIZE * 1.2, GRID_SIZE * 1.2);
  camera.lookAt(0, 0, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const gridHelper = new THREE.GridHelper(WIDTH, GRID_SIZE, 0xe5e7eb, 0xe5e7eb);
  gridHelper.rotation.x = Math.PI / 2;
  scene.add(gridHelper);

  const snakeHeadMat = new THREE.MeshStandardMaterial({ color: 0x065f46 });
  const snakeBodyMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
  const foodMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });

  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = null;
  let score = 0;
  let speed = INITIAL_SPEED;
  let interval = null;
  let running = false;

  function gridToWorld(gx, gy) {
    const offset = (GRID_SIZE / 2 - 0.5) * CELL;
    return { x: gx * CELL - offset, y: CELL / 2, z: gy * CELL - offset };
  }

  function makeCube(mat) {
    return new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.9, CELL * 0.9, CELL * 0.9), mat);
  }

  function placeFood() {
    if (food && food.mesh) scene.remove(food.mesh);
    let x, y;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (snake.some(s => s.x === x && s.y === y));

    const pos = gridToWorld(x, y);
    const mesh = makeCube(foodMat);
    mesh.position.set(pos.x, pos.y, pos.z);
    scene.add(mesh);
    food = { x, y, mesh };
  }

  function resetGame() {
    snake.forEach(s => scene.remove(s.mesh));
    snake = [];
    const cx = Math.floor(GRID_SIZE / 2);
    const cy = Math.floor(GRID_SIZE / 2);
    for (let i = 0; i < 3; i++) {
      const x = cx - i;
      const y = cy;
      const mesh = makeCube(i === 0 ? snakeHeadMat : snakeBodyMat);
      const pos = gridToWorld(x, y);
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);
      snake.push({ x, y, mesh });
    }
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    updateHUD();
    placeFood();
    stopGame();
    statusEl.textContent = "Ready — press ▶ Start";
  }

  function updateHUD() {
    scoreEl.textContent = score;
  }

  function startGame() {
    if (running) return;
    running = true;
    statusEl.textContent = "Playing...";
    interval = setInterval(move, speed);
    startBtn.disabled = true;
    pauseBtn.disabled = false;
  }

  function stopGame() {
    running = false;
    clearInterval(interval);
    interval = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function move() {
    dir = nextDir;
    let head = snake[0];
    let newX = head.x + dir.x;
    let newY = head.y + dir.y;

    // ✅ Wrap around logic
    if (newX < 0) newX = GRID_SIZE - 1;
    if (newX >= GRID_SIZE) newX = 0;
    if (newY < 0) newY = GRID_SIZE - 1;
    if (newY >= GRID_SIZE) newY = 0;

    // check self collision
    if (snake.some(s => s.x === newX && s.y === newY)) return gameOver();

    const newHeadMesh = makeCube(snakeHeadMat);
    const pos = gridToWorld(newX, newY);
    newHeadMesh.position.set(pos.x, pos.y, pos.z);
    scene.add(newHeadMesh);

    snake[0].mesh.material = snakeBodyMat;
    snake.unshift({ x: newX, y: newY, mesh: newHeadMesh });

    // Eat food → grow
    if (food && newX === food.x && newY === food.y) {
      scene.remove(food.mesh);
      food = null;
      score++;
      updateHUD();
      placeFood();
      if (speed > 60) {
        speed -= 10;
        clearInterval(interval);
        interval = setInterval(move, speed);
      }
    } else {
      // move normally (remove tail)
      const tail = snake.pop();
      scene.remove(tail.mesh);
    }
  }

  function gameOver() {
    stopGame();
    statusEl.textContent = `Game Over! Score: ${score}`;
  }

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key === "arrowup" || key === "w") nextDir = { x: 0, y: -1 };
    if (key === "arrowdown" || key === "s") nextDir = { x: 0, y: 1 };
    if (key === "arrowleft" || key === "a") nextDir = { x: -1, y: 0 };
    if (key === "arrowright" || key === "d") nextDir = { x: 1, y: 0 };
  });

  startBtn.onclick = startGame;
  pauseBtn.onclick = stopGame;
  restartBtn.onclick = () => {
    resetGame();
    startGame();
  };

  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  resetGame();
  render();
})();
