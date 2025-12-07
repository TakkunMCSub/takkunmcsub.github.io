function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

document.getElementById('generateBtn').addEventListener('click', () => {
  const uuid = generateUUID();
  document.getElementById('uuidOutput').textContent = uuid;
});

document.getElementById('copyBtn').addEventListener('click', () => {
  const uuidText = document.getElementById('uuidOutput').textContent;
  navigator.clipboard.writeText(uuidText).then(() => {
    alert("UUID copied to clipboard!");
  });
});
