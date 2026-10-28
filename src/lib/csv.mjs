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
