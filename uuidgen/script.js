let currentType = "v4"; // デフォルトは v4

function generateUUID(type) {
  if (type === "v1") {
    // 簡易的なv1 (timestampベース)
    const timestamp = Date.now().toString(16);
    return timestamp.padEnd(32, "0").replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-1$3-$4-$5");
  }
  if (type === "v4") {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  if (type === "v7") {
    // v7はtimestampベース＋ランダム
    const timestamp = Date.now().toString(16).slice(-12);
    return timestamp + '-7xxx-yxxx-' + Math.random().toString(16).slice(2, 14);
  }
  if (type === "guid") {
    // GUIDはv4とほぼ同じ
    return generateUUID("v4").toUpperCase();
  }
}

function updateUUID() {
  const uuid = generateUUID(currentType);
  document.getElementById('uuidOutput').textContent = uuid;
}

document.querySelectorAll('.version-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentType = btn.dataset.type;
    updateUUID();
  });
});

document.getElementById('generateBtn').addEventListener('click', updateUUID);

document.getElementById('copyBtn').addEventListener('click', () => {
  const uuidText = document.getElementById('uuidOutput').textContent;
  navigator.clipboard.writeText(uuidText).then(() => {
    alert("UUID copied to clipboard!");
  });
});

// 初期表示
updateUUID();
