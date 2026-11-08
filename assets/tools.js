const root = document.getElementById("toolRoot");
const params = new URLSearchParams(location.search);
const currentTool = params.get("tool") || "uuid";
let statusTimer;

const toolInfo = {
  uuid: ["UUID ジェネレーター", "UUID v1・v4・v7を生成します。生成処理にはブラウザの暗号学的乱数を使用します。", "開発"],
  password: ["パスワード生成", "文字種・長さ・使用しない文字を指定して、ランダムなパスワードを作成します。", "セキュリティ"],
  text: ["テキスト整形", "文字数の確認から改行整理、重複削除、並べ替えまで、文章の細かな処理をまとめて行えます。", "文章・変換"],
  json: ["JSON 整形・検証", "JSONの構文を検証し、読みやすく整形したり、通信向けに圧縮したりできます。", "開発"],
  base64: ["Base64 変換", "テキストをBase64へ変換・復元します。日本語とURLセーフ形式にも対応しています。", "データ"],
  url: ["URL エンコード", "URL文字列のエンコード・デコードと、URLの構成要素の確認ができます。", "データ"],
  timestamp: ["タイムスタンプ変換", "Unixタイムスタンプと日時を相互に変換します。秒・ミリ秒を自動判別できます。", "日時・数値"],
  color: ["カラーコード変換", "HEX・RGB・HSLを相互変換します。カラーピッカーで色を確認しながら調整できます。", "デザイン"],
  regex: ["正規表現テスター", "入力した正規表現の一致箇所・グループ・置換結果を確認できます。", "開発"],
  hash: ["ハッシュ生成", "Web Crypto APIを使用してSHA-1・SHA-256・SHA-384・SHA-512のハッシュ値を生成します。", "セキュリティ"],
  gradient: ["CSS グラデーション", "色と角度を調整して、CSSのlinear-gradientを作成します。", "デザイン"],
  bytes: ["データ容量変換", "バイト数をKB・MB・GB・TBなどへ換算します。1000単位と1024単位を切り替えられます。", "日時・数値"],
  random: ["ランダム抽選・並べ替え", "候補リストから1つを抽選したり、リスト全体をランダムに並べ替えたりできます。", "文章・変換"]
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function setStatus(message, type = "", timeout = 4500) {
  const element = document.getElementById("toolStatus");
  if (!element) return;
  element.textContent = message;
  element.className = `tool-status${type ? ` ${type}` : ""}`;
  clearTimeout(statusTimer);
  if (timeout > 0 && message) statusTimer = setTimeout(() => {
    element.textContent = "";
    element.className = "tool-status";
  }, timeout);
}

async function copyText(value, label = "コピーしました") {
  if (!value) {
    setStatus("コピーする内容がありません。", "error");
    return false;
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const temporary = document.createElement("textarea");
      temporary.value = value;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.append(temporary);
      temporary.select();
      const copied = document.execCommand("copy");
      temporary.remove();
      if (!copied) throw new Error("コピーに失敗しました。");
    }
    setStatus(label, "success");
    return true;
  } catch {
    setStatus("コピーできませんでした。内容を選択してコピーしてください。", "error");
    return false;
  }
}

function downloadText(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function secureRandomBytes(length) {
  if (!window.crypto?.getRandomValues) throw new Error("このブラウザでは安全な乱数を利用できません。");
  return crypto.getRandomValues(new Uint8Array(length));
}

function secureRandomInt(max) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000) throw new Error("乱数の範囲が不正です。");
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function mountTool(mainHTML, asideHTML) {
  const [title, description, category] = toolInfo[currentTool];
  document.title = `${title} | Utility Tools`;
  let theme = "light";
  try { theme = localStorage.getItem("utility-theme") === "dark" ? "dark" : "light"; } catch {}
  setTheme(theme);
  root.innerHTML = `
    <div class="tool-head">
      <div class="tool-head-copy">
        <a class="tool-back" href="../">← ツール一覧へ</a>
        <p class="eyebrow">${escapeHTML(category)}</p>
        <h1 class="tool-title">${escapeHTML(title)}</h1>
        <p class="tool-description">${escapeHTML(description)}</p>
      </div>
    </div>
    <div class="tool-workspace">
      <section class="tool-main">
        ${mainHTML}
        <div id="toolStatus" class="tool-status" role="status" aria-live="polite"></div>
      </section>
      <aside class="tool-aside">
        ${asideHTML || `<section class="tool-panel"><h3>このツールについて</h3><p>入力内容はこのページ内で処理されます。ページを閉じると入力内容は保持されません。</p></section>`}
        <section class="tool-panel"><h3>関連ツール</h3><p><a href="../">ほかのツールを見る →</a></p></section>
      </aside>
    </div>`;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("utility-theme", theme); } catch {}
  const button = document.getElementById("themeToggle");
  if (button) button.textContent = theme === "dark" ? "ライト表示" : "ダーク表示";
}

document.getElementById("themeToggle")?.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

