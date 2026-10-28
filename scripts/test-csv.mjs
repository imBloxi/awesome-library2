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
