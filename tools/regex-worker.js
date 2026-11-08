self.onmessage = event => {
  const { pattern, flags, text, replacement } = event.data || {};
  try {
    const expression = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
    const matches = [];
    let match;
    let truncated = false;
    let count = 0;
    while ((match = expression.exec(text)) !== null) {
      count++;
      if (matches.length < 100) matches.push({ match: match[0], index: match.index, groups: match.slice(1, 10) });
      else truncated = true;
      if (match[0] === "") expression.lastIndex++;
      if (count > 10000) { truncated = true; break; }
    }
    const replaceExpression = new RegExp(pattern, flags);
    const replaced = text.replace(replaceExpression, replacement).slice(0, 500000);
    self.postMessage({ count, matches, truncated, replaced });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