function viewUUID() {
  mountTool(`
    <section class="tool-panel">
      <h2>生成設定</h2>
      <div class="tool-row">
        <div class="tool-field"><label for="uuidVersion">バージョン</label><select class="tool-select" id="uuidVersion"><option value="v4">UUID v4（ランダム）</option><option value="v7">UUID v7（時刻順）</option><option value="v1">UUID v1（時刻ベース）</option><option value="guid">GUID（大文字 v4）</option></select></div>
        <div class="tool-field"><label for="uuidCount">生成する個数</label><input class="tool-input" id="uuidCount" type="number" min="1" max="50" value="5"></div>
      </div>
      <div class="tool-checkboxes" style="margin-top:14px"><label class="tool-check"><input id="uuidUpper" type="checkbox"> 大文字で表示</label><label class="tool-check"><input id="uuidCompact" type="checkbox"> ハイフンを省略</label></div>
      <div class="tool-actions"><button class="tool-button" id="uuidGenerate" type="button">生成する</button><button class="tool-button secondary" id="uuidCopyAll" type="button">すべてコピー</button><button class="tool-button secondary" id="uuidDownload" type="button">TXTで保存</button></div>
    </section>
    <section class="tool-panel"><div class="section-heading" style="margin:0 0 14px"><h2>生成結果</h2><p id="uuidResultCount">0件</p></div><div class="uuid-result" id="uuidResults"><div class="tool-output empty">「生成する」を押してください。</div></div></section>`,
    `<section class="tool-panel"><h3>バージョンの違い</h3><p><strong>v1</strong> 時刻とランダムなノード情報を使用します。<br><strong>v4</strong> ランダム値を中心に生成します。<br><strong>v7</strong> Unixミリ秒時刻とランダム値を組み合わせます。</p></section><section class="tool-panel"><h3>補足</h3><p>UUID v7は時刻順に並べやすい形式です。GUIDはUUID v4を大文字で表示したものとして扱います。</p></section>`);

  let lastResults = [];
  let lastV1Timestamp = 0n;
  let clockSequence = secureRandomInt(0x4000);
  const node = secureRandomBytes(6);
  node[0] |= 1;

  function formatBytes(bytes) {
    return [...bytes].map(value => value.toString(16).padStart(2, "0")).join("");
  }
  function addHyphens(hex) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  function createV4() {
    const bytes = secureRandomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return formatBytes(bytes);
  }
  function createV7() {
    const bytes = secureRandomBytes(16);
    let time = BigInt(Date.now());
    for (let index = 5; index >= 0; index--) {
      bytes[index] = Number(time & 0xffn);
      time >>= 8n;
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return formatBytes(bytes);
  }
  function createV1() {
    const epoch = 0x01b21dd213814000n;
    let timestamp = BigInt(Date.now()) * 10000n + epoch;
    if (timestamp <= lastV1Timestamp) timestamp = lastV1Timestamp + 1n;
    lastV1Timestamp = timestamp;
    const timeLow = Number(timestamp & 0xffffffffn).toString(16).padStart(8, "0");
    const timeMid = Number((timestamp >> 32n) & 0xffffn).toString(16).padStart(4, "0");
    const timeHigh = (Number((timestamp >> 48n) & 0x0fffn) | 0x1000).toString(16).padStart(4, "0");
    const seq = ((clockSequence & 0x3fff) | 0x8000).toString(16).padStart(4, "0");
    return `${timeLow}${timeMid}${timeHigh}${seq}${formatBytes(node)}`;
  }
  function generate() {
    try {
      const count = Number(document.getElementById("uuidCount").value);
      if (!Number.isInteger(count) || count < 1 || count > 50) throw new Error("個数は1～50の整数で指定してください。");
      const version = document.getElementById("uuidVersion").value;
      const uppercase = document.getElementById("uuidUpper").checked || version === "guid";
      const compact = document.getElementById("uuidCompact").checked;
      lastResults = Array.from({ length: count }, () => {
        const raw = version === "v1" ? createV1() : version === "v7" ? createV7() : createV4();
        let formatted = addHyphens(raw);
        if (compact) formatted = raw;
        return uppercase ? formatted.toUpperCase() : formatted;
      });
      const results = document.getElementById("uuidResults");
      results.replaceChildren();
      lastResults.forEach((value, index) => {
        const line = document.createElement("div");
        line.className = "uuid-line";
        const code = document.createElement("code");
        code.textContent = value;
        const button = document.createElement("button");
        button.className = "small-button";
        button.type = "button";
        button.textContent = "コピー";
        button.addEventListener("click", () => copyText(value));
        line.append(code, button);
        results.append(line);
      });
      document.getElementById("uuidResultCount").textContent = `${count}件`;
      setStatus(`${count}件のUUIDを生成しました。`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }
  document.getElementById("uuidGenerate").addEventListener("click", generate);
  document.getElementById("uuidCopyAll").addEventListener("click", () => copyText(lastResults.join("\n")));
  document.getElementById("uuidDownload").addEventListener("click", () => lastResults.length && downloadText("uuids.txt", lastResults.join("\n")));
  generate();
}

function viewPassword() {
  mountTool(`
    <section class="tool-panel">
      <h2>生成設定</h2>
      <div class="tool-row">
        <div class="tool-field"><label for="passwordLength">文字数 <span class="field-hint">8～128文字</span></label><input class="tool-input" id="passwordLength" type="number" min="8" max="128" value="20"></div>
        <div class="tool-field"><label for="passwordCount">生成する個数</label><input class="tool-input" id="passwordCount" type="number" min="1" max="10" value="1"></div>
      </div>
      <div class="tool-separator"></div>
      <div class="tool-checkboxes">
        <label class="tool-check"><input type="checkbox" id="pwUpper" checked> 英大文字</label>
        <label class="tool-check"><input type="checkbox" id="pwLower" checked> 英小文字</label>
        <label class="tool-check"><input type="checkbox" id="pwNumbers" checked> 数字</label>
        <label class="tool-check"><input type="checkbox" id="pwSymbols"> 記号</label>
      </div>
      <div class="tool-separator"></div>
      <div class="tool-checkboxes">
        <label class="tool-check"><input type="checkbox" id="pwNoAmbiguous"> 紛らわしい文字を除外（O・0・I・lなど）</label>
        <label class="tool-check"><input type="checkbox" id="pwNoRepeat"> 同じ文字を使わない</label>
      </div>
      <div class="tool-actions"><button class="tool-button" id="pwGenerate" type="button">生成する</button><button class="tool-button secondary" id="pwCopy" type="button">コピー</button></div>
    </section>
    <section class="tool-panel">
      <h2>生成結果</h2>
      <div class="password-preview"><input class="tool-input" id="pwResult" type="password" readonly placeholder="生成結果がここに表示されます"><button class="password-visibility" type="button" id="pwVisibility">表示</button></div>
      <div class="tool-row" style="margin-top:12px"><div class="tool-field"><label>強度の目安</label><div id="pwStrengthText" class="field-hint">未生成</div><div class="strength-track"><div class="strength-fill" id="pwStrengthFill"></div></div></div><div class="tool-field"><label>推定エントロピー</label><div class="tool-output" id="pwEntropy">-</div></div></div>
      <div id="pwMultiple" class="uuid-result" style="margin-top:14px"></div>
    </section>`,
    `<section class="tool-panel"><h3>生成方式</h3><p>暗号学的乱数を使用し、文字の偏りを抑えて選択します。生成したパスワードはサーバーへ送信されません。</p></section><section class="tool-panel"><h3>使い方の目安</h3><p>サービスごとに異なるパスワードを設定し、可能な場合はパスワードマネージャーを利用してください。</p></section>`);

  let allPasswords = [];
  function generate() {
    try {
      const length = Number(document.getElementById("passwordLength").value);
      const count = Number(document.getElementById("passwordCount").value);
      if (!Number.isInteger(length) || length < 8 || length > 128) throw new Error("文字数は8～128の整数で指定してください。");
      if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error("個数は1～10の整数で指定してください。");
      const ambiguous = "O0Il1|`'\"";
      const groups = [];
      if (document.getElementById("pwUpper").checked) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
      if (document.getElementById("pwLower").checked) groups.push("abcdefghijklmnopqrstuvwxyz");
      if (document.getElementById("pwNumbers").checked) groups.push("0123456789");
      if (document.getElementById("pwSymbols").checked) groups.push("!@#$%^&*()-_=+[]{}:,.?/~");
      if (!groups.length) throw new Error("使用する文字種を1つ以上選択してください。");
      const exclude = document.getElementById("pwNoAmbiguous").checked;
      const noRepeat = document.getElementById("pwNoRepeat").checked;
      const usableGroups = groups.map(group => [...group].filter(char => !exclude || !ambiguous.includes(char)));
      const pool = [...new Set(usableGroups.flat())];
      if (length < usableGroups.length) throw new Error("文字数が選択した文字種の数より少ないため生成できません。");
      if (noRepeat && length > pool.length) throw new Error(`重複なしで生成できる最大文字数は${pool.length}文字です。`);
      if (usableGroups.some(group => group.length === 0)) throw new Error("選択した文字種に使用可能な文字がありません。");
      allPasswords = Array.from({ length: count }, () => {
        const chars = usableGroups.map(group => group[secureRandomInt(group.length)]);
        const candidates = noRepeat ? pool.filter(char => !chars.includes(char)) : pool;
        while (chars.length < length) {
          const char = candidates[secureRandomInt(candidates.length)];
          if (!noRepeat || !chars.includes(char)) chars.push(char);
        }
        for (let index = chars.length - 1; index > 0; index--) {
          const target = secureRandomInt(index + 1);
          [chars[index], chars[target]] = [chars[target], chars[index]];
        }
        return chars.join("");
      });
      const result = document.getElementById("pwResult");
      result.value = allPasswords[0];
      updateStrength(allPasswords[0], pool.length);
      const list = document.getElementById("pwMultiple");
      list.replaceChildren();
      allPasswords.slice(1).forEach((password, index) => {
        const item = document.createElement("div");
        item.className = "uuid-line";
        const code = document.createElement("input");
        code.className = "tool-input";
        code.type = "password";
        code.readOnly = true;
        code.value = password;
        const button = document.createElement("button");
        button.className = "small-button";
        button.type = "button";
        button.textContent = "コピー";
        button.addEventListener("click", () => copyText(password));
        item.append(code, button);
        list.append(item);
      });
      setStatus(`${count}件のパスワードを生成しました。`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }
  function updateStrength(password, poolSize) {
    const bits = password.length * Math.log2(Math.max(poolSize, 1));
    const level = bits < 40 ? "短め" : bits < 60 ? "標準" : bits < 80 ? "強い" : "非常に強い";
    document.getElementById("pwStrengthText").textContent = level;
    document.getElementById("pwEntropy").textContent = `${bits.toFixed(1)} bit`;
    document.getElementById("pwStrengthFill").style.width = `${Math.min(100, bits / 1.2)}%`;
  }
  document.getElementById("pwGenerate").addEventListener("click", generate);
  document.getElementById("pwCopy").addEventListener("click", () => copyText(document.getElementById("pwResult").value));
  document.getElementById("pwVisibility").addEventListener("click", event => {
    const field = document.getElementById("pwResult");
    field.type = field.type === "password" ? "text" : "password";
    event.currentTarget.textContent = field.type === "password" ? "表示" : "隠す";
  });
  generate();
}

function viewText() {
  mountTool(`
    <section class="tool-panel">
      <h2>テキスト入力</h2>
      <textarea class="tool-textarea large" id="textInput" placeholder="ここに文章やテキストを入力してください。"></textarea>
      <div class="tool-stat-grid" id="textStats" style="margin-top:12px"><div class="tool-stat"><span>文字数</span><strong>0</strong></div><div class="tool-stat"><span>単語数</span><strong>0</strong></div><div class="tool-stat"><span>行数</span><strong>0</strong></div></div>
      <div class="tool-actions"><button class="tool-button secondary" data-text-action="upper">大文字</button><button class="tool-button secondary" data-text-action="lower">小文字</button><button class="tool-button secondary" data-text-action="title">単語の先頭を大文字</button><button class="tool-button secondary" data-text-action="trim">前後の空白を削除</button><button class="tool-button secondary" data-text-action="blank">空行を削除</button><button class="tool-button secondary" data-text-action="unique">重複行を削除</button><button class="tool-button secondary" data-text-action="sort">行を昇順に並べ替え</button><button class="tool-button secondary" data-text-action="reverse">行を逆順にする</button><button class="tool-button secondary" data-text-action="normalize">空白を整理</button><button class="tool-button secondary" data-text-action="sentence">文頭を大文字</button></div>
      <div class="tool-separator"></div>
      <div class="tool-row"><div class="tool-field"><label for="textOutput">処理結果</label><textarea class="tool-textarea" id="textOutput" placeholder="処理結果がここに表示されます。"></textarea></div></div>
      <div class="tool-actions"><button class="tool-button" id="textCopy" type="button">結果をコピー</button><button class="tool-button secondary" id="textReplace" type="button">入力欄に戻す</button><button class="tool-button secondary" id="textClear" type="button">クリア</button></div>
    </section>`,
    `<section class="tool-panel"><h3>文字数の数え方</h3><p>文字数はUnicodeのコードポイント単位で数えます。空白を除いた文字数も表示します。単語数は対応ブラウザでは言語に応じて分割します。</p></section>`);

  const input = document.getElementById("textInput");
  const output = document.getElementById("textOutput");
  function countWords(text) {
    if (!text.trim()) return 0;
    if (window.Intl?.Segmenter) {
      try {
        const language = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text) ? "ja" : "en";
        const segmenter = new Intl.Segmenter(language, { granularity: "word" });
        return [...segmenter.segment(text)].filter(item => item.isWordLike).length;
      } catch {}
    }
    return text.trim().split(/\s+/).length;
  }
  function updateStats() {
    const text = input.value;
    const values = [
      ["文字数", [...text].length],
      ["空白除外", [...text.replace(/[\s\u3000]/g, "")].length],
      ["単語数", countWords(text)],
      ["行数", text ? text.split(/\r\n|\r|\n/).length : 0],
      ["段落数", text.trim() ? text.trim().split(/\n\s*\n/).length : 0],
      ["バイト数", new TextEncoder().encode(text).length]
    ];
    const stats = document.getElementById("textStats");
    stats.replaceChildren();
    values.forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "tool-stat";
      const name = document.createElement("span");
      name.textContent = label;
      const amount = document.createElement("strong");
      amount.textContent = value.toLocaleString("ja-JP");
      item.append(name, amount);
      stats.append(item);
    });
  }
  input.addEventListener("input", updateStats);
  document.querySelectorAll("[data-text-action]").forEach(button => button.addEventListener("click", () => {
    const value = input.value;
    const lines = value.replace(/\r\n?/g, "\n").split("\n");
    let result = value;
    switch (button.dataset.textAction) {
      case "upper": result = value.toLocaleUpperCase(); break;
      case "lower": result = value.toLocaleLowerCase(); break;
      case "title": result = value.toLocaleLowerCase().replace(/(^|\s)([a-z])/g, (_, prefix, letter) => prefix + letter.toLocaleUpperCase()); break;
      case "trim": result = value.trim(); break;
      case "blank": result = lines.filter(line => line.trim()).join("\n"); break;
      case "unique": result = [...new Set(lines)].join("\n"); break;
      case "sort": result = [...lines].sort((a, b) => a.localeCompare(b, "ja", { numeric: true })).join("\n"); break;
      case "reverse": result = [...lines].reverse().join("\n"); break;
      case "normalize": result = value.replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim(); break;
      case "sentence": result = value.replace(/(^|[.!?。！？]\s+)([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase()); break;
    }
    output.value = result;
    setStatus("処理結果を出力欄へ反映しました。", "success");
  }));
  document.getElementById("textCopy").addEventListener("click", () => copyText(output.value));
  document.getElementById("textReplace").addEventListener("click", () => { input.value = output.value; updateStats(); setStatus("入力欄を更新しました。", "success"); });
  document.getElementById("textClear").addEventListener("click", () => { input.value = ""; output.value = ""; updateStats(); setStatus("入力と結果をクリアしました。", "success"); });
  updateStats();
}

function viewJSON() {
  mountTool(`
    <section class="tool-panel"><h2>JSON入力</h2><textarea class="tool-textarea large" id="jsonInput" spellcheck="false" placeholder='{"name":"Utility Tools","enabled":true}'></textarea>
      <div class="tool-row" style="margin-top:12px"><div class="tool-field"><label for="jsonIndent">インデント</label><select class="tool-select" id="jsonIndent"><option value="2">スペース2個</option><option value="4">スペース4個</option><option value="tab">タブ</option></select></div></div>
      <div class="tool-actions"><button class="tool-button" id="jsonFormat">整形する</button><button class="tool-button secondary" id="jsonMinify">圧縮する</button><button class="tool-button secondary" id="jsonValidate">検証する</button><button class="tool-button secondary" id="jsonCopy">結果をコピー</button><button class="tool-button secondary" id="jsonDownload">JSONを保存</button></div>
    </section>
    <section class="tool-panel"><h2>結果</h2><textarea class="tool-textarea large" id="jsonOutput" spellcheck="false" placeholder="整形・圧縮したJSONがここに表示されます。"></textarea><div id="jsonInfo" class="tool-status"></div></section>`,
    `<section class="tool-panel"><h3>JSONについて</h3><p>JSON.parseで構文を検証し、JSON.stringifyで整形・圧縮します。コメントや末尾カンマを含むJSONC形式には対応していません。</p></section>`);
  const input = document.getElementById("jsonInput");
  const output = document.getElementById("jsonOutput");
  function parse() {
    try { return { value: JSON.parse(input.value), error: null }; }
    catch (error) { return { value: null, error }; }
  }
  function indentValue() {
    const value = document.getElementById("jsonIndent").value;
    return value === "tab" ? "\t" : Number(value);
  }
  function run(mode) {
    const parsed = parse();
    const info = document.getElementById("jsonInfo");
    if (parsed.error) {
      info.textContent = `構文エラー: ${parsed.error.message}`;
      info.className = "tool-status error";
      output.value = "";
      setStatus("JSONの構文を確認してください。", "error");
      return;
    }
    if (mode === "format") output.value = JSON.stringify(parsed.value, null, indentValue());
    else if (mode === "minify") output.value = JSON.stringify(parsed.value);
    info.textContent = "JSONの構文は正しいです。";
    info.className = "tool-status success";
    setStatus(mode === "validate" ? "JSONの検証に成功しました。" : "変換が完了しました。", "success");
  }
  document.getElementById("jsonFormat").addEventListener("click", () => run("format"));
  document.getElementById("jsonMinify").addEventListener("click", () => run("minify"));
  document.getElementById("jsonValidate").addEventListener("click", () => run("validate"));
  document.getElementById("jsonCopy").addEventListener("click", () => copyText(output.value));
  document.getElementById("jsonDownload").addEventListener("click", () => output.value && downloadText("formatted.json", output.value, "application/json;charset=utf-8"));
}

function viewBase64() {
  mountTool(`
    <section class="tool-panel"><h2>テキスト入力</h2><textarea class="tool-textarea large" id="base64Input" placeholder="変換したいテキスト、またはBase64文字列を入力"></textarea>
      <div class="tool-checkboxes" style="margin-top:12px"><label class="tool-check"><input type="checkbox" id="base64URL"> URLセーフ形式を使用</label><label class="tool-check"><input type="checkbox" id="base64Padding" checked> パディング（=）を付ける</label></div>
      <div class="tool-actions"><button class="tool-button" id="base64Encode">Base64に変換</button><button class="tool-button secondary" id="base64Decode">テキストに戻す</button><button class="tool-button secondary" id="base64Copy">結果をコピー</button><button class="tool-button secondary" id="base64Swap">入力と結果を入れ替え</button></div>
    </section>
    <section class="tool-panel"><h2>変換結果</h2><textarea class="tool-textarea large" id="base64Output" readonly placeholder="結果がここに表示されます"></textarea></section>`,
    `<section class="tool-panel"><h3>対応形式</h3><p>UTF-8でバイト列へ変換してからBase64化するため、日本語や絵文字を含むテキストにも対応します。</p></section>`);
  const input = document.getElementById("base64Input");
  const output = document.getElementById("base64Output");
  function toBinary(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)));
    return binary;
  }
  document.getElementById("base64Encode").addEventListener("click", () => {
    try {
      const bytes = new TextEncoder().encode(input.value);
      let encoded = btoa(toBinary(bytes));
      if (document.getElementById("base64URL").checked) encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_");
      if (!document.getElementById("base64Padding").checked) encoded = encoded.replace(/=+$/g, "");
      output.value = encoded;
      setStatus("Base64へ変換しました。", "success");
    } catch (error) { setStatus(`変換できませんでした: ${error.message}`, "error"); }
  });
  document.getElementById("base64Decode").addEventListener("click", () => {
    try {
      let value = input.value.trim().replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
      if (!value || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1) throw new Error("Base64文字列の形式が正しくありません。");
      value = value.replace(/=+$/g, "");
      value += "=".repeat((4 - value.length % 4) % 4);
      const binary = atob(value);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      output.value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      setStatus("テキストへ復元しました。", "success");
    } catch (error) { output.value = ""; setStatus(`デコードできませんでした: ${error.message}`, "error"); }
  });
  document.getElementById("base64Copy").addEventListener("click", () => copyText(output.value));
  document.getElementById("base64Swap").addEventListener("click", () => { const value = input.value; input.value = output.value; output.value = value; setStatus("入力と結果を入れ替えました。", "success"); });
}

function viewURL() {
  mountTool(`
    <section class="tool-panel"><h2>URL変換</h2><textarea class="tool-textarea" id="urlInput" placeholder="https://example.com/search?q=日本語" style="min-height:130px"></textarea>
      <div class="tool-actions"><button class="tool-button" id="urlEncode">URL全体をエンコード</button><button class="tool-button secondary" id="urlEncodePart">一部をエンコード</button><button class="tool-button secondary" id="urlDecode">デコード</button><button class="tool-button secondary" id="urlCopy">結果をコピー</button><button class="tool-button secondary" id="urlClear">クリア</button></div>
      <div class="tool-separator"></div><label class="tool-field"><span class="field-label">変換結果</span><textarea class="tool-textarea" id="urlOutput" readonly style="min-height:120px"></textarea></label>
    </section>
    <section class="tool-panel"><h2>URLの構成を確認</h2><div class="tool-row"><div class="tool-field"><label for="urlParseInput">URL</label><input class="tool-input" id="urlParseInput" placeholder="https://example.com/path?key=value#top"></div><div><button class="tool-button" id="urlParse">解析する</button></div></div><div id="urlParts" class="tool-table-wrap" style="margin-top:12px"></div></section>`,
    `<section class="tool-panel"><h3>使い分け</h3><p>「エンコード」はURL全体向け、「デコード」はパーセントエンコードされた文字列の復元に使用します。URLの一部だけを扱う場合は、入力欄の内容に応じて利用してください。</p></section>`);
  const input = document.getElementById("urlInput");
  const output = document.getElementById("urlOutput");
  document.getElementById("urlEncode").addEventListener("click", () => {
    try { output.value = encodeURI(input.value); setStatus("URL全体をエンコードしました。", "success"); }
    catch { setStatus("入力に変換できない文字が含まれています。", "error"); }
  });
  document.getElementById("urlEncodePart").addEventListener("click", () => {
    try { output.value = encodeURIComponent(input.value); setStatus("URLの一部としてエンコードしました。", "success"); }
    catch { setStatus("入力に変換できない文字が含まれています。", "error"); }
  });
  document.getElementById("urlDecode").addEventListener("click", () => {
    try { output.value = decodeURIComponent(input.value); setStatus("URLをデコードしました。", "success"); }
    catch { setStatus("不正なパーセントエンコードが含まれています。", "error"); }
  });
  document.getElementById("urlCopy").addEventListener("click", () => copyText(output.value));
  document.getElementById("urlClear").addEventListener("click", () => { input.value = ""; output.value = ""; });
  document.getElementById("urlParse").addEventListener("click", () => {
    try {
      const url = new URL(document.getElementById("urlParseInput").value.trim());
      const rows = [["プロトコル", url.protocol], ["ホスト", url.host], ["ホスト名", url.hostname], ["ポート", url.port || "（指定なし）"], ["パス", url.pathname], ["クエリ", url.search || "（なし）"], ["フラグメント", url.hash || "（なし）"], ["ユーザー名", url.username || "（なし）"]];
      const table = document.createElement("table");
      table.className = "tool-table";
      const body = document.createElement("tbody");
      rows.forEach(([name, value]) => {
        const row = document.createElement("tr");
        const th = document.createElement("th");
        const td = document.createElement("td");
        th.textContent = name;
        td.textContent = value;
        row.append(th, td);
        body.append(row);
      });
      table.append(body);
      document.getElementById("urlParts").replaceChildren(table);
      setStatus("URLを解析しました。", "success");
    } catch { setStatus("有効なURLを入力してください。", "error"); }
  });
}

function viewTimestamp() {
  mountTool(`
    <section class="tool-panel"><h2>Unixタイムスタンプ → 日時</h2><div class="tool-row"><div class="tool-field"><label for="unixInput">タイムスタンプ（秒 / ミリ秒）</label><input class="tool-input" id="unixInput" inputmode="decimal" placeholder="例: 1794140000"></div><div><button class="tool-button" id="unixConvert">変換する</button></div><div><button class="tool-button secondary" id="unixNow">現在時刻</button></div></div><div class="tool-separator"></div><div class="tool-stat-grid"><div class="tool-stat"><span>ローカル日時</span><strong id="unixLocal" style="font-size:14px">-</strong></div><div class="tool-stat"><span>UTC</span><strong id="unixUTC" style="font-size:14px">-</strong></div><div class="tool-stat"><span>ISO 8601</span><strong id="unixISO" style="font-size:12px">-</strong></div></div><div class="tool-actions"><button class="tool-button secondary" id="unixCopy">ISO日時をコピー</button></div></section>
    <section class="tool-panel"><h2>日時 → Unixタイムスタンプ</h2><div class="tool-row"><div class="tool-field"><label for="dateInput">日時（端末のタイムゾーン）</label><input class="tool-input" id="dateInput" type="datetime-local" step="1"></div><div><button class="tool-button" id="dateConvert">変換する</button></div></div><div class="tool-stat-grid" style="margin-top:14px"><div class="tool-stat"><span>秒</span><strong id="dateSeconds">-</strong></div><div class="tool-stat"><span>ミリ秒</span><strong id="dateMilliseconds">-</strong></div></div><div class="tool-actions"><button class="tool-button secondary" id="dateCopySeconds">秒をコピー</button><button class="tool-button secondary" id="dateCopyMilliseconds">ミリ秒をコピー</button></div></section>`,
    `<section class="tool-panel"><h3>秒とミリ秒</h3><p>10桁前後の値は秒、13桁前後の値はミリ秒として自動判別します。日時欄はこの端末のタイムゾーンで扱います。</p></section>`);
  let currentISO = "";
  let currentSeconds = "";
  let currentMilliseconds = "";
  function convertUnix() {
    const raw = document.getElementById("unixInput").value.trim();
    const value = Number(raw);
    if (!raw || !Number.isFinite(value)) { setStatus("有効なタイムスタンプを入力してください。", "error"); return; }
    const milliseconds = Math.abs(value) < 1e11 ? value * 1000 : value;
    const date = new Date(milliseconds);
    if (!Number.isFinite(date.getTime())) { setStatus("日時の範囲外です。", "error"); return; }
    currentISO = date.toISOString();
    document.getElementById("unixLocal").textContent = date.toLocaleString();
    document.getElementById("unixUTC").textContent = date.toUTCString();
    document.getElementById("unixISO").textContent = currentISO;
    setStatus(Math.abs(value) < 1e11 ? "秒として変換しました。" : "ミリ秒として変換しました。", "success");
  }
  function convertDate() {
    const raw = document.getElementById("dateInput").value;
    const value = new Date(raw).getTime();
    if (!raw || !Number.isFinite(value)) { setStatus("有効な日時を選択してください。", "error"); return; }
    currentSeconds = String(Math.floor(value / 1000));
    currentMilliseconds = String(value);
    document.getElementById("dateSeconds").textContent = currentSeconds;
    document.getElementById("dateMilliseconds").textContent = currentMilliseconds;
    setStatus("タイムスタンプへ変換しました。", "success");
  }
  document.getElementById("unixConvert").addEventListener("click", convertUnix);
  document.getElementById("unixNow").addEventListener("click", () => { document.getElementById("unixInput").value = String(Date.now()); convertUnix(); });
  document.getElementById("dateConvert").addEventListener("click", convertDate);
  document.getElementById("unixCopy").addEventListener("click", () => copyText(currentISO));
  document.getElementById("dateCopySeconds").addEventListener("click", () => copyText(currentSeconds));
  document.getElementById("dateCopyMilliseconds").addEventListener("click", () => copyText(currentMilliseconds));
  document.getElementById("unixInput").value = String(Math.floor(Date.now() / 1000));
  convertUnix();
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  document.getElementById("dateInput").value = local;
  convertDate();
}

function viewColor() {
  mountTool(`
    <section class="tool-panel"><h2>カラー設定</h2><div class="color-controls"><div class="tool-field"><label for="colorPicker">カラーピッカー</label><input class="tool-input" id="colorPicker" type="color" value="#245c88"></div><div class="tool-field"><label for="colorHex">HEX</label><input class="tool-input" id="colorHex" value="#245c88" spellcheck="false"></div><div class="tool-field"><label for="colorRGB">RGB</label><input class="tool-input" id="colorRGB" value="rgb(36, 92, 136)" spellcheck="false"></div><div class="tool-field"><label for="colorHSL">HSL</label><input class="tool-input" id="colorHSL" value="hsl(205, 58%, 34%)" spellcheck="false"></div></div><div class="tool-separator"></div><div class="tool-field"><label>プレビュー</label><div class="tool-swatch" id="colorSwatch"></div></div><div class="tool-actions"><button class="tool-button secondary" id="colorCopyHex">HEXをコピー</button><button class="tool-button secondary" id="colorCopyRGB">RGBをコピー</button><button class="tool-button secondary" id="colorCopyHSL">HSLをコピー</button></div></section>`,
    `<section class="tool-panel"><h3>入力形式</h3><p>HEXは #RGB または #RRGGBB、RGBは rgb(r, g, b)、HSLは hsl(h, s%, l%) の形式に対応しています。</p></section>`);
  const picker = document.getElementById("colorPicker");
  const hex = document.getElementById("colorHex");
  const rgb = document.getElementById("colorRGB");
  const hsl = document.getElementById("colorHSL");
  let color = { r: 36, g: 92, b: 136 };
  function toHex(value) { return `#${[value.r, value.g, value.b].map(number => number.toString(16).padStart(2, "0")).join("")}`; }
  function toHSL({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (delta) {
      s = delta / (1 - Math.abs(2 * l - 1));
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
  }
  function render(source = "") {
    const h = toHSL(color);
    const hexValue = toHex(color);
    const rgbValue = `rgb(${color.r}, ${color.g}, ${color.b})`;
    const hslValue = `hsl(${Math.round(h.h)}, ${Math.round(h.s)}%, ${Math.round(h.l)}%)`;
    if (source !== "hex") hex.value = hexValue;
    if (source !== "rgb") rgb.value = rgbValue;
    if (source !== "hsl") hsl.value = hslValue;
    if (source !== "picker") picker.value = hexValue;
    document.getElementById("colorSwatch").style.background = hexValue;
  }
  function setFromHex(value) {
    let text = value.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(text)) text = text.split("").map(char => char + char).join("");
    if (!/^[0-9a-f]{6}$/i.test(text)) throw new Error("HEXは #RGB または #RRGGBB で入力してください。");
    color = { r: parseInt(text.slice(0, 2), 16), g: parseInt(text.slice(2, 4), 16), b: parseInt(text.slice(4, 6), 16) };
  }
  function setFromRGB(value) {
    const match = value.match(/^\s*rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:1(?:\.0+)?|0(?:\.\d+)?))?\s*\)\s*$/i);
    if (!match) throw new Error("RGBは rgb(36, 92, 136) の形式で入力してください。");
    const values = match.slice(1, 4).map(Number);
    if (values.some(value => value > 255)) throw new Error("RGBの各値は0～255で指定してください。");
    color = { r: values[0], g: values[1], b: values[2] };
  }
  function setFromHSL(value) {
    const match = value.match(/^\s*hsla?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%(?:\s*,\s*(?:1(?:\.0+)?|0(?:\.\d+)?))?\s*\)\s*$/i);
    if (!match) throw new Error("HSLは hsl(205, 58%, 34%) の形式で入力してください。");
    let [h, s, l] = match.slice(1, 4).map(Number);
    if (s > 100 || l > 100) throw new Error("彩度と明度は0～100%で指定してください。");
    h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
    const hue = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r = l, g = l, b = l;
    if (s) {
      const q = l < .5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue(p, q, h + 1 / 3); g = hue(p, q, h); b = hue(p, q, h - 1 / 3);
    }
    color = { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }
  function update(source, parser, value) {
    try { parser(value); render(source); setStatus("カラーコードを変換しました。", "success"); }
    catch (error) { setStatus(error.message, "error"); }
  }
  picker.addEventListener("input", () => update("picker", setFromHex, picker.value));
  hex.addEventListener("change", () => update("hex", setFromHex, hex.value));
  rgb.addEventListener("change", () => update("rgb", setFromRGB, rgb.value));
  hsl.addEventListener("change", () => update("hsl", setFromHSL, hsl.value));
  document.getElementById("colorCopyHex").addEventListener("click", () => copyText(hex.value));
  document.getElementById("colorCopyRGB").addEventListener("click", () => copyText(rgb.value));
  document.getElementById("colorCopyHSL").addEventListener("click", () => copyText(hsl.value));
  render();
}

