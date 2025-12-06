const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
ctx.scale(24, 24);  // 1ブロックを 24px × 24px に

// 次のブロック
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
nextCtx.scale(24, 24);

// 色
const colors = [
    null,
    "#00f0f0", // I
    "#f0a000", // L
    "#0000f0", // J
    "#f0f000", // O
    "#00f000", // S
    "#a000f0", // T
    "#f00000", // Z
];

// テトリミノ
const pieces = "ILJOSTZ";
function createPiece(type) {
    switch (type) {
        case "I": return [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
        case "L": return [[0,2,0],[0,2,0],[0,2,2]];
        case "J": return [[0,0,3],[0,0,3],[0,3,3]];
        case "O": return [[4,4],[4,4]];
        case "S": return [[0,5,5],[5,5,0],[0,0,0]];
        case "T": return [[0,6,0],[6,6,6],[0,0,0]];
        case "Z": return [[7,7,0],[0,7,7],[0,0,0]];
    }
}

// フィールド
function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

const arena = createMatrix(10, 20);

// 描画
function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0}, ctx);
    drawMatrix(player.matrix, player.pos, ctx);
}

// 衝突判定
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (
                m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

// 合体
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

// 1列削除
function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        player.score += 100;
        document.getElementById("score").innerText = player.score;
        y++;
    }
}

// 操作
function rotate() {
    const m = player.matrix;
    const N = m.length - 1;
    const rotated = m.map((row, y) => row.map((_, x) => m[N - x][y]));

    const pos = player.pos.x;
    let offset = 1;
    player.matrix = rotated;

    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > m[0].length) return;
    }
}

function move(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}

function drop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        resetPiece();
        arenaSweep();
    }
    dropCounter = 0;
}

function hardDrop() {
    while (!collide(arena, player)) player.pos.y++;
    player.pos.y--;
    merge(arena, player);
    resetPiece();
    arenaSweep();
}

// 次のブロック
function drawNext() {
    nextCtx.fillStyle = "#111";
    nextCtx.fillRect(0, 0, 5, 5);
    drawMatrix(nextPiece, {x: 1, y: 1}, nextCtx);
}

function resetPiece() {
    player.matrix = nextPiece;
    player.pos = {x: 3, y: 0};

    nextPiece = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    drawNext();

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        alert("Game Over!");
    }
}

// プレイヤー
let nextPiece = createPiece("T");

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

// 落下管理
let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
    const delta = time - lastTime;
    lastTime = time;

    dropCounter += delta;
    if (dropCounter > 500) drop();

    draw();
    requestAnimationFrame(update);
}

function newGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    document.getElementById("score").innerText = 0;

    nextPiece = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    resetPiece();
}

newGame();
update();
