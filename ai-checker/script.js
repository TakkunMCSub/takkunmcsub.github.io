function readSavedTheme(){
  try {
    const theme = localStorage.getItem("utility-theme");
    return theme === "dark" || theme === "light" ? theme : "light";
  } catch {
    return "light";
  }
}

const state = {
  mode: "auto",
  theme: readSavedTheme()
};

const els = {
  input: document.getElementById("input"),
  scoreNum: document.getElementById("scoreNum"),
  scoreTrack: document.getElementById("scoreTrack"),
  verdictTitle: document.getElementById("verdictTitle"),
  verdictText: document.getElementById("verdictText"),
  summaryChips: document.getElementById("summaryChips"),
  stats: document.getElementById("stats"),
  signals: document.getElementById("signals"),
  tips: document.getElementById("tips"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  sampleTextBtn: document.getElementById("sampleTextBtn"),
  sampleCodeBtn: document.getElementById("sampleCodeBtn"),
  fileInput: document.getElementById("fileInput"),
  dropZone: document.getElementById("dropZone"),
  languageHint: document.getElementById("languageHint"),
  tabs: [...document.querySelectorAll(".tab")],
  themeToggle: document.getElementById("themeToggle"),
  themeText: document.getElementById("themeText")
};

const textSample = `先週、駅前に新しい店ができたので立ち寄ってみました。
店内は思ったより落ち着いていて、待ち時間も短かったです。
次は別のメニューも試してみようと思います。`;

const codeSample = `function analyzeText(input) {
  const lines = input.split("\\n");
  const cleaned = lines.map(line => line.trim());
  const result = cleaned.filter(Boolean).length;
  return {
    lines: lines.length,
    meaningfulLines: result,
    score: result / Math.max(lines.length, 1)
  };
}

console.log(analyzeText("hello"));`;

const stopWords = new Set([
  "そして","しかし","また","さらに","つまり","そのため","一方で","例えば","たとえば",
  "therefore","however","moreover","because","also","then","thus","for","the","and","or","but","to","of","in","on","with","as","is","are"
]);

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function pct(n){ return `${Math.round(n)}%`; }
function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function stdev(arr){
  if(arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}
function uniqueRatio(arr){
  return arr.length ? new Set(arr).size / arr.length : 0;
}
function entropy(tokens){
  if(!tokens.length) return 0;
  const map = new Map();
  tokens.forEach(t => map.set(t, (map.get(t) || 0) + 1));
  let h = 0;
  for(const count of map.values()){
    const p = count / tokens.length;
    h -= p * Math.log2(p);
  }
  return h;
}
function ngrams(tokens, n){
  const out = [];
  for(let i = 0; i <= tokens.length - n; i++){
    out.push(tokens.slice(i, i + n).join(" "));
  }
  return out;
}
function normalizeText(s){
  return s.replace(/\r\n/g, "\n").replace(/\u3000/g, " ").trim();
}
function splitSentences(text){
  const parts = text
    .split(/(?<=[。！？!?\.])\s*|\n+/g)
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [text.trim()].filter(Boolean);
}
function tokenizeText(text, langHint){
  if (window.Intl && Intl.Segmenter && langHint !== "mixed") {
    try{
      const hasJapanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text);
      const language = langHint === "ja" ? "ja" : langHint === "en" ? "en" : hasJapanese ? "ja" : "en";
      const segmenter = new Intl.Segmenter(language, { granularity: "word" });
      return Array.from(segmenter.segment(text))
        .filter(x => x.isWordLike)
        .map(x => x.segment.trim())
        .filter(Boolean);
    }catch(e){}
  }
  const words = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+|[A-Za-z0-9_]+/gu);
  return words ? words.filter(Boolean) : [];
}
function detectModeAuto(text){
  const codeSignals = [
    /[{}[\];]/.test(text),
    /\b(function|const|let|var|class|import|export|return|if|else|for|while|def|print|console|public|private|static|async|await)\b/.test(text),
    /\n\s{2,}\S/.test(text),
    /=>|==|===|!=|<=|>=|&&|\|\|/.test(text)
  ].filter(Boolean).length;

  return codeSignals >= 2 ? "code" : "text";
}

