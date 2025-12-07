// 翻訳APIを利用する例 (LibreTranslateなど)
// 実際に使う場合はAPIキーやエンドポイントを設定してください
async function translateText(text, targetLang) {
  const response = await fetch("https://libretranslate.de/translate", {
    method: "POST",
    body: JSON.stringify({
      q: text,
      source: "auto",
      target: targetLang,
      format: "text"
    }),
    headers: { "Content-Type": "application/json" }
  });

  const data = await response.json();
  return data.translatedText;
}

document.getElementById("translateBtn").addEventListener("click", async () => {
  const text = document.getElementById("inputText").value.trim();
  const targetLang = document.getElementById("targetLang").value;
  const resultBox = document.getElementById("result");

  if (!text) {
    resultBox.textContent = "⚠️ 翻訳するテキストを入力してください";
    return;
  }

  resultBox.textContent = "🔍 翻訳中...";

  try {
    const translated = await translateText(text, targetLang);
    resultBox.textContent = translated;
  } catch (error) {
    resultBox.textContent = "⚠️ 翻訳中にエラーが発生しました";
    console.error(error);
  }
});