function viewRegex() {
  mountTool(`
    <section class="tool-panel"><h2>正規表現の設定</h2><div class="tool-row"><div class="tool-field"><label for="regexPattern">パターン</label><input class="tool-input" id="regexPattern" placeholder="例: [A-Z][a-z]+" spellcheck="false"></div><div class="tool-field"><label for="regexFlags">フラグ</label><input class="tool-input" id="regexFlags" value="g" maxlength="6" spellcheck="false"></div></div><div class="tool-field" style="margin-top:12px"><label for="regexInput">テストする文字列</label><textarea class="tool-textarea" id="regexInput" placeholder="正規表現を試したい文章を入力してください"></textarea></div><div class="tool-row" style="margin-top:12px"><div class="tool-field"><label for="regexReplacement">置換後の文字列 <span class="field-hint">$1などのキャプチャ参照に対応</span></label><input class="tool-input" id="regexReplacement" placeholder="置換文字列"></div></div><div class="tool-actions"><button class="tool-button" id="regexRun">テストする</button><button class="tool-button secondary" id="regexCopy">置換結果をコピー</button></div><div id="regexSummary" class="tool-status"></div></section>
    <section class="tool-panel"><h2>一致した内容</h2><div id="regexMatches" class="tool-output empty">テスト結果がここに表示されます。</div><div class="tool-separator"></div><h2>置換結果</h2><div id="regexReplaced" class="tool-output empty">置換結果がここに表示されます。</div></section>`,
    `<section class="tool-panel"><h3>実行上限</h3><p>処理は別スレッドで実行し、一定時間を超えた場合は停止します。入力は最大100,000文字、表示する一致件数は最大100件です。</p></section><section class="tool-panel"><h3>フラグ</h3><p><strong>g</strong> 全体検索　<strong>i</strong> 大文字小文字を無視<br><strong>m</strong> 複数行　<strong>s</strong> . が改行に一致<br><strong>u</strong> Unicode　<strong>y</strong> sticky</p></section>`);
  let worker = null;
  let timeout = null;
  let latestReplaced = "";
  const run = document.getElementById("regexRun");
  function stopWorker() {
    if (worker) worker.terminate();
    worker = null;
    clearTimeout(timeout);
    run.disabled = false;
  }
  run.addEventListener("click", () => {
    stopWorker();
    const pattern = document.getElementById("regexPattern").value;
    const flags = document.getElementById("regexFlags").value;
    const text = document.getElementById("regexInput").value;
    const replacement = document.getElementById("regexReplacement").value;
    if (pattern.length > 500) { setStatus("パターンは500文字以内で入力してください。", "error"); return; }
    if (text.length > 100000) { setStatus("テスト文字列は100,000文字以内にしてください。", "error"); return; }
    if (/[^gimsuyd]/.test(flags) || new Set(flags).size !== flags.length) { setStatus("フラグは g, i, m, s, u, y, d を重複なく指定してください。", "error"); return; }
    try { new RegExp(pattern, flags); } catch (error) { setStatus(`正規表現エラー: ${error.message}`, "error"); return; }
    if (!window.Worker) { setStatus("このブラウザはWorkerに対応していません。", "error"); return; }
    run.disabled = true;
    setStatus("正規表現を確認しています…", "info", 0);
    try {
      worker = new Worker("regex-worker.js");
      worker.onmessage = event => {
        stopWorker();
        const result = event.data;
        if (result.error) { setStatus(result.error, "error"); return; }
        const summary = document.getElementById("regexSummary");
        summary.textContent = `${result.count}件一致${result.truncated ? "（表示上限100件）" : ""}`;
        summary.className = "tool-status success";
        const matches = document.getElementById("regexMatches");
        matches.classList.toggle("empty", result.matches.length === 0);
        matches.textContent = result.matches.length ? result.matches.map((item, index) => `${index + 1}. ${JSON.stringify(item.match)} 位置: ${item.index}${item.groups.length ? `  グループ: ${item.groups.map(group => JSON.stringify(group)).join(", ")}` : ""}`).join("\n") : "一致する箇所はありません。";
        const replaced = document.getElementById("regexReplaced");
        replaced.classList.toggle("empty", !result.replaced);
        replaced.textContent = result.replaced;
        latestReplaced = result.replaced;
        setStatus("テストが完了しました。", "success");
      };
      worker.onerror = () => { stopWorker(); setStatus("正規表現の実行中にエラーが発生しました。", "error"); };
      worker.postMessage({ pattern, flags, text, replacement });
      timeout = setTimeout(() => { stopWorker(); setStatus("処理時間の上限に達したため停止しました。パターンや入力を見直してください。", "error", 0); }, 700);
    } catch (error) { stopWorker(); setStatus(`Workerを起動できませんでした: ${error.message}`, "error"); }
  });
  document.getElementById("regexCopy").addEventListener("click", () => copyText(latestReplaced));
}

