import test from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "../src/lib/csv.mjs";

const cols = [["Title", "title"], ["Year", "year"]];

test("quotes commas, quotes and newlines", () => {
  assert.equal(toCsv(cols, [{ title: 'A "B", C\nD', year: 1999 }]), 'Title,Year\r\n"A ""B"", C\nD",1999\r\n');
});

test("neutralises spreadsheet formulas and handles nulls and dates", () => {
  const csv = toCsv(cols, [{ title: "=HYPERLINK(1)", year: null }, { title: "-5+5", year: new Date("2026-01-02T03:04:05Z") }]);
  assert.equal(csv, "Title,Year\r\n'=HYPERLINK(1),\r\n'-5+5,2026-01-02T03:04:05.000Z\r\n");
});

import { parseCsv } from "../src/lib/csv.mjs";
import { parseBookCsv } from "../src/lib/book-import.mjs";

test("reads quotes, embedded commas and newlines, CRLF and a BOM", () => {
  assert.deepEqual(parseCsv('﻿a,b\r\n"x, ""y""","line1\nline2"\r\n,\r\n'), [["a", "b"], ['x, "y"', "line1\nline2"]]);
});

test("round-trips the writer, including the formula guard", () => {
  const rows = [{ title: "=SUM(1)", year: 2001 }, { title: 'Comma, "quote"', year: null }];
  const parsed = parseCsv(toCsv(cols, rows));
  assert.deepEqual(parsed, [["Title", "Year"], ["=SUM(1)", "2001"], ['Comma, "quote"', ""]]);
});

test("book import accepts the export format and reports bad rows by line", () => {
  const csv = [
    "ID,Title,Author,ISBN,Year,Copies,Available,Added,Genre",
    "1,Good Book,Ann Writer,978-1-23,1999,3,2,2026-01-01,Poetry",
    "2,,No Title,,,,,,",
    "3,Bad Year,Someone,,19x9,two,,,",
    "4,Dup,Someone,97812 3,,,,,",
    "5,Defaults,Someone,,,,,,",
  ].join("\n");
  const { rows, errors, total } = parseBookCsv(csv);
  assert.equal(total, 5);
  assert.deepEqual(rows.map((r) => r.title), ["Good Book", "Defaults"]);
  assert.deepEqual(rows[0], { line: 2, title: "Good Book", author: "Ann Writer", isbn: "978123", published_year: 1999, total_copies: 3, description: null, genre: "Poetry" });
  assert.equal(rows[1].total_copies, 1);
  assert.deepEqual(errors.map((e) => e.line), [3, 4, 5]);
  assert.match(errors[1].message, /year "19x9".*copies "two"/);
  assert.match(errors[2].message, /also on line 2/);
});

test("book import refuses files without a usable header", () => {
  assert.match(parseBookCsv("name,writer\nx,y").errors[0].message, /Title and Author/);
  assert.match(parseBookCsv("").errors[0].message, /empty/);
});
