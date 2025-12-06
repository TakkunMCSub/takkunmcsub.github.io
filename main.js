// Simple Tetris implementation
'use strict';

const COLS = 10;
const ROWS = 20;
const CELL = 24; // matches CSS --cell-size
const COLORS = [
  null,
  '#00f0f0', // I
  '#0000f0', // J
  '#f0a000', // L
  '#f0f000', // O
  '#00f000', // S
  '#a000f0', // T
  '#f00000'  // Z
];

const SHAPES = [
  [],
  [[1,1,1,1]], // I
  [[2,0,0],[2,2,2]], // J
  [[0,0,3],[3,3,3]], // L
  [[4,4],[4,4]], // O
  [[0,5,5],[5,5,0]], // S
  [[0,6,0],[6,6,6]], // T
  [[7,7,0],[0,7,7]]  // Z
];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
ctx.scale(canvas.width / (COLS * CELL), canvas.height / (ROWS * CELL));

const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');
nctx.scale(nextCanvas.width / (4 * CELL), nextCanvas.height / (4 * CELL));

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const startBtn = document.getElementById('start');

let arena = createMatrix(COLS, ROWS);
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;
let paused = false;

let player = {
  pos: {x:0,y:0},
  matrix: null,
  next: null,
  score: 0,
  level: 1,
  lines: 0
};

function createMatrix(w,h){
  const m = [];
  for(let y=0;y<h;y++){
    m.push(new Array(w).fill(0));
  }
  return m;
}

function drawMatrix(matrix, offset){
  for(let y=0;y<matrix.length;y++){
    for(let x=0;x<matrix[y].length;x++){
      const val = matrix[y][x];
      if(val){
        ctx.fillStyle = COLORS[val];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        ctx.strokeStyle = '#071226';
        ctx.lineWidth = 0.04;
        ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    }
  }
}

function draw(){
  ctx.fillStyle = '#071226';
  ctx.fillRect(0,0,COLS,ROWS);
  drawMatrix(arena, {x:0,y:0});
  drawMatrix(player.matrix, player.pos);
}

function merge(arena, player){
  player.matrix.forEach((row,y)=>{
    row.forEach((val,x)=>{
      if(val){
        arena[y + player.pos.y][x + player.pos.x] = val;
      }
    });
  });
}

function collide(arena, player){
  const m = player.matrix;
  const o = player.pos;
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x] && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0){
        return true;
      }
    }
  }
  return false;
}

function rotate(matrix, dir){
  // transpose
  for(let y=0;y<matrix.length;y++){
    for(let x=0;x<y;x++){
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if(dir > 0){
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir){
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while(collide(arena, player)){
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if(offset > player.matrix[0].length){
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function playerDrop(){
  player.pos.y++;
  if(collide(arena, player)){
    player.pos.y--;
    merge(arena, player);
    sweep();
    spawnPiece();
  }
  dropCounter = 0;
}

function hardDrop(){
  while(!collide(arena, player)){
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  sweep();
  spawnPiece();
  dropCounter = 0;
}

function sweep(){
  let rowCount = 0;
  outer: for(let y = arena.length -1; y >= 0; y--){
    for(let x = 0; x < arena[y].length; x++){
      if(arena[y][x] === 0){
        continue outer;
      }
    }
    const row = arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    y++;
    rowCount++;
  }
  if(rowCount > 0){
    const points = [0,40,100,300,1200];
    player.score += points[rowCount] * player.level;
    player.lines += rowCount;
    if(player.lines >= player.level * 10){
      player.level++;
      dropInterval = Math.max(100, dropInterval * 0.85);
    }
    updateHUD();
  }
}

function updateHUD(){
  scoreEl.textContent = player.score;
  levelEl.textContent = player.level;
}

function randomPiece(){
  const id = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  // deep copy shape
  return SHAPES[id].map(row => row.slice());
}

function spawnPiece(){
  player.matrix = player.next || randomPiece();
  player.next = randomPiece();
  player.pos.y = 0;
  player.pos.x = Math.floor((COLS - player.matrix[0].length) / 2);
  if(collide(arena, player)){
    // game over
    gameOver = true;
    paused = true;
    alert('Game Over. Score: ' + player.score);
  }
  drawNext();
}

function drawNext(){
  nctx.fillStyle = '#071226';
  nctx.fillRect(0,0,4,4);
  // center next in 4x4 grid
  const m = player.next;
  const offset = {x: Math.floor((4 - m[0].length)/2), y: Math.floor((4 - m.length)/2)};
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      const val = m[y][x];
      if(val){
        nctx.fillStyle = COLORS[val];
        nctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        nctx.strokeStyle = '#071226';
        nctx.lineWidth = 0.04;
        nctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    }
  }
}

function update(time = 0){
  if(paused) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if(dropCounter > dropInterval){
    player.pos.y++;
    if(collide(arena, player)){
      player.pos.y--;
      merge(arena, player);
      sweep();
      spawnPiece();
    }
    dropCounter = 0;
  }
  draw();
  requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
  if(gameOver) return;
  if(event.key === 'ArrowLeft'){
    player.pos.x--;
    if(collide(arena, player)) player.pos.x++;
  } else if(event.key === 'ArrowRight'){
    player.pos.x++;
    if(collide(arena, player)) player.pos.x--;
  } else if(event.key === 'ArrowDown'){
    playerDrop();
  } else if(event.key === 'ArrowUp'){
    playerRotate(1);
  } else if(event.code === 'Space'){
    hardDrop();
  } else if(event.key.toLowerCase() === 'p'){
    paused = !paused;
    if(!paused) requestAnimationFrame(update);
  }
});

startBtn.addEventListener('click', startGame);

function reset(){
  arena = createMatrix(COLS, ROWS);
  player.score = 0;
  player.level = 1;
  player.lines = 0;
  dropInterval = 1000;
  gameOver = false;
  paused = false;
  updateHUD();
}

function startGame(){
  reset();
  player.next = randomPiece();
  spawnPiece();
  requestAnimationFrame(update);
}

// initialize small preview grid scale for next canvas
(function init(){
  // scale contexts to logical grid units (1 unit = CELL)
  // already scaled at top; just clear
  nctx.fillStyle = '#071226';
  nctx.fillRect(0,0,4,4);
})();
