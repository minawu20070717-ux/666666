// --- 全域變數 ---
let assets = {}; 
let player;
let hinter;
let questioners = [];
let bgImg;
let gameState = "PLAYING"; 
let currentQuestionIndex = 0; 
let currentQuestionerIndex = 0; 
let score = 0; 

// 地平線高度（改為相對高度，適應不同螢幕）
let GROUND_Y; 

// 提示者的提示泡泡狀態
let hinterHint = {
  show: false,
  text: "提示：按 A/D 移動，W 跳躍，靠近提問者回答問題！",
  startTime: 0,
  duration: 4000 
};

// --- 題庫 ---
const quizData = [
  { q: "地圖上通常用什麼顏色來代表海洋或湖泊？", options: ["綠色", "藍色", "黃色"], ans: 1 },
  { q: "我們居住的地方，大家互相幫助形成的共同生活圈叫什麼？", options: ["社區", "遊樂園", "工廠"], ans: 0 },
  { q: "過馬路時，看到紅燈應該怎麼做？", options: ["快速通過", "停下來等待", "慢慢走過去"], ans: 1 },
  { q: "下列哪一項是小學生應盡的義務？", options: ["賺錢養家", "遵守校規", "選舉投票"], ans: 1 },
  { q: "台灣的首都是哪個城市？", options: ["高雄市", "台中市", "台北市"], ans: 2 },
  { q: "下列哪一個是台灣的原住民族群？", options: ["愛斯基摩人", "阿美族", "印第安人"], ans: 1 }
];

// 動態提示詞（對應每題）
const dynamicHints = [
  "觀察一下地球儀，水多的地方通常看起來藍藍的喔！",
  "住在附近的鄰居常聚在一起活動，就像一個溫馨的小...？",
  "紅燈停、綠燈行，安全是回家唯一的路！",
  "想想看，在學校裡我們最基本的責任是什麼呢？",
  "那是北部的政治、經濟中心，總統府也在那裡喔！",
  "台灣有 16 個官方認定的原住民族，阿字開頭的是哪一族？"
];

function preload() {
  bgImg = loadImage("背景.webp");
  assets.pWalk = loadImage("玩家/走路.png");
  assets.pIdle = loadImage("玩家/待機.png");
  assets.hinter = loadImage("提示者/跑步.png");
  assets.q1 = loadImage("提問者1/跑步.png");
  assets.q2 = loadImage("提問者2/跑步.png");
  assets.q3 = loadImage("提問者3/跑步.png");
}

function setup() {
  // ★ 改為全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  GROUND_Y = height * 0.85; // 地平線設定在畫面下方 85% 處
  
  player = new Player(100, GROUND_Y); 
  hinter = new NPC(width * 0.2, GROUND_Y, assets.hinter, 239, 60, 4, "hinter");
  
  // 提問者位置改為相對寬度
  questioners.push(new NPC(width * 0.4, GROUND_Y, assets.q1, 659, 151, 5, "questioner"));
  questioners.push(new NPC(width * 0.65, GROUND_Y, assets.q2, 456, 80, 6, "questioner"));
  questioners.push(new NPC(width * 0.85, GROUND_Y, assets.q3, 466, 75, 6, "questioner"));
  // 讓提問者1（index 0）縮小一點（例如 85% 大小）
  questioners[0].displayScale = 0.85;
}

// ★ 視窗大小改變時自動調整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  GROUND_Y = height * 0.85;
}

function draw() {
  background(220);
  // 背景等比例鋪滿
  image(bgImg, 0, 0, width, height);
  
  if (gameState === "PLAYING") {
    handleGamePlay();
  } else if (gameState === "QUIZ") {
    drawGameCharacters(); 
    handleQuiz();
  } else if (gameState === "WIN") {
    drawGameCharacters();
    handleWin();
  }

  // 永遠顯示在最上層
  drawScoreboard(); 
  drawUI();
  handleHinterBubble();
}

function drawGameCharacters() {
  // 提示角色只在按下 K 鍵時才顯示（由 handleHinterBubble 負責）
  // hinter.display(); // 移除，改由 handleHinterBubble 控制
  questioners.forEach(q => q.display());
  player.display();
}