function viewHash() {
  mountTool(`
    <section class="tool-panel"><h2>ハッシュ化するテキスト</h2><textarea class="tool-textarea large" id="hashInput" placeholder="ハッシュ化したい文字列を入力してください"></textarea><div class="tool-row" style="margin-top:12px"><div class="tool-field"><label for="hashAlgorithm">アルゴリズム</label><select class="tool-select" id="hashAlgorithm"><option value="SHA-256">SHA-256</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option><option value="SHA-1">SHA-1（互換性用途）</option></select></div></div><div class="tool-actions"><button class="tool-button" id="hashGenerate">ハッシュを生成</button><button class="tool-button secondary" id="hashCopy">コピー</button></div></section>
    <section class="tool-panel"><h2>ハッシュ値</h2><div class="tool-output" id="hashOutput">ここにハッシュ値が表示されます。</div></section>`,
    `<section class="tool-panel"><h3>注意</h3><p>ハッシュは一方向の要約値であり、暗号化とは異なります。パスワード保存にはSHA-256などの単純なハッシュを使用せず、専用のパスワードハッシュ方式を使用してください。</p></section>`);
  let currentHash = "";
  document.getElementById("hashGenerate").addEventListener("click", async () => {
    const value = document.getElementById("hashInput").value;
    const algorithm = document.getElementById("hashAlgorithm").value;
    if (!window.crypto?.subtle) { setStatus("Web Crypto APIを利用できません。HTTPS接続で開いてください。", "error"); return; }
    try {
      const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value));
      currentHash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
      document.getElementById("hashOutput").textContent = currentHash;
      setStatus(`${algorithm}のハッシュを生成しました。`, "success");
    } catch (error) { setStatus(`生成できませんでした: ${error.message}`, "error"); }
  });
  document.getElementById("hashCopy").addEventListener("click", () => copyText(currentHash));
}

