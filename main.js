kaplay({
    width:640,
    height:480,
    background: [15, 15, 25],
    letterbox: true,
});

const gameWrap = document.getElementById("gameWrap");
const kaplayCanvas = document.querySelector("canvas");
if (kaplayCanvas) {
  kaplayCanvas.style.position = "absolute";
  kaplayCanvas.style.top = "0";
  kaplayCanvas.style.left = "0";
  gameWrap.insertBefore(kaplayCanvas, nameOverlayPlaceholder());
}
function nameOverlayPlaceholder() {
  return document.getElementById("nameOverlay");
}

const nameOverlay = document.getElementById("nameOverlay");
const nameInput = document.getElementById("nameInput");
const nameSubmit = document.getElementById("nameSubmit");

const victoryOverlay = document.createElement("div");
victoryOverlay.id = "victoryOverlay";
victoryOverlay.style.position = "absolute";
victoryOverlay.style.top = "0";
victoryOverlay.style.left = "0";
victoryOverlay.style.width = "100%";
victoryOverlay.style.height = "100%";
victoryOverlay.style.background = "rgba(8, 8, 14, 0.95)";
victoryOverlay.style.display = "none";
victoryOverlay.style.flexDirection = "column";
victoryOverlay.style.alignItems = "center";
victoryOverlay.style.justifyContent = "center";
victoryOverlay.style.zIndex = "12";
victoryOverlay.style.color = "#ffe9a8";
victoryOverlay.style.textAlign = "center";
victoryOverlay.innerHTML = `
  <h1 style="margin:0 0 12px;font-size:28px;letter-spacing:1px;">VICTORY!</h1>
  <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">You have slain the dragon and completed your quest. Congratulations!</p>
  <button id="victoryRestart" style="font-family: 'Courier New', monospace; font-size: 16px; padding: 10px 24px; background: #4666c8; border: none; border-radius: 6px; color: white; cursor: pointer;">PLAY AGAIN</button>
`;
gameWrap.appendChild(victoryOverlay);

document.getElementById("victoryRestart").addEventListener("click", restartGame);

function submitName() {
  const raw = nameInput.value.trim();
  player.name = raw.length > 0 ? raw.slice(0, 16) : "Hero";
  nameOverlay.style.display = "none";
  pushLog(`Welcome, ${player.name}! You were randomly selected by your village to slay the evil dragon that resides in the forest. Press EXPLORE to begin your adventure...`);
  refreshPlayerUI();
}

nameSubmit.addEventListener("click", submitName);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitName();
});

window.addEventListener("load", () => nameInput.focus());

const gameWidth = 640;
const gameHeight = 480;

const enemyTemplates = [
    {name:"Slime", maxHP:12, atkMin:1, atkMax:3, color: [90, 210, 130]},
    {name:"Goblin", maxHP:18, atkMin:1, atkMax:5, color: [90, 210, 130]},
    {name:"Orc", maxHP:30, atkMin:2, atkMax:7, color: [90, 210, 130]},
    {name:"Fafnir the Plunderer", maxHP:70, atkMin:3, atkMax:10, color: [90, 210, 130]},
];
const bossEnemies = ["Fafnir the Plunderer"];

let player = {
    name: "Hero",
    hp: 50,
    maxHP: 50,
    atkMin: 1,
    atkMax: 20,
};

let enemy = null;
let state = "idle";
let logLines = [];
let enemyNumber = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollD20() {
  return randomInt(1, 20);
}

function critChance() {
  return randomInt(1, 10);
}

