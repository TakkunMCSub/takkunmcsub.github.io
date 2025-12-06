/* ================================
   Simple Tetris Game
================================ */

const COLS = 10;
const ROWS = 20;
const BLOCK = 20;

const canvas = document.getElementById("play");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const nextCanvas = document.getElementById("next");
const nctx = nextCanvas.getContext("2d");
nctx.imageSmoothingEnabled = false;

// ピース定義
const PIECES = {
  I: { color: '#7ad0ff', shapes:[
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]]
  ]},
  J: { color: '#3b82f6', shapes:[
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]]
  ]},
  L: { color: '#f59e0b', shapes:[
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]]
  ]},
  O: { color: '#facc15', shapes:[
    [[1,1],[1,1]]
  ]},
  S: { color: '#10b981', shapes:[
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]]
  ]},
  T: { color: '#8b5cf6', shapes:[
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]]
  ]},
  Z: { color: '#ef4444', shapes:[
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]]
  ]}
};

// 盤面
function createMatrix(w, h){
  return Array.from({length:h}, () => Array(w).fill(0));
}

let board = createMatrix(COLS, ROWS);

// ゲーム状態
let current = null;
let nextPiece = null;

let dropInterval = 1000;
let dropTimer = 0;
let paused = false;

let score = 0, lines = 0, level = 1;

/* 7袋ランダム */
function bagGenerator(){
  const keys = Object.keys(PIECES);
  let bag = [];
  return function nextInBag(){
    if(bag.length === 0){
      bag = keys.slice();
      for(let i=bag.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  };
}
const nextBag = bagGenerator();

/* ピース生成 */
function spawnPiece(name){
  const def = PIECES[name];
  const shape = def.shapes[0];

  return {
    name,
    shapeIndex:0,
    shapes:def.shapes,
    matrix: JSON.parse(JSON.stringify(shape)),
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
    color: def.color
  };
}

/* ゲームリセット */
function resetGame(){
  board = createMatrix(COLS, ROWS);

  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 1000;

  current = spawnPiece(nextBag());
  nextPiece = spawnPiece(nextBag());

  updateStats();
  draw();
  drawNext();

  paused = false;
}

/* 衝突判定 */
function collide(board, piece, offsetX=0, offsetY=0){
  const m = piece.matrix;
  for(let y=0; y<m.length; y++){
    for(let x=0; x<m[y].length; x++){
      if(m[y][x]){
        const bx = piece.x + x + offsetX;
        const by = piece.y + y + offsetY;
        if(bx < 0 || bx >= COLS || by >= ROWS) return true;
        if(by >= 0 && board[by][bx]) return true;
      }
    }
  }
  return false;
}

/* 固定 */
function merge(board, piece){
  const m = piece.matrix;
  for(let y=0; y<m.length; y++){
    for(let x=0; x<m[y].length; x++){
      if(m[y][x]){
        const bx = piece.x + x;
        const by = piece.y + y;
        if(by >= 0) board[by][bx] = piece.color;
      }
    }
  }
}

/* 行消去 */
function sweep(){
  let count = 0;
  for(let y=ROWS -1; y>=0; y--){
    if(board[y].every(v => v)){
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      count++;
      y++;
    }
  }

  if(count > 0){
    const base = [0,40,100,300,1200];
    score += (base[count] || count*100) * level;
    lines += count;

    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(80, 1000 - (level-1)*100);

    updateStats();
  }
}

/* ピース交代 */
function nextTurn(){
  merge(board, current);
  sweep();

  current = nextPiece;
  nextPiece = spawnPiece(nextBag());

  if(collide(board, current)){
    alert("Game Over");
    resetGame();
  }
}

/* 描画 */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#111";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  for(let y=0; y<ROWS; y++){
    for(let x=0; x<COLS; x++){
      if(board[y][x]) drawBlock(ctx, x, y, board[y][x]);
    }
  }

  if(current){
    const m = current.matrix;
    for(let y=0; y<m.length; y++){
      for(let x=0; x<m[y].length; x++){
        if(m[y][x]) drawBlock(ctx, current.x + x, current.y + y, current.color);
      }
    }
  }
}