function viewGradient() {
  mountTool(`
    <section class="tool-panel"><h2>グラデーション設定</h2><div class="color-controls"><div class="tool-field"><label for="gradientStart">開始色</label><input class="tool-input" id="gradientStart" type="color" value="#245c88"></div><div class="tool-field"><label for="gradientEnd">終了色</label><input class="tool-input" id="gradientEnd" type="color" value="#d69b72"></div></div><div class="tool-field" style="margin-top:18px"><label for="gradientAngle">角度 <strong id="gradientAngleValue">90°</strong></label><input class="tool-input" id="gradientAngle" type="range" min="0" max="360" value="90"></div><div class="tool-field" style="margin-top:17px"><label>プレビュー</label><div class="gradient-preview" id="gradientPreview"></div></div><div class="tool-separator"></div><div class="tool-field"><label for="gradientCode">CSS</label><textarea class="tool-textarea" id="gradientCode" readonly style="min-height:76px"></textarea></div><div class="tool-actions"><button class="tool-button" id="gradientCopy">CSSをコピー</button><button class="tool-button secondary" id="gradientSwap">色を入れ替え</button></div></section>`,
    `<section class="tool-panel"><h3>利用方法</h3><p>生成したCSSをスタイルシートのbackgroundまたはbackground-imageへ設定してください。</p></section>`);
  const start = document.getElementById("gradientStart");
  const end = document.getElementById("gradientEnd");
  const angle = document.getElementById("gradientAngle");
  function update() {
    const value = `linear-gradient(${angle.value}deg, ${start.value}, ${end.value})`;
    document.getElementById("gradientPreview").style.background = value;
    document.getElementById("gradientCode").value = `background: ${value};`;
    document.getElementById("gradientAngleValue").textContent = `${angle.value}°`;
  }
  [start, end, angle].forEach(element => element.addEventListener("input", update));
  document.getElementById("gradientCopy").addEventListener("click", () => copyText(document.getElementById("gradientCode").value));
  document.getElementById("gradientSwap").addEventListener("click", () => { const value = start.value; start.value = end.value; end.value = value; update(); });
  update();
}

