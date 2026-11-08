const tools = [
  { id: "uuid", title: "UUID ジェネレーター", description: "UUID v1・v4・v7をまとめて生成。形式や個数も指定できます。", category: "development", categoryLabel: "開発", icon: "ID", path: "tools/?tool=uuid", keywords: "uuid guid v1 v4 v7 識別子" },
  { id: "password", title: "パスワード生成", description: "文字種や長さを指定して、安全なランダムパスワードを作成。", category: "security", categoryLabel: "セキュリティ", icon: "PW", path: "tools/?tool=password", keywords: "password パスワード ランダム セキュリティ" },
  { id: "text", title: "テキスト整形", description: "文字数の確認、改行整理、重複削除、並べ替え、大小文字変換。", category: "text", categoryLabel: "文章・変換", icon: "Aa", path: "tools/?tool=text", keywords: "text 文章 文字数 改行 整形 大文字 小文字" },
  { id: "json", title: "JSON 整形・検証", description: "JSONの構文チェック、整形表示、圧縮をまとめて実行。", category: "development", categoryLabel: "開発", icon: "{}", path: "tools/?tool=json", keywords: "json formatter minify validate 整形" },
  { id: "base64", title: "Base64 変換", description: "日本語を含むテキストをBase64へ変換・復元。URL用形式にも対応。", category: "data", categoryLabel: "データ", icon: "64", path: "tools/?tool=base64", keywords: "base64 encode decode エンコード デコード" },
  { id: "url", title: "URL エンコード", description: "URL文字列の変換と、URLの構成要素の確認に対応。", category: "data", categoryLabel: "データ", icon: "URL", path: "tools/?tool=url", keywords: "url uri encode decode query" },
  { id: "timestamp", title: "タイムスタンプ変換", description: "Unix時間と日時を相互変換。秒・ミリ秒の両方を扱えます。", category: "date", categoryLabel: "日時・数値", icon: "TIME", path: "tools/?tool=timestamp", keywords: "unix timestamp date time 日時" },
  { id: "color", title: "カラーコード変換", description: "HEX・RGB・HSLを相互変換。カラーピッカーで色を確認。", category: "design", categoryLabel: "デザイン", icon: "HEX", path: "tools/?tool=color", keywords: "color hex rgb hsl 色" },
  { id: "regex", title: "正規表現テスター", description: "正規表現の一致箇所と置換結果を確認。実行時間に上限を設定。", category: "development", categoryLabel: "開発", icon: ".*", path: "tools/?tool=regex", keywords: "regex regexp 正規表現 match replace" },
  { id: "hash", title: "ハッシュ生成", description: "SHA-1・SHA-256・SHA-384・SHA-512のハッシュ値を生成。", category: "security", categoryLabel: "セキュリティ", icon: "#", path: "tools/?tool=hash", keywords: "hash sha1 sha256 sha384 sha512 ハッシュ" },
  { id: "gradient", title: "CSS グラデーション", description: "色と角度を調整して、CSSのlinear-gradientを作成。", category: "design", categoryLabel: "デザイン", icon: "CSS", path: "tools/?tool=gradient", keywords: "css gradient linear gradient グラデーション" },
  { id: "bytes", title: "データ容量変換", description: "B・KB・MB・GB・TBを相互換算。SI・2進数単位を切り替え。", category: "date", categoryLabel: "日時・数値", icon: "MB", path: "tools/?tool=bytes", keywords: "byte bytes kb mb gb tb 容量" },
  { id: "random", title: "ランダム抽選・並べ替え", description: "候補から1つを抽選したり、リスト全体をランダムに並べ替え。", category: "text", categoryLabel: "文章・変換", icon: "RND", path: "tools/?tool=random", keywords: "random 抽選 シャッフル くじ" },
  { id: "ai-checker", title: "文章・コードの特徴分析", description: "文章やコードの文体・反復・構造の傾向を確認する参考ツール。", category: "text", categoryLabel: "文章・変換", icon: "TXT", path: "ai-checker/", keywords: "ai checker 文章 判定 コード 分析" }
];

const grid = document.getElementById("toolGrid");
const search = document.getElementById("toolSearch");
const filters = document.getElementById("filters");
const resultCount = document.getElementById("resultCount");
const count = document.getElementById("toolCount");
let activeCategory = "all";
let favorites = readFavorites();

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem("utility-favorites") || "[]");
    return new Set(Array.isArray(value) ? value.filter(item => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try { localStorage.setItem("utility-favorites", JSON.stringify([...favorites])); } catch {}
}

function renderTools() {
  const query = search.value.trim().toLocaleLowerCase("ja");
  const visible = tools.filter(tool => {
    const categoryMatch = activeCategory === "all" || (activeCategory === "favorite" ? favorites.has(tool.id) : tool.category === activeCategory);
    const searchText = `${tool.title} ${tool.description} ${tool.categoryLabel} ${tool.keywords}`.toLocaleLowerCase("ja");
    return categoryMatch && (!query || searchText.includes(query));
  });

  grid.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = activeCategory === "favorite" && !query ? "お気に入りに登録したツールはありません。カード右上の ☆ を押すと登録できます。" : "該当するツールがありません。検索語を変えてください。";
    grid.append(empty);
  } else {
    visible.forEach(tool => {
      const card = document.createElement("article");
      card.className = "tool-card";
      const link = document.createElement("a");
      link.href = tool.path;
      link.setAttribute("aria-label", `${tool.title}を開く`);
      link.style.display = "flex";
      link.style.flexDirection = "column";
      link.style.flex = "1";
      const top = document.createElement("div");
      top.className = "tool-card-top";
      const icon = document.createElement("span");
      icon.className = "tool-icon";
      icon.textContent = tool.icon;
      const title = document.createElement("h3");
      title.textContent = tool.title;
      const description = document.createElement("p");
      description.textContent = tool.description;
      const meta = document.createElement("div");
      meta.className = "tool-card-meta";
      const category = document.createElement("span");
      category.textContent = tool.categoryLabel;
      const arrow = document.createElement("span");
      arrow.className = "tool-card-arrow";
      arrow.textContent = "→";
      top.append(icon);
      meta.append(category, arrow);
      link.append(top, title, description, meta);
      const favorite = document.createElement("button");
      favorite.className = "favorite-button";
      favorite.type = "button";
      favorite.textContent = favorites.has(tool.id) ? "★" : "☆";
      favorite.setAttribute("aria-label", favorites.has(tool.id) ? "お気に入りを解除" : "お気に入りに登録");
      favorite.setAttribute("aria-pressed", String(favorites.has(tool.id)));
      favorite.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (favorites.has(tool.id)) favorites.delete(tool.id);
        else favorites.add(tool.id);
        saveFavorites();
        renderTools();
      });
      card.append(link, favorite);
      grid.append(card);
    });
  }
  resultCount.textContent = `${visible.length} 件表示`;
  count.textContent = tools.length;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("utility-theme", theme); } catch {}
  document.getElementById("themeToggle").textContent = theme === "dark" ? "ライト表示" : "ダーク表示";
}

let savedTheme = "light";
try { savedTheme = localStorage.getItem("utility-theme") === "dark" ? "dark" : "light"; } catch {}
setTheme(savedTheme);
document.getElementById("themeToggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
search.addEventListener("input", renderTools);
filters.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  filters.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
  renderTools();
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === "Escape" && document.activeElement === search) {
    search.value = "";
    renderTools();
    search.blur();
  }
});
renderTools();
