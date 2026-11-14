
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameScreen = document.getElementById("game-screen");
const objective = document.getElementById("objective");
const levelName = document.getElementById("level-name");

const chapters = [
  ["THE AWAKENING", "You found a photograph from the future.", "Someone has been here before."],
  ["THE SILENT FOREST", "A message appears: YOU HAVE BEEN HERE BEFORE.", "Who left these symbols?"],
  ["THE TOY SHOP", "A toy whispers: Don't open the final door.", "How does it know your voice?"],
  ["THE LOST CITY", "The entrance displays your name.", "Who built this city?"],
  ["THE CLOCKMAKER", "The clock counts backwards to your arrival.", "Can time be changed?"],
  ["ABOVE THE CLOUDS", "You see the mysterious house below.", "Why is it floating?"],
  ["THE FORGOTTEN LIBRARY", "A book describes your entire journey.", "Who wrote your story?"],
  ["THE EXPERIMENT", "All twelve worlds were created by one person.", "Who is that person?"],
  ["THE MIRROR WORLD", "Your reflection moves independently.", "What is on the other side?"],
  ["THE LAST SIGNAL", "The house is waiting for you.", "Who is sending the signal?"],
  ["THE TRUTH", "You discover who has guided you.", "Can you trust them?"],
  ["THE LAST DOOR", "The final secret is finally revealed.", "Was the journey ever really over?"]
];

let level = 1;
let running = false;
let paused = false;
let hasKey = false;
let keys = {};
let lastTime = 0;

const player = {
  x: 100,
  y: 100,
  size: 25,
  speed: 190
};

let keyObject = { x: 700, y: 300 };
let door = { x: 850, y: 450 };

const obstacles = [
  { x: 250, y: 100, w: 120, h: 45 },
  { x: 450, y: 240, w: 150, h: 45 },
  { x: 150, y: 390, w: 120, h: 45 }
];

function startLevel(number) {
  level = number;
  hasKey = false;
  paused = false;

  player.x = 90;
  player.y = 90;

  keyObject = {
    x: 150 + (number * 97) % 650,
    y: 100 + (number * 71) % 320
  };

  door = { x: 850, y: 450 };

  levelName.textContent =
    "LEVEL " + String(level).padStart(2, "0") +
    " — " + chapters[level - 1][0];

  objective.textContent = "Find the mysterious key.";
  saveProgress();
  draw();
}

function startGame() {
  const saved = JSON.parse(
    localStorage.getItem("lastDoorSave") || "{}"
  );

  const start = saved.level || 1;

  menu.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  running = true;
  startLevel(Math.min(12, start));
  requestAnimationFrame(loop);
}

