function generatePassword(length, upper, lower, numbers, symbols) {
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+[]{}|;:,.<>?";

  let chars = "";
  if (upper) chars += upperChars;
  if (lower) chars += lowerChars;
  if (numbers) chars += numberChars;
  if (symbols) chars += symbolChars;

  if (chars === "") return "⚠️ 設定を選んでください";

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}

function updatePassword() {
  const length = parseInt(document.getElementById("length").value);
  const upper = document.getElementById("includeUpper").checked;
  const lower = document.getElementById("includeLower").checked;
  const numbers = document.getElementById("includeNumbers").checked;
  const symbols = document.getElementById("includeSymbols").checked;

  const password = generatePassword(length, upper, lower, numbers, symbols);
  document.getElementById("passwordOutput").textContent = password;
}

document.getElementById("generateBtn").addEventListener("click", updatePassword);

document.getElementById("copyBtn").addEventListener("click", () => {
  const passwordText = document.getElementById("passwordOutput").textContent;
  navigator.clipboard.writeText(passwordText).then(() => {
    alert("Password copied to clipboard!");
  });
});

// 初期表示
updatePassword();
