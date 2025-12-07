// Google Safe Browsing APIキーを取得して置き換えてください
const API_KEY = "AIzaSyDCy4lK9WSbTViwvsnrxDMeQaQoL2_r7eU";

async function checkSafety(url) {
  // HTTPSチェック
  if (!url.startsWith("https://")) {
    return { safe: false, reason: "HTTPS未使用" };
  }

  // ドメイン簡易チェック
  const domain = url.replace("https://", "").split("/")[0];
  if (/\d{3,}/.test(domain)) {
    return { safe: false, reason: "ドメインに不自然な数字が含まれています" };
  }

  // Google Safe Browsing API呼び出し
  const requestBody = {
    client: { clientId: "utility-portal", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }]
    }
  };

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" }
      }
    );

    const data = await response.json();
    if (data.matches && data.matches.length > 0) {
      return { safe: false, reason: "Google Safe Browsingで危険判定" };
    }
    return { safe: true, reason: "Google Safe Browsingで問題なし" };
  } catch (error) {
    console.error(error);
    return { safe: false, reason: "APIチェック中にエラー発生" };
  }
}

document.getElementById("checkBtn").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value.trim();
  const resultBox = document.getElementById("result");

  if (!url) {
    resultBox.textContent = "⚠️ URLを入力してください";
    return;
  }

  resultBox.textContent = "🔍 チェック中...";

  const result = await checkSafety(url);
  if (result.safe) {
    resultBox.textContent = `✅ 安全な可能性が高い (${result.reason})`;
  } else {
    resultBox.textContent = `❌ 危険な可能性があります (${result.reason})`;
  }
});