function saveProgress() {
  localStorage.setItem("lastDoorSave", JSON.stringify({
    level,
    completed: level > 1 ? level - 1 : 0
  }));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function collides(x, y) {
  if (x < 20 || y < 20 || x > 940 || y > 520) {
    return true;
  }

  return obstacles.some(o =>
    x + 12 > o.x &&
    x - 12 < o.x + o.w &&
    y + 12 > o.y &&
    y - 12 < o.y + o.h
  );
}

function update(dt) {
  if (!running || paused) return;

  let dx = 0;
  let dy = 0;

  if (keys.ArrowUp || keys.w) dy--;
  if (keys.ArrowDown || keys.s) dy++;
  if (keys.ArrowLeft || keys.a) dx--;
  if (keys.ArrowRight || keys.d) dx++;

  const length = Math.hypot(dx, dy) || 1;

  dx = dx / length * player.speed * dt;
  dy = dy / length * player.speed * dt;

  if (!collides(player.x + dx, player.y)) {
    player.x += dx;
  }

  if (!collides(player.x, player.y + dy)) {
    player.y += dy;
  }

  if (!hasKey && distance(player, keyObject) < 30) {
    hasKey = true;
    objective.textContent = "Key found! Find the exit door.";
  }

  if (distance(player, door) < 40) {
    objective.textContent = hasKey
      ? "Press E or SPACE to open the door."
      : "The door is locked. Find the key!";
  }
}

function interact() {
  if (!running || paused) return;

  if (distance(player, door) < 45) {
    if (hasKey) completeLevel();
    else objective.textContent = "You need the key first!";
  }
}

function completeLevel() {
  running = false;

  const chapter = chapters[level - 1];

  if (level === 12) {
    localStorage.removeItem("lastDoorSave");
    alert(
      "THE LAST DOOR\n\n" +
      "You completed all twelve chapters!\n\n" +
      chapter[1] + "\n\n" +
      "THE END... OR IS IT?"
    );

    menu.classList.remove("hidden");
    gameScreen.classList.add("hidden");
    return;
  }

  saveProgress();

  alert(
    "CHAPTER " + String(level).padStart(2, "0") +
    " COMPLETED!\n\n" +
    chapter[1] + "\n\n" +
    "NEXT CHAPTER: " +
    chapters[level][0] +
    "\n\n" +
    chapter[2] +
    "\n\nPress OK to continue."
  );

  startLevel(level + 1);
  running = true;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Floor
  ctx.fillStyle = "#29283a";
  ctx.fillRect(0, 0, 960, 540);

  // Floor pattern
  ctx.strokeStyle = "#363449";
  ctx.lineWidth = 1;

  for (let x = 0; x < 960; x += 48) {
    for (let y = 0; y < 540; y += 48) {
      ctx.strokeRect(x, y, 48, 48);
    }
  }

  // Room boundary
  ctx.strokeStyle = "#b99b68";
  ctx.lineWidth = 5;
  ctx.strokeRect(10, 10, 940, 520);

  // Obstacles
  obstacles.forEach(o => {
    ctx.fillStyle = "#63516a";
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = "#b99b68";
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  });

  // Key
  if (!hasKey) {
    ctx.fillStyle = "#f3ce72";
    ctx.beginPath();
    ctx.arc(keyObject.x, keyObject.y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(keyObject.x - 3, keyObject.y + 5, 6, 17);
  }

  // Exit door
  ctx.fillStyle = hasKey ? "#b99b68" : "#654c50";
  ctx.fillRect(door.x - 20, door.y - 27, 40, 55);

  ctx.fillStyle = "#f5e9d0";
  ctx.beginPath();
  ctx.arc(door.x + 10, door.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Player
  ctx.fillStyle = "#e9c98e";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#292437";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();

  // Inventory
  ctx.fillStyle = "#f5e9d0";
  ctx.font = "18px Georgia";
  ctx.fillText(
    hasKey ? "KEY: COLLECTED" : "KEY: MISSING",
    30, 42
  );

  ctx.font = "14px Georgia";
  ctx.fillText("Explore • Find the key • Unlock the door", 30, 510);
}

function loop(timestamp) {
  if (!running) return;

  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.05);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// Keyboard controls
document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    e.preventDefault();
  }

  keys[key] = true;

  if (key === "e" || key === " ") interact();

  if (key === "escape" && running) {
    paused = !paused;
    objective.textContent = paused
      ? "Game paused. Press ESC to resume."
      : "Continue exploring!";
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// Mobile controls
document.querySelectorAll("[data-move]").forEach(button => {
  const direction = button.dataset.move;

  const keyMap = {
    up: "arrowup",
    down: "arrowdown",
    left: "arrowleft",
    right: "arrowright"
  };

  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[keyMap[direction]] = true;
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(event => {
    button.addEventListener(event, () => {
      keys[keyMap[direction]] = false;
    });
  });
});

document.getElementById("interact").addEventListener("click", interact);

document.getElementById("new-game").addEventListener("click", () => {
  if (confirm("Start a new adventure? Existing progress will be reset.")) {
    localStorage.removeItem("lastDoorSave");
    startGame();
  }
});

document.getElementById("continue-game").addEventListener("click", startGame);

document.getElementById("pause-game").addEventListener("click", () => {
  paused = !paused;
  objective.textContent = paused
    ? "Game paused."
    : "Continue exploring!";
});

// Initial menu state
const saved = JSON.parse(
  localStorage.getItem("lastDoorSave") || "{}"
);

document.getElementById("continue-game").disabled = !saved.level;
draw();
