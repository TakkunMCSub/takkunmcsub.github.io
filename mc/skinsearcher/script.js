async function searchSkin(playerName) {
  try {
    // Mojang APIでUUID取得
    const uuidRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
    if (!uuidRes.ok) throw new Error("プレイヤーが見つかりません");
    const uuidData = await uuidRes.json();
    const uuid = uuidData.id;

    // Crafatar APIでスキン画像取得
    const skinFrontUrl = `https://crafatar.com/renders/body/${uuid}?overlay`;
    const skinHeadUrl = `https://crafatar.com/avatars/${uuid}?overlay`;

    document.getElementById("playerName").textContent = `プレイヤー: ${playerName}`;
    const skinFront = document.getElementById("skinFront");
    const skinHead = document.getElementById("skinHead");

    skinFront.src = skinFrontUrl;
    skinHead.src = skinHeadUrl;

    skinFront.style.display = "block";
    skinHead.style.display = "block";

  } catch (error) {
    document.getElementById("playerName").textContent = "⚠️ スキンを取得できませんでした";
    console.error(error);
  }
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const playerName = document.getElementById("playerInput").value.trim();
  if (!playerName) {
    alert("プレイヤー名を入力してください");
    return;
  }
  searchSkin(playerName);
});
