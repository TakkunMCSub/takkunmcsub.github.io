document.getElementById("checkBtn").addEventListener("click", () => {
  const url = document.getElementById("urlInput").value.trim();
  const resultBox = document.getElementById("result");

  if (!url) {
    resultBox.textContent = "⚠️ URLを入力してください";
    return;
  }

  // 簡易チェック: httpsかどうか
  if (!url.startsWith("https://")) {
    resultBox.textContent = "❌ 安全ではない可能性があります (HTTPS未使用)";
    return;
  }

  // ドメインの怪しさチェック (例: 数字や不自然な文字列)
  const domain = url.replace("https://", "").split("/")[0];
  if (/\d{3,}/.test(domain)) {
    resultBox.textContent = "⚠️ ドメインに不自然な数字が含まれています";
    return;
  }

  // 仮の安全判定
  resultBox.textContent = "✅ 安全な可能性が高い (HTTPS使用)";
});
