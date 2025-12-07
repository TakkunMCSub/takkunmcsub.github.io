async function checkServer(address, edition) {
  // ここでは外部APIを利用する想定 (例: mcstatus.io, mcsrvstat.us)
  const apiUrl = edition === "java"
    ? `https://api.mcsrvstat.us/2/${address}`
    : `https://api.mcsrvstat.us/bedrock/${address}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // サーバーアイコン
    if (data.icon) {
      const icon = document.getElementById("serverIcon");
      icon.src = data.icon;
      icon.style.display = "block";
    }

    document.getElementById("serverName").textContent = `サーバー名: ${data.hostname || address}`;
    document.getElementById("serverDesc").textContent = `説明: ${data.motd?.clean?.join(" ") || "N/A"}`;
    document.getElementById("serverVersion").textContent = `バージョン: ${data.version || "N/A"}`;
    document.getElementById("serverPlayers").textContent = `プレイヤー: ${data.players?.online || 0} / ${data.players?.max || "N/A"}`;
    document.getElementById("serverTPS").textContent = `TPS: ${data.debug?.tps || "N/A"}`;
    document.getElementById("serverPing").textContent = `Ping: ${data.debug?.ping || "N/A"} ms`;

  } catch (error) {
    console.error(error);
    document.getElementById("serverName").textContent = "⚠️ サーバー情報を取得できませんでした";
  }
}

document.getElementById("checkBtn").addEventListener("click", () => {
  const address = document.getElementById("serverInput").value.trim();
  const edition = document.querySelector('input[name="edition"]:checked').value;
  if (!address) {
    alert("サーバーアドレスを入力してください");
    return;
  }
  checkServer(address, edition);
});