function handleGamePlay() {
  hinter.moveRandomly();
  drawGameCharacters();
  player.update();
  
  if (currentQuestionerIndex < questioners.length) {
    let targetQ = questioners[currentQuestionerIndex];
    drawTargetMarker(targetQ);

    let d = dist(player.x, player.y, targetQ.x, targetQ.y);
    if (d < 200) {
      fill(255); stroke(0, 100); strokeWeight(2);
      rectMode(CENTER);
      rect(targetQ.x, targetQ.y - height * 0.25, 180, 40, 20);
      fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(16);
      text("靠近了! 點擊回答", targetQ.x, targetQ.y - height * 0.25);
      
      if (d < 100) gameState = "QUIZ";
    }
  }
}

function drawTargetMarker(npc) {
  let floatY = sin(frameCount * 0.1) * 10;
  fill(255, 50, 50); noStroke();
  push();
  translate(npc.x, npc.y - height * 0.3 + floatY);
  triangle(-15, -15, 15, -15, 0, 15);
  pop();
}

// ★ 美化後的計分板
function drawScoreboard() {
  push();
  translate(width - 180, 20);
  
  // 外框裝飾
  fill(0, 0, 0, 100);
  noStroke();
  rect(0, 0, 160, 60, 30);
  
  // 分數圓圈
  fill(255, 215, 0); // 金色
  ellipse(30, 30, 45, 45);
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text("$", 30, 31);
  
  // 分數文字
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(22);
  text("SCORE: " + score, 65, 30);
  pop();
}

function handleHinterBubble() {
  if (hinterHint.show) {
    if (millis() - hinterHint.startTime > hinterHint.duration) {
      hinterHint.show = false;
    } else {
      // 只在按下 K 時才顯示提示角色與對話匡
      hinter.display();
      
      push();
      textSize(18);
      textAlign(CENTER, CENTER);
      let boxW = textWidth(hinterHint.text) + 40;
      let boxH = 60;
      let bx = hinter.x;
      let by = hinter.y - 150;
      fill(255); stroke(0); strokeWeight(3);
      rectMode(CENTER);
      rect(bx, by, boxW, boxH, 15);
      triangle(bx - 10, by + boxH/2, bx + 10, by + boxH/2, bx, by + boxH/2 + 20);
      fill(0); noStroke();
      text(hinterHint.text, bx, by);
      pop();
    }
  }
}

function handleQuiz() {
  fill(0, 0, 0, 180);
  rectMode(CORNER);
  rect(0, 0, width, height);
  
  // 題目主框
  fill(255); stroke(0); strokeWeight(4);
  rectMode(CENTER);
  let boxW = 700;
  let boxH = 500;
  rect(width/2, height/2, boxW, boxH, 30);
  
  let qData = quizData[currentQuestionIndex];
  
  // 題號
  fill(50); noStroke(); textSize(28); textStyle(BOLD); textAlign(CENTER, CENTER);
  text(`挑戰第 ${currentQuestionIndex + 1} 題`, width/2, height/2 - 180);
  
  // 題目文字（多行對齊在對話框內）
  fill(0); textStyle(NORMAL); textSize(24);
  textAlign(CENTER, CENTER);
  text(qData.q, width/2, height/2 - 80, 600, 100);
  
  // 選項框框（放在題目框框內，使用 CENTER 模式）
  let startY = height/2 + 40; // 調整起始位置，讓選項框在主框內
  for(let i=0; i<qData.options.length; i++) {
    let btnY = startY + i * 70;
    let btnW = 500;
    let btnH = 60;
    
    if (mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
      fill(100, 150, 255);
      cursor(HAND);
    } else {
      fill(245);
      cursor(ARROW);
    }
    
    rectMode(CENTER);
    stroke(0); strokeWeight(2);
    rect(width/2, btnY, btnW, btnH, 15);
    
    // 選項文字對齊
    fill(0); noStroke(); textSize(20); textAlign(CENTER, CENTER);
    text(qData.options[i], width/2, btnY);
  }
}

function handleWin() {
  fill(0, 0, 0, 200);
  rectMode(CORNER); rect(0, 0, width, height);
  fill(255, 215, 0); textAlign(CENTER, CENTER); textSize(60); textStyle(BOLD);
  text("★ 任務達成 ★", width/2, height/2 - 100);
  fill(255); textSize(30);
  text("最終得分: " + score, width/2, height/2);
  textSize(20); textStyle(NORMAL);
  text("點擊畫面重新開始挑戰", width/2, height/2 + 100);
}