function verdictFromScore(score, chattyScore = 0){
  if(score >= 78) return {
    title: "規則的な特徴が多く見られます",
    text: "文体の均一さ、反復、定型的な表現が比較的多く見られます。"
  };
  if(score >= 55) return {
    title: "複数の特徴が混在しています",
    text: "規則的な部分と、ばらつきのある部分の両方が見られます。"
  };
  if(chattyScore >= 68) return {
    title: "会話・投稿文の傾向があります",
    text: "短文や箇条書き、強い言い回しが比較的多く見られます。"
  };
  return {
    title: "文体にばらつきがあります",
    text: "文章の長さや表現に変化があり、規則性は比較的強くありません。"
  };
}

function scoreChattyStyle(text){
  const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
  const norm = normalizeText(text);

  const openerPatterns = [
    /結論から(言う|いう)(と|ね)?/g,
    /先に結論/g,
    /ズバリ/g,
    /端的に言うと/g,
    /一言でいうと/g,
    /まず結論/g
  ];
  const certaintyPatterns = [
    /めっちゃ/g, /かなり/g, /絶対/g, /実は/g, /ありえない/g, /おかしい/g,
    /〜じゃない[？?]/g, /なんて/g, /だから/g, /つまり/g, /のような/g
  ];
  const contrastPatterns = [
    /❌|⭕️|→|⇒|=>/g,
    /A判定|B判定|合格|不合格|ミス|補欠/g,
    /〜ではなく/g,
    /〜なのに/g
  ];
  const emojiCount = (norm.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  const bullets = (text.match(/^\s*(?:[•\-*]|☑️|👉|▶|◆|・)\s+/gm) || []).length;
  const exclaim = (norm.match(/[！!]/g) || []).length;
  const question = (norm.match(/[？?]/g) || []).length;
  const assertion = (norm.match(/(〜|～).*(❌|⭕️|→|だから|実は|結論)/g) || []).length;
  const lineLead = lines.filter(l => /^(結論|理由|だから|まず|次に|最後に|補足|要するに|つまり|👉|☑️|•|・)/.test(l)).length;

  const opener = openerPatterns.reduce((n, re) => n + (norm.match(re) || []).length, 0);
  const certainty = certaintyPatterns.reduce((n, re) => n + (norm.match(re) || []).length, 0);
  const contrast = contrastPatterns.reduce((n, re) => n + (norm.match(re) || []).length, 0);

  const sentenceCount = splitSentences(norm).length || 1;
  const shortSentenceRate = splitSentences(norm).filter(s => s.length <= 24).length / sentenceCount;
  const bulletDensity = bullets / Math.max(lines.length, 1);

  const score = clamp(
    10 +
    opener * 18 +
    certainty * 4 +
    contrast * 12 +
    bulletDensity * 30 +
    emojiCount * 6 +
    exclaim * 1.8 +
    question * 1.2 +
    lineLead * 7 +
    shortSentenceRate * 12 +
    assertion * 10,
    0,
    100
  );

  const signals = [
    {label:"結論先出し", value:pct(clamp(opener * 18, 0, 100)), detail:"「結論から言うと」系の強さ", type: opener >= 1 ? "bad" : "good"},
    {label:"箇条書き密度", value:pct(clamp(bulletDensity * 100, 0, 100)), detail:"SNS・投稿文っぽさの強い要素", type: bullets >= 2 ? "bad" : bullets >= 1 ? "warn" : "good"},
    {label:"感情・断定語", value:pct(clamp(certainty * 6, 0, 100)), detail:"「めっちゃ」「ありえない」「おかしい」など", type: certainty >= 3 ? "bad" : certainty >= 1 ? "warn" : "good"},
    {label:"対比の強さ", value:pct(clamp(contrast * 10, 0, 100)), detail:"「A→B」「❌/⭕️」のような押し出し", type: contrast >= 2 ? "bad" : contrast >= 1 ? "warn" : "good"},
    {label:"短文率", value:pct(shortSentenceRate * 100), detail:"短い文の連打は会話調・投稿調に寄りやすい", type: shortSentenceRate > 0.7 ? "warn" : "good"},
  ];

  return {
    score,
    signals,
    chips: [
      score >= 70 ? {text:"投稿文の特徴 強め", cls:"bad"} :
      score >= 40 ? {text:"投稿文の特徴 中程度", cls:"warn"} :
      {text:"投稿文の特徴 弱め", cls:"good"}
    ],
    tips: [
      opener >= 1 ? "冒頭の「結論から言うと」を少し弱めると、押しの強さが下がります。" : null,
      bullets >= 2 ? "箇条書きを減らして、文章でつなぐと自然さが増します。" : null,
      certainty >= 3 ? "断定語を少し減らすと、宣言っぽさが弱まります。" : null,
      contrast >= 2 ? "❌/⭕️ や A→B の対比を減らすと、投稿文感が下がります。" : null,
      "必要なら、事実→理由→補足の順に整えると安定します。"
    ].filter(Boolean)
  };
}

function analyzeText(text, langHint){
  const norm = normalizeText(text);
  const sentences = splitSentences(norm);
  const tokens = tokenizeText(norm, langHint);
  const wordsLower = tokens.map(w => w.toLowerCase());

  const sentenceLens = sentences.map(s => s.length);
  const avgSentence = mean(sentenceLens);
  const sentenceVar = stdev(sentenceLens);
  const sentenceUniformity = sentenceLens.length ? 1 - clamp(sentenceVar / Math.max(avgSentence || 1, 1), 0, 1) : 0;

  const uniq = uniqueRatio(wordsLower);
  const ent = entropy(wordsLower);
  const repeat2 = ngrams(wordsLower, 2);
  const repeat3 = ngrams(wordsLower, 3);
  const repeat4 = ngrams(wordsLower, 4);
  const rep2 = repeat2.length ? 1 - new Set(repeat2).size / repeat2.length : 0;
  const rep3 = repeat3.length ? 1 - new Set(repeat3).size / repeat3.length : 0;
  const rep4 = repeat4.length ? 1 - new Set(repeat4).size / repeat4.length : 0;

  const sentenceNgrams = sentences.map(s => s.trim());
  const repeatedSent = sentenceNgrams.length ? 1 - new Set(sentenceNgrams).size / sentenceNgrams.length : 0;

  const punctuationCount = (norm.match(/[。！？!?.,:;、]/g) || []).length;
  const punctuationDensity = norm.length ? punctuationCount / norm.length : 0;

  const stopCount = wordsLower.filter(w => stopWords.has(w)).length;
  const stopDensity = wordsLower.length ? stopCount / wordsLower.length : 0;

  const paragraphPieces = norm.split(/\n{2,}/).filter(Boolean);
  const paragraphCount = paragraphPieces.length || (norm ? 1 : 0);
  const paragraphUniformity = paragraphCount > 1
    ? clamp(1 - stdev(paragraphPieces.map(p => p.length)) / Math.max(mean(paragraphPieces.map(p => p.length)) || 1,1), 0, 1)
    : 0;

  const shortSentRatio = sentences.length
    ? sentences.filter(s => s.length <= 18).length / sentences.length
    : 0;

  const transitionCount = (norm.match(/(つまり|そのため|一方で|しかし|さらに|なお|例えば|まず|次に|最後に|therefore|however|moreover|for example)/gi) || []).length;
  const transitionDensity = wordsLower.length ? transitionCount / wordsLower.length : 0;

  const rhetoricalMarkers = (norm.match(/(〜|～).*(と思う|感じる|かも|っぽい|です|ます)/g) || []).length;
  const assertiveMarkers = (norm.match(/(絶対|明らか|確実|間違いない|ありえない|おかしい|実は|結局)/g) || []).length;

  const chatty = scoreChattyStyle(text);
  const chattyScore = chatty.score;

  const aiBase = clamp(
    12 +
    sentenceUniformity * 18 +
    rep3 * 14 +
    rep4 * 10 +
    repeatedSent * 10 +
    clamp((0.52 - uniq) * 65, 0, 16) +
    clamp((4.6 - ent) * 9, 0, 10) +
    clamp((stopDensity - 0.09) * 55, 0, 8) +
    paragraphUniformity * 4 +
    clamp((shortSentRatio - 0.35) * 18, 0, 8) +
    clamp(transitionDensity * 120, 0, 6) +
    clamp((rep2 - 0.08) * 30, 0, 6) +
    clamp(assertiveMarkers * 2.5, 0, 6) -
    clamp(chattyScore * 0.06, 0, 5),
    0,
    100
  );

  const finalScore = clamp(
    aiBase * 0.72 + chattyScore * 0.28,
    0,
    100
  );

  const signals = [
    {label:"文の長さの均一さ", value:pct(sentenceUniformity * 100), detail:"文の長さが一定に近い場合に上がる", type: sentenceUniformity > 0.65 ? "bad" : sentenceUniformity > 0.4 ? "warn" : "good"},
    {label:"2語連続の反復", value:pct(rep2 * 100), detail:"定型表現の連続を確認", type: rep2 > 0.18 ? "bad" : rep2 > 0.09 ? "warn" : "good"},
    {label:"3語連続の反復", value:pct(rep3 * 100), detail:"同じ言い回しが続くと上昇", type: rep3 > 0.16 ? "bad" : rep3 > 0.08 ? "warn" : "good"},
    {label:"文の重複", value:pct(repeatedSent * 100), detail:"似た文が繰り返される割合", type: repeatedSent > 0.12 ? "bad" : repeatedSent > 0.05 ? "warn" : "good"},
    {label:"語彙の多様性", value:pct(uniq * 100), detail:"高いほど単語の偏りが少ない", type: uniq < 0.38 ? "bad" : uniq < 0.5 ? "warn" : "good"},
    {label:"情報密度(エントロピー)", value:ent.toFixed(2), detail:"低いほど表現の種類が少ない", type: ent < 3.6 ? "bad" : ent < 4.4 ? "warn" : "good"},
    {label:"投稿文の特徴", value:pct(chattyScore), detail:"結論先出し・箇条書き・断定の押し出しを別判定", type: chattyScore >= 70 ? "bad" : chattyScore >= 40 ? "warn" : "good"},
  ];

  const tips = [];
  if(sentenceUniformity > 0.6) tips.push("文の長さを少しバラけさせると、機械的な印象が弱まります。");
  if(rep3 > 0.08 || rep4 > 0.05) tips.push("同じ接続表現や言い回しを減らすと、反復感が下がります。");
  if(uniq < 0.45) tips.push("同義語や具体例を増やして、語彙の偏りを減らしてください。");
  if(repeatedSent > 0.05) tips.push("似た内容の文を統合すると、冗長さが減ります。");
  if(transitionDensity > 0.02) tips.push("接続詞が多い場合は、つなぎを少し減らすと自然になります。");
  if(rhetoricalMarkers > 0 && assertiveMarkers > 1) tips.push("丁寧語と断定語が混ざると不自然に見えるので、語調を揃えると安定します。");
  if(chattyScore >= 40) tips.push("「結論→理由→補足」に整えつつ、箇条書きを減らすと投稿文のような押し出しが弱まります。");

  if(tips.length === 0) tips.push("自然な揺れは十分あります。必要なら、もっと個性的な語尾や具体的な体験を加えると変化が出ます。");

  const chips = [
    finalScore >= 70 ? {text:"規則性が高め", cls:"bad"} :
    finalScore >= 45 ? {text:"特徴が混在", cls:"warn"} :
    {text:"ばらつきが多め", cls:"good"},
    chattyScore >= 60 ? {text:"会話調の特徴あり", cls:"warn"} : {text:"会話調の特徴は少なめ", cls:"good"},
    {text:`文章数 ${sentences.length}`, cls:""},
    {text:`単語数 ${wordsLower.length}`, cls:""},
  ];

  return {
    score: finalScore,
    verdict: verdictFromScore(finalScore, chattyScore),
    stats: [
      ["文体の規則性", `${aiBase.toFixed(1)} / 100`],
      ["投稿文の特徴", `${chattyScore.toFixed(1)} / 100`],
      ["平均文長", `${avgSentence.toFixed(1)} 文字`],
      ["文長のばらつき", sentenceVar.toFixed(1)],
      ["語彙多様性", pct(uniq * 100)],
      ["3語反復率", pct(rep3 * 100)],
      ["文重複率", pct(repeatedSent * 100)],
      ["文字数", `${norm.length} 文字`],
    ],
    signals,
    tips,
    chips
  };
}

function normalizeCodeLine(line){
  return line
    .replace(/\/\/.*$/g, "")
    .replace(/#.*$/g, "")
    .replace(/\/\*.*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, "ID");
}

function analyzeCode(text){
  const norm = text.replace(/\r\n/g,"\n");
  const lines = norm.split("\n");
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  const lengths = nonEmpty.map(l => l.length);
  const indents = nonEmpty.map(l => (l.match(/^\s*/)?.[0].length || 0));

  const comments = (norm.match(/(^|\n)\s*(\/\/|#|\/\*|\*|<!--)/g) || []).length;
  const commentDensity = nonEmpty.length ? comments / nonEmpty.length : 0;

  const keywords = (norm.match(/\b(function|const|let|var|class|return|if|else|for|while|try|catch|import|export|public|private|static|async|await|new|def|print|echo|switch|case|throw|yield)\b/g) || []).length;
  const braces = (norm.match(/[{}()[\]]/g) || []).length;
  const operators = (norm.match(/=>|==|===|!=|<=|>=|&&|\|\||[+\-*/%=]/g) || []).length;

  const normalizedLines = nonEmpty.map(normalizeCodeLine);
  const duplicateLineRatio = normalizedLines.length ? 1 - new Set(normalizedLines).size / normalizedLines.length : 0;
  const lineUniformity = lengths.length ? clamp(1 - stdev(lengths) / Math.max(mean(lengths), 1), 0, 1) : 0;
  const indentUniformity = indents.length ? clamp(1 - stdev(indents) / Math.max(mean(indents) + 1, 1), 0, 1) : 0;
  const keywordDensity = norm.length ? keywords / Math.max(norm.length / 20, 1) : 0;
  const braceDensity = norm.length ? braces / norm.length : 0;
  const operatorDensity = norm.length ? operators / norm.length : 0;

  const longComment = (norm.match(/(TODO|example|sample|helper|utility|optimize|improve|best practice|AI|generated)/gi) || []).length;
  const genericNaming = (norm.match(/\b(data|result|value|item|temp|tmp|obj|arr|list|helper|utils|manager|handler)\b/gi) || []).length;
  const genericRatio = nonEmpty.length ? (longComment + genericNaming) / nonEmpty.length : 0;

  const functionCount = (norm.match(/\b(function|def|class|=>)\b/g) || []).length;
  const avgLength = mean(lengths);
  const deepNestingSignals = (norm.match(/[{}]/g) || []).length > 0 ? Math.min(1, braces / Math.max(nonEmpty.length * 2, 1)) : 0;

  const score = clamp(
    16 +
    lineUniformity * 14 +
    indentUniformity * 10 +
    duplicateLineRatio * 20 +
    clamp(commentDensity - 0.10, 0, 0.25) * 110 +
    clamp(genericRatio, 0, 0.40) * 60 +
    clamp((operatorDensity + braceDensity) * 38, 0, 12) +
    clamp((0.28 - avgLength / 220) * 10, 0, 6) +
    clamp(functionCount / Math.max(nonEmpty.length / 8, 1), 0, 6) +
    clamp(deepNestingSignals * 8, 0, 6),
    0,
    100
  );

  const signals = [
    {label:"行長の均一さ", value:pct(lineUniformity * 100), detail:"行の長さが一定に近い場合に上昇", type: lineUniformity > 0.65 ? "bad" : lineUniformity > 0.4 ? "warn" : "good"},
    {label:"重複行率", value:pct(duplicateLineRatio * 100), detail:"同じ構造が多いと上昇", type: duplicateLineRatio > 0.12 ? "bad" : duplicateLineRatio > 0.05 ? "warn" : "good"},
    {label:"コメント密度", value:pct(commentDensity * 100), detail:"コメントが多い場合に上昇", type: commentDensity > 0.18 ? "bad" : commentDensity > 0.08 ? "warn" : "good"},
    {label:"命名の汎用性", value:pct(clamp(genericRatio * 100, 0, 100)), detail:"result / data / tmp などが多いと上昇", type: genericRatio > 0.10 ? "bad" : genericRatio > 0.04 ? "warn" : "good"},
    {label:"キーワード密度", value:keywordDensity.toFixed(2), detail:"構文の偏りチェック", type: keywordDensity > 0.12 ? "warn" : "good"},
  ];

  const tips = [];
  if(lineUniformity > 0.6) tips.push("処理を小さな関数に分け、行のリズムを少し変えると自然になります。");
  if(duplicateLineRatio > 0.08) tips.push("重複した処理は共通関数へまとめると、見た目もロジックもすっきりします。");
  if(commentDensity > 0.12) tips.push("コメントは要点だけに絞ると、説明が重複しないよう整理できます。");
  if(genericRatio > 0.08) tips.push("変数名を用途が伝わるものに変えると、汎用的な印象が弱まります。");
  if(avgLength < 32 && nonEmpty.length > 12) tips.push("短い行が続く場合は、数行をまとめると文脈に自然な流れが出ます。");
  if(tips.length === 0) tips.push("構造はかなり自然です。必要なら、命名・コメント・関数分割を少しだけ手で整えるとさらに良くなります。");

  const chips = [
    score >= 70 ? {text:"規則性が高め", cls:"bad"} : score >= 45 ? {text:"要確認", cls:"warn"} : {text:"ばらつきが多め", cls:"good"},
    {text:`行数 ${lines.length}`, cls:""},
    {text:`有効行 ${nonEmpty.length}`, cls:""},
  ];

  return {
    score,
    verdict: verdictFromScore(score),
    stats: [
      ["平均行長", `${avgLength.toFixed(1)} 文字`],
      ["行長のばらつき", stdev(lengths).toFixed(1)],
      ["重複行率", pct(duplicateLineRatio * 100)],
      ["コメント密度", pct(commentDensity * 100)],
      ["命名の汎用性", pct(clamp(genericRatio * 100, 0, 100))],
      ["文字数", `${norm.length} 文字`],
    ],
    signals,
    tips,
    chips
  };
}

function render(result){
  const score = Math.round(result.score);
  els.scoreNum.textContent = score;
  els.scoreTrack.style.width = `${score}%`;

  els.verdictTitle.textContent = result.verdict.title;
  els.verdictText.textContent = result.verdict.text;

  els.summaryChips.innerHTML = result.chips.map(c => `<span class="chip ${c.cls || ""}">${c.text}</span>`).join("");

  els.stats.innerHTML = result.stats.map(([k,v]) => `
    <div class="stat">
      <div class="k">${k}</div>
      <div class="v">${v}</div>
    </div>
  `).join("");

  els.signals.innerHTML = result.signals.map(item => `
    <li>
      <div>
        <strong>${item.label}</strong><br>
        <small>${item.detail}</small>
      </div>
      <span class="chip ${item.type}">${item.value}</span>
    </li>
  `).join("");

  els.tips.innerHTML = result.tips.map(t => `<li><div>${t}</div></li>`).join("");
}

function analyze(){
  const text = els.input.value || "";
  if(text.length > 500000){
    els.verdictTitle.textContent = "入力が長すぎます";
    els.verdictText.textContent = "500,000文字以内にしてください。";
    return;
  }
  if(!text.trim()){
    els.verdictTitle.textContent = "入力してください";
    els.verdictText.textContent = "文章かコードを貼り付けてから分析してください。";
    els.scoreNum.textContent = "–";
    els.scoreTrack.style.width = "0%";
    els.summaryChips.innerHTML = "";
    els.stats.innerHTML = "";
    els.signals.innerHTML = "";
    els.tips.innerHTML = "";
    return;
  }

  const mode = state.mode === "auto" ? detectModeAuto(text) : state.mode;
  const langHint = els.languageHint.value;
  const result = mode === "code" ? analyzeCode(text) : analyzeText(text, langHint);
  render(result);
}

function setMode(mode){
  state.mode = mode;
  els.tabs.forEach(t => t.classList.toggle("active", t.dataset.mode === mode));
}

function setTheme(theme){
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem("utility-theme", theme); } catch {}
  const isDark = theme === "dark";
  els.themeText.textContent = isDark ? "ライト表示" : "ダーク表示";
}

function toggleTheme(){
  setTheme(state.theme === "dark" ? "light" : "dark");
}

els.tabs.forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
els.analyzeBtn.addEventListener("click", analyze);
els.sampleTextBtn.addEventListener("click", () => { els.input.value = textSample; setMode("text"); analyze(); });
els.sampleCodeBtn.addEventListener("click", () => { els.input.value = codeSample; setMode("code"); analyze(); });
els.themeToggle.addEventListener("click", toggleTheme);

els.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if(!file) return;
  if(file.size > 1024 * 1024){
    els.verdictTitle.textContent = "ファイルが大きすぎます";
    els.verdictText.textContent = "1MB以下のファイルを選択してください。";
    e.target.value = "";
    return;
  }
  try {
    const text = await file.text();
    els.input.value = text;
    analyze();
  } catch {
    els.verdictTitle.textContent = "読み込みに失敗しました";
    els.verdictText.textContent = "テキストファイルを選択してください。";
  }
});

["dragenter","dragover"].forEach(evt => {
  els.dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    els.dropZone.classList.add("dragover");
  });
});
["dragleave","drop"].forEach(evt => {
  els.dropZone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    els.dropZone.classList.remove("dragover");
  });
});

els.dropZone.addEventListener("drop", async (e) => {
  const file = e.dataTransfer.files?.[0];
  if(!file) return;
  if(file.size > 1024 * 1024){
    els.verdictTitle.textContent = "ファイルが大きすぎます";
    els.verdictText.textContent = "1MB以下のファイルを選択してください。";
    return;
  }
  try {
    const text = await file.text();
    els.input.value = text;
    analyze();
  } catch {
    els.verdictTitle.textContent = "読み込みに失敗しました";
    els.verdictText.textContent = "テキストファイルを選択してください。";
  }
});

els.input.addEventListener("keydown", (e) => {
  if((e.ctrlKey || e.metaKey) && e.key === "Enter"){
    analyze();
  }
});

setTheme(state.theme);

setMode("auto");