function pushLog(msg) {
  logLines.push(msg);
  if (logLines.length > 9) logLines.shift();
  logText.text = logLines.join("\n");
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

add([
  text("DRAGON SLAYER", { size: 22 }),
  pos(gameWidth / 2, 22),
  anchor("center"),
  color(255, 220, 120),
]);

add([
  rect(600, 190, { radius: 6 }),
  pos(20, 50),
  color(25, 25, 40),
  outline(2, rgb(90, 90, 120)),
]);

const logText = add([
  text("Press EXPLORE to begin your adventure...", { size: 14, width: 570 }),
  pos(32, 60),
  color(220, 220, 230),
]);

add([
  rect(280, 90, {radius: 6}),
  pos(20, 250),
  color(20, 35, 25),
  outline(2, rgb(80, 140, 90)),
]);

const playerNameText = add([
  text(player.name, {size: 16}),
  pos(32, 260),
  color(180, 255, 190),
]);

const playerHPBarBg = add([
  rect(240, 16),
  pos(32, 288),
  color(50, 50, 50),
]);
const playerHPBarFg = add([
  rect(240, 16),
  pos(32, 288),
  color(90, 220, 110),
]);
const playerHPText = add([
  text("", { size: 12 }),
  pos(32, 310),
  color(200, 255, 200),
]);

const enemyPanelBg = add([
  rect(280, 90, { radius: 6 }),
  pos(340, 250),
  color(35, 20, 20),
  outline(2, rgb(140, 80, 80)),
  opacity(1),
]);

const enemyNameText = add([
  text("", { size: 16 }),
  pos(352, 260),
  color(255, 180, 180),
]);

const enemyHPBarBg = add([
  rect(240, 16),
  pos(352, 288),
  color(50, 50, 50),
]);
const enemyHPBarFg = add([
  rect(240, 16),
  pos(352, 288),
  color(220, 90, 90),
]);
const enemyHPText = add([
  text("", { size: 12 }),
  pos(352, 310),
  color(255, 200, 200),
]);

[enemyPanelBg, enemyNameText, enemyHPBarBg, enemyHPBarFg, enemyHPText].forEach(o => o.hidden = true);

function makeButton(x, y, w, h, label, col, onClickCb) {
  const button = add([
    rect(w, h, {radius: 6}),
    pos(x, y),
    color(...col),
    area(),
    "button",
  ]);
  const buttonText = add([
    text(label, {size: 16}),
    pos(x + w / 2, y + h / 2),
    anchor("center"),
    color(255, 255, 255),
  ]);
  button.onHoverUpdate(() => {button.color = rgb(col[0] + 20, col[1] + 20, col[2] + 20);});
  button.onHoverEnd(() => {button.color = rgb(...col);});
  return { button, buttonText, x, y, w, h, onClickCb };
}

let activeButtons = [];

function clearButtons() {
  for (const pair of activeButtons) {
    pair.button.destroy();
    pair.buttonText.destroy();
  }
  activeButtons = [];
}

function refreshButtons() {
  clearButtons();
  if (state === "idle") {
    activeButtons.push(makeButton(20, 360, 600, 46, "EXPLORE", [70, 100, 200], () => explore()));
  } else if (state === "encounter") {
    activeButtons.push(makeButton(20, 360, 190, 46, "ATTACK", [200, 70, 70], () => playerAttack()));
    activeButtons.push(makeButton(225, 360, 190, 46, "FLEE", [130, 130, 60], () => flee()));
  } else if (state === "gameover" || state === "victory") {
    activeButtons.push(makeButton(430, 360, 190, 46, "RESTART", [90, 90, 200], () => restartGame()));
  }
}
refreshButtons();

onClick(() => {
  const mp = mousePos();
  for (const pair of activeButtons) {
    if (mp.x >= pair.x && mp.x <= pair.x + pair.w && mp.y >= pair.y && mp.y <= pair.y + pair.h) {
      pair.onClickCb();
      break;
    }
  }
});

function refreshPlayerUI() {
  playerNameText.text = `${player.name}`;
  const pct = clamp(player.hp / player.maxHP, 0, 1);
  playerHPBarFg.width = 240 * pct;
  playerHPBarFg.color = pct > 0.5 ? rgb(90, 220, 110) : pct > 0.25 ? rgb(230, 200, 60) : rgb(220, 70, 70);
  playerHPText.text = `HP: ${player.hp} / ${player.maxHP}`;
}

function refreshEnemyUI() {
  if (!enemy) return;
  enemyNameText.text = enemy.name;
  const pct = clamp(enemy.hp / enemy.maxHP, 0, 1);
  enemyHPBarFg.width = 240 * pct;
  enemyHPText.text = `HP: ${Math.max(0, enemy.hp)} / ${enemy.maxHP}`;
}

function setEnemyPanelVisible(visible) {
  [enemyPanelBg, enemyNameText, enemyHPBarBg, enemyHPBarFg, enemyHPText].forEach(o => o.hidden = !visible);
}

function explore() {
  if (state !== "idle") return;
  const template = enemyTemplates[enemyNumber];
  if (!template || enemyNumber >= 5) {
    showVictoryScreen();
    return;
  }
  enemy = {
    name: template.name,
    hp: template.maxHP,
    maxHP: template.maxHP,
    atkMin: template.atkMin,
    atkMax: template.atkMax,
  };
  state = "encounter";
  if (bossEnemies.includes(enemy.name)) {
    wait(3, () => {
      setEnemyPanelVisible(true);
    });
  } else {
    setEnemyPanelVisible(true);
  };
  refreshEnemyUI();
  if (bossEnemies.includes(enemy.name)) {
    clearButtons();
    pushLog(`You hear a low rumbling...`);
    wait(3, () => {
      pushLog(`${enemy.name} appears at last! (${enemy.maxHP} HP)`);
      shake(5);
      refreshButtons();
    });
  } else {
  pushLog(`A wild ${enemy.name} appears! (${enemy.maxHP} HP)`);
  refreshButtons();
  }
  if (bossEnemies.includes(enemy.name)) {
    add([
      rect(gameWidth, gameHeight),
      color(80, 20, 20),
      opacity(0.3),
      lifespan(0.5)
    ]);
    shake(5);
    wait(1, () => {
      add([
      rect(gameWidth, gameHeight),
      color(80, 20, 20),
      opacity(0.3),
      lifespan(0.5)
      ]);
      shake(5);
    });
    wait(2, () => {
      add([
      rect(gameWidth, gameHeight),
      color(80, 20, 20),
      opacity(0.3),
      lifespan(0.5)
      ]);
      shake(5);
    });
  }
}

function spawnDamageText(x, y, amount, isCrit = false) {
  const dmgLabel = add([
    text(amount, { size: isCrit ? 24 : 16 }),
    pos(x, y),
    color(isCrit ? [255, 50, 50] : [255, 255, 255]),
    move(90, 40),
  ]);
  wait(0.75, () => dmgLabel.destroy());
}

function playerAttack() {
  if (state !== "encounter") return;

  const roll = rollD20();
  const critNumber = critChance();
  const isCrit = (critNumber === 1);

  if (bossEnemies.includes(enemy.name)) {
    if (roll === 1) {
      pushLog(`${player.name} rolls a 1... and fumbles, missing completely!`);
    } else {
      let dmg = roll
      if (critNumber === 1) {
        dmg *= 2
        enemy.hp -= dmg;
        pushLog(`Critical hit! ${player.name} rolls a ${roll} and hits ${enemy.name} for ${dmg} damage!`);
        spawnDamageText(470, 280, dmg, true);
      } else {
        enemy.hp -= dmg;
        pushLog(`${player.name} rolls a ${roll} and hits ${enemy.name} for ${dmg} damage!`);
        spawnDamageText(470, 280, dmg, false);
      };
    }
  } else {
    if (roll === 1) {
      pushLog(`${player.name} rolls a 1... and fumbles, missing completely!`);
    } else {
      let dmg = roll
      if (critNumber === 1) {
        dmg *= 2
        enemy.hp -= dmg;
        pushLog(`Critical hit! ${player.name} rolls a ${roll} and hits the ${enemy.name} for ${dmg} damage!`);
        spawnDamageText(470, 280, dmg, true);
      } else {
        enemy.hp -= dmg;
        pushLog(`${player.name} rolls a ${roll} and hits the ${enemy.name} for ${dmg} damage!`);
        spawnDamageText(470, 280, dmg, false);
      };
    }
  };

  refreshEnemyUI();

  if (enemy.hp <= 0) {
    winEncounter();
    return;
  }
  clearButtons();
  wait(1, () => {
  enemyAttack();
  refreshButtons();
  });
}

function enemyAttack() {
  if (!enemy) return;

  const roll = rollD20();
  const critNumber = critChance();
  const isCrit = (critNumber === 1);

  if (bossEnemies.includes(enemy.name)) {
    if (roll === 1) {
      pushLog(`${enemy.name} stumbles, missing ${player.name}!`);
    } else {
      let dmg = randomInt(enemy.atkMin, enemy.atkMax);
      if (critNumber === 1) {
        dmg *= 2
        player.hp -= dmg;
        pushLog(`Critical hit! ${enemy.name} and hits ${player.name} for ${dmg} damage!`);
        spawnDamageText(150, 280, dmg, true);
        shake (5);
      } else {
        player.hp -= dmg;
        pushLog(`${enemy.name}and hits ${player.name} for ${dmg} damage!`);
        spawnDamageText(150, 280, dmg, false);
        shake (2);
      }
    }
  } else {
    if (roll === 1) {
      pushLog(`The ${enemy.name} stumbles, missing ${player.name}!`);
    } else {
      let dmg = randomInt(enemy.atkMin, enemy.atkMax);
      if (critNumber === 1) {
        dmg *= 2
        player.hp -= dmg;
        pushLog(`Critical hit! The ${enemy.name} and hits ${player.name} for ${dmg} damage!`);
        spawnDamageText(150, 280, dmg, true);
        shake (5);
      } else {
        player.hp -= dmg;
        pushLog(`The ${enemy.name} and hits ${player.name} for ${dmg} damage!`);
        spawnDamageText(150, 280, dmg, false);
        shake (2);
      }
    } 
  };

  refreshPlayerUI();

  if (player.hp <= 0) {
    loseGame();
    return;
  };

  refreshButtons();
}

function showVictoryScreen() {
  state = "victory";
  enemy = null;
  setEnemyPanelVisible(false);
  victoryOverlay.style.display = "flex";
  pushLog(`You have slain the dragon and completed your quest. You can return to your village with good news. Congratulations!`);
  pushLog(`Press RESTART to begin a new adventure.`);
  refreshPlayerUI();
  refreshButtons();
}

function winEncounter() {
  pushLog(`${player.name} defeated the ${enemy.name}!`);

  enemyNumber++;
  enemy = null;
  if (enemyNumber >= 6) {
    showVictoryScreen();
    return;
  }
  state = "idle";
  setEnemyPanelVisible(false);
  refreshPlayerUI();
  refreshButtons();
}

function flee() {
  if (state !== "encounter") return;
  const roll = rollD20();

  if (bossEnemies.includes(enemy.name)) {
    if (roll >= 10) {
      pushLog(`${player.name} rolls a ${roll} and successfully flees from ${enemy.name}!`);
      enemy = null;
      state = "idle";
      setEnemyPanelVisible(false);
    } else {
      pushLog(`${player.name} rolls a ${roll} and fails to escape!`);
      enemyAttack();
    }
  } else {
    if (roll >= 10) {
      pushLog(`${player.name} rolls a ${roll} and successfully flees from the ${enemy.name}!`);
      enemy = null;
      state = "idle";
      setEnemyPanelVisible(false);
    } else {
      pushLog(`${player.name} rolls a ${roll} and fails to escape!`);
      enemyAttack();
    }
  }
  refreshButtons();
}

function loseGame() {
  state = "gameover";
  victoryOverlay.style.display = "none";
  if (bossEnemies.includes(enemy.name)) {
    pushLog(`${player.name} has been slain by ${enemy ? enemy.name : "the enemy"}... GAME OVER.`);
  } else {
    pushLog(`${player.name} has been slain by the ${enemy ? enemy.name : "the enemy"}... GAME OVER.`);
  };
  pushLog(`Press RESTART to try again.`);
  setEnemyPanelVisible(false);
  refreshButtons();
}

function restartGame() {
  if (state !== "gameover" && state !== "victory") return;
  const keepName = player.name;
  player = {name: keepName, hp: 50, maxHP: 50, atkMin: 1, atkMax: 20};
  enemy = null;
  enemyNumber = 0;
  state = "idle";
  logLines = [];
  victoryOverlay.style.display = "none";
  pushLog(`A new adventure begins for ${player.name}! Press EXPLORE to begin.`);
  refreshPlayerUI();
  setEnemyPanelVisible(false);
  refreshButtons();
}

refreshPlayerUI();
refreshButtons();