function viewBytes() {
  mountTool(`
    <section class="tool-panel"><h2>データ容量を換算</h2><div class="tool-row"><div class="tool-field"><label for="bytesValue">数値</label><input class="tool-input" id="bytesValue" type="number" min="0" step="any" value="1"></div><div class="tool-field"><label for="bytesUnit">単位</label><select class="tool-select" id="bytesUnit"><option value="0">B</option><option value="1">KB</option><option value="2">MB</option><option value="3">GB</option><option value="4">TB</option><option value="5">PB</option></select></div><div class="tool-field"><label for="bytesBase">換算方式</label><select class="tool-select" id="bytesBase"><option value="1024">1024単位（KiB基準）</option><option value="1000">1000単位（SI基準）</option></select></div></div><div class="tool-actions"><button class="tool-button" id="bytesConvert">換算する</button></div></section>
    <section class="tool-panel"><h2>換算結果</h2><div class="tool-table-wrap"><table class="tool-table"><tbody id="bytesResults"></tbody></table></div></section>`,
    `<section class="tool-panel"><h3>単位について</h3><p>1024単位はコンピューター上の容量表示でよく使われます。厳密にはKiB・MiB・GiBという表記が使われます。1000単位はSI接頭辞に基づきます。</p></section>`);
  function convert() {
    const value = Number(document.getElementById("bytesValue").value);
    const unit = Number(document.getElementById("bytesUnit").value);
    const base = Number(document.getElementById("bytesBase").value);
    if (!Number.isFinite(value) || value < 0) { setStatus("0以上の数値を入力してください。", "error"); return; }
    const bytes = value * Math.pow(base, unit);
    const names = ["B", base === 1024 ? "KiB" : "KB", base === 1024 ? "MiB" : "MB", base === 1024 ? "GiB" : "GB", base === 1024 ? "TiB" : "TB", base === 1024 ? "PiB" : "PB"];
    const rows = names.map((name, index) => [name, bytes / Math.pow(base, index)]);
    const body = document.getElementById("bytesResults");
    body.replaceChildren();
    rows.forEach(([name, amount]) => {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      const td = document.createElement("td");
      th.textContent = name;
      td.textContent = Number.isFinite(amount) ? amount.toLocaleString("ja-JP", { maximumFractionDigits: 8 }) : "範囲外";
      row.append(th, td);
      body.append(row);
    });
    setStatus("容量を換算しました。", "success");
  }
  document.getElementById("bytesConvert").addEventListener("click", convert);
  ["bytesValue", "bytesUnit", "bytesBase"].forEach(id => document.getElementById(id).addEventListener("change", convert));
  convert();
}

