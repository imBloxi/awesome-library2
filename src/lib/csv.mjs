// Minimal CSV writer. Cells starting with = + - @ get a leading quote so a
// spreadsheet doesn't run them as formulas (CSV injection).
function cell(value) {
  if (value == null) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// columns: [[header, key], ...]
export function toCsv(columns, rows) {
  const lines = [columns.map(([h]) => cell(h)).join(",")];
  for (const row of rows) lines.push(columns.map(([, key]) => cell(row[key])).join(","));
  return lines.join("\r\n") + "\r\n";
}

// RFC 4180 reader: quoted cells, doubled quotes, commas and newlines inside quotes,
// CRLF or LF line ends, and a leading byte-order mark. Returns an array of rows of strings.
// Undoes the formula guard above: a leading ' before = + - @ is removed again.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cellText = "";
  let quoted = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  const endCell = () => {
    row.push(/^'[=+\-@\t\r]/.test(cellText) ? cellText.slice(1) : cellText);
    cellText = "";
  };
  for (; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cellText += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cellText += ch;
    } else if (ch === '"' && cellText === "") quoted = true;
    else if (ch === ",") endCell();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endCell();
      rows.push(row);
      row = [];
    } else cellText += ch;
  }
  if (cellText !== "" || row.length) { endCell(); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