function drawUI() {
  fill(0, 150); noStroke();
  rectMode(CORNER);
  rect(10, 10, 230, 40, 20);
  fill(255); textSize(16); textAlign(LEFT, CENTER);
  text("WASD 移動 | 按 'K' 呼叫提示", 30, 30);
}

function mousePressed() {
  if (gameState === "QUIZ") {
    let qData = quizData[currentQuestionIndex];
    let startY = height/2 + 40;
    let btnW = 500;
    let btnH = 60;
    for(let i=0; i<qData.options.length; i++) {
      let btnY = startY + i * 70;
      if (mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
        if (i === qData.ans) {
          score += 10;
          alert("答對了！得分 +10");
          nextLevel();
        } else {
          // ★ 扣分機制
          score = max(0, score - 5); 
          alert("答錯了！扣除 5 分，再試一次！");
        }
      }
    }
  } else if (gameState === "WIN") {
    location.reload(); // 點擊後重新整理遊戲
  }
}

function keyPressed() {
  if (key === 'k' || key === 'K') {
    hinterHint.show = true;
    hinterHint.startTime = millis();
  }
}

function nextLevel() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= quizData.length) {
    gameState = "WIN";
    return;
  }
  gameState = "PLAYING";
  currentQuestionerIndex = Math.floor(currentQuestionIndex / 2);
}

class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.vy = 0; this.gravity = 0.8;
    this.jumpForce = -15; this.speed = 6; this.onGround = false;
    this.facingRight = true; this.frameIndex = 0;
    this.frameDelay = 5; this.frameTimer = 0;
  }
  update() {
    let isMoving = false;
    if (keyIsDown(65)) { this.x -= this.speed; this.facingRight = false; isMoving = true; }
    if (keyIsDown(68)) { this.x += this.speed; this.facingRight = true; isMoving = true; }
    if (keyIsDown(87) && this.onGround) { this.vy = this.jumpForce; this.onGround = false; }
    this.y += this.vy; this.vy += this.gravity;
    if (this.y > GROUND_Y) { this.y = GROUND_Y; this.vy = 0; this.onGround = true; }
    this.x = constrain(this.x, 50, width - 50);
    this.frameTimer++;
    if (this.frameTimer > this.frameDelay) { this.frameIndex++; this.frameTimer = 0; }
    this.isMoving = isMoving;
  }
  display() {
    push(); translate(this.x, this.y);
    if (!this.facingRight) scale(-1, 1);
    let sprite, totalW, totalH, cols;
    if (this.isMoving) { sprite = assets.pWalk; totalW = 359; totalH = 47; cols = 7; } 
    else { sprite = assets.pIdle; totalW = 203; totalH = 46; cols = 4; }
    let w = totalW / cols; let h = totalH;
    imageMode(CENTER);
    image(sprite, 0, -h * 1.5, w * 3, h * 3, (this.frameIndex % cols) * w, 0, w, h);
    pop();
  }
}

class NPC {
  constructor(x, y, img, w, h, frames, type) {
    this.x = x; this.y = y; this.img = img;
    this.totalW = w; this.totalH = h; this.frames = frames;
    this.frameW = w / frames; this.frameIndex = 0;
    this.type = type; this.vx = 3;
    // 個別顯示縮放（可針對某個提問者調整大小）
    this.displayScale = 1;
  }
  moveRandomly() {
    if (this.type === "hinter") {
      this.x += this.vx;
      if (this.x > width * 0.4 || this.x < 50) this.vx *= -1;
    }
  }
  display() {
    if (frameCount % 6 === 0) this.frameIndex = (this.frameIndex + 1) % this.frames;
    push(); translate(this.x, this.y);
    if (this.vx < 0 && this.type === "hinter") scale(-1, 1);
    imageMode(CENTER);
        let baseScale = this.type === "questioner" ? 2.0 : 2.5; // 稍微加大 NPC
        let scaleFactor = baseScale * (this.displayScale || 1);
        image(this.img, 0, -this.totalH * scaleFactor / 2,
          this.frameW * scaleFactor, this.totalH * scaleFactor,
          this.frameIndex * this.frameW, 0, this.frameW, this.totalH);
        pop();
  }
}