function viewRandom() {
  mountTool(`
    <section class="tool-panel"><h2>候補リスト</h2><textarea class="tool-textarea large" id="randomInput" placeholder="1行に1つずつ入力してください\n例:\nりんご\nみかん\nぶどう"></textarea><div class="tool-row" style="margin-top:12px"><div class="tool-field"><label for="randomCount">抽選する件数</label><input class="tool-input" id="randomCount" type="number" min="1" max="100" value="1"></div><div class="tool-field" style="justify-content:end"><label class="tool-check"><input type="checkbox" id="randomUnique" checked> 同じ候補を重複させない</label></div></div><div class="tool-actions"><button class="tool-button" id="randomPick">抽選する</button><button class="tool-button secondary" id="randomShuffle">全体をシャッフル</button><button class="tool-button secondary" id="randomCopy">結果をコピー</button></div></section>
    <section class="tool-panel"><h2>抽選結果</h2><div class="tool-output empty" id="randomOutput">候補を入力して抽選してください。</div></section>`,
    `<section class="tool-panel"><h3>抽選について</h3><p>空行は無視します。重複候補は入力どおり別々の候補として扱います。暗号学的乱数を使って候補を選びます。</p></section>`);
  let result = [];
  function getItems() { return document.getElementById("randomInput").value.split(/\r\n|\r|\n/).map(item => item.trim()).filter(Boolean); }
  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
      const target = secureRandomInt(index + 1);
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }
  function show(items) {
    result = items;
    const output = document.getElementById("randomOutput");
    output.textContent = items.length ? items.map((item, index) => `${index + 1}. ${item}`).join("\n") : "結果がありません。";
    output.classList.toggle("empty", !items.length);
  }
  document.getElementById("randomPick").addEventListener("click", () => {
    try {
      const items = getItems();
      const count = Number(document.getElementById("randomCount").value);
      const unique = document.getElementById("randomUnique").checked;
      if (!items.length) throw new Error("候補を1つ以上入力してください。");
      if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error("件数は1～100の整数で指定してください。");
      const available = unique ? [...new Set(items)] : items;
      if (count > available.length) throw new Error(`抽選できる最大件数は${available.length}件です。`);
      show(shuffle(available).slice(0, count));
      setStatus(`${count}件を抽選しました。`, "success");
    } catch (error) { setStatus(error.message, "error"); }
  });
  document.getElementById("randomShuffle").addEventListener("click", () => {
    const items = getItems();
    if (!items.length) { setStatus("候補を1つ以上入力してください。", "error"); return; }
    show(shuffle(items));
    setStatus("候補を並べ替えました。", "success");
  });
  document.getElementById("randomCopy").addEventListener("click", () => copyText(result.join("\n")));
}

const renderers = {
  uuid: viewUUID,
  password: viewPassword,
  text: viewText,
  json: viewJSON,
  base64: viewBase64,
  url: viewURL,
  timestamp: viewTimestamp,
  color: viewColor,
  regex: viewRegex,
  hash: viewHash,
  gradient: viewGradient,
  bytes: viewBytes,
  random: viewRandom
};

if (renderers[currentTool]) {
  renderers[currentTool]();
} else {
  root.innerHTML = `<section class="tool-panel"><h1>ツールが見つかりません</h1><p>指定されたツールは存在しないか、URLが正しくありません。</p><a class="tool-button" href="../">トップページへ戻る</a></section>`;
}