/* ブロック描画 */
function drawBlock(c, gx, gy, color){
  const x = gx * BLOCK;
  const y = gy * BLOCK;

  c.fillStyle = color;
  c.fillRect(x+1, y+1, BLOCK-2, BLOCK-2);

  c.fillStyle = "rgba(255,255,255,0.18)";
  c.fillRect(x+2, y+2, BLOCK-4, (BLOCK-4)/3);

  c.strokeStyle = "rgba(0,0,0,0.4)";
  c.strokeRect(x+1, y+1, BLOCK-2, BLOCK-2);
}

/* 次ピース */
function drawNext(){
  nctx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
  nctx.fillStyle="#111";
  nctx.fillRect(0,0,nextCanvas.width,nextCanvas.height);

  const p = nextPiece;
  if(!p) return;

  const tile = 25;
  for(let y=0; y<p.matrix.length; y++){
    for(let x=0; x<p.matrix[y].length; x++){
      if(p.matrix[y][x]){
        nctx.fillStyle = p.color;
        nctx.fillRect(20 + x*tile, 20 + y*tile, tile-4, tile-4);
      }
    }
  }
}

/* ステータス更新 */
function updateStats(){
  document.getElementById("score").textContent = score;
  document.getElementById("lines").textContent = lines;
  document.getElementById("level").textContent = level;
}

/* 回転 */
function rotatePiece(piece){
  const nextIndex = (piece.shapeIndex + 1) % piece.shapes.length;
  const next = piece.shapes[nextIndex];

  // コピーして仮で回転
  const backup = piece.matrix;
  piece.matrix = JSON.parse(JSON.stringify(next));
  piece.shapeIndex = nextIndex;

  // 壁キック簡易
  if(collide(board, piece)){
    piece.x++;
    if(collide(board, piece)){
      piece.x -= 2;
      if(collide(board, piece)){
        piece.x++;
        piece.matrix = backup;
        piece.shapeIndex = (nextIndex - 1 + piece.shapes.length) % piece.shapes.length;
      }
    }
  }
}

/* 操作 */
function move(dx){
  if(!collide(board, current, dx, 0)){
    current.x += dx;
    draw();
  }
}

function softDrop(){
  if(!collide(board, current, 0, 1)){
    current.y++;
    score++;
  } else {
    nextTurn();
  }
  updateStats();
  draw();
}

function hardDrop(){
  let drop = 0;
  while(!collide(board, current, 0, 1)){
    current.y++;
    drop++;
  }
  score += drop * 2;
  updateStats();
  nextTurn();
  draw();
  drawNext();
}

/* キーボード */
document.addEventListener("keydown", e => {
  if(e.key==="ArrowLeft"){ move(-1); }
  else if(e.key==="ArrowRight"){ move(1); }
  else if(e.key==="ArrowDown"){ softDrop(); }
  else if(e.key==="ArrowUp" || e.key==="z"){ rotatePiece(current); draw(); }
  else if(e.code==="Space"){ hardDrop(); }
  else if(e.key==="p"){ togglePause(); }
});

/* ボタン操作 */
document.getElementById("btn-left").onclick = () => move(-1);
document.getElementById("btn-right").onclick = () => move(1);
document.getElementById("btn-down").onclick = () => softDrop();
document.getElementById("btn-rotate").onclick = () => { rotatePiece(current); draw(); };
document.getElementById("btn-drop").onclick = () => hardDrop();
document.getElementById("btn-pause").onclick = () => togglePause();
document.getElementById("btn-new").onclick = () => { if(confirm("新しいゲームを開始しますか？")) resetGame(); };

function togglePause(){
  paused = !paused;
  document.getElementById("btn-pause").textContent = paused ? "再開" : "ポーズ";
}

/* メインループ */
let last = 0;
function update(time=0){
  if(paused){ last = time; return requestAnimationFrame(update); }

  const delta = time - last;
  last = time;
  dropTimer += delta;

  if(dropTimer > dropInterval){
    dropTimer = 0;

    if(!collide(board, current, 0, 1)){
      current.y++;
    } else {
      nextTurn();
    }
    draw();
    drawNext();
  }

  requestAnimationFrame(update);
}

/* 初期化 */
resetGame();
requestAnimationFrame(update);
