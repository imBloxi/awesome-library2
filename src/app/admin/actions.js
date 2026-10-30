"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createBook, updateBook, deleteBook, restoreBook, bookTag } from "@/lib/queries/books";
import { markPickedUp, returnBook, cancelHold, extendHold, promoteWaitlist } from "@/lib/queries/reservations";
import { setUserRole } from "@/lib/queries/users";
import { importBooks, logAdminEvent } from "@/lib/queries/admin";
import { parseBookCsv, IMPORT_MAX_BYTES } from "@/lib/book-import.mjs";

const idSchema = z.coerce.number().int().positive();
const emptyToNull = (v) => (v === "" ? null : v);

const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(300),
  author: z.string().trim().min(1, "Author is required.").max(200),
  isbn: z.string().trim().max(20, "ISBN is too long.").transform(emptyToNull),
  description: z.string().trim().max(5000).transform(emptyToNull),
  published_year: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(2100, "Year looks wrong.")])
    .transform(emptyToNull),
  total_copies: z.coerce.number().int("Copies must be a whole number.").min(0).max(1000),
  top_pick: z.boolean(),
  genre: z.string().trim().max(60, "Genre is too long.").transform(emptyToNull),
  // The top_pick_at the form showed ticked. Only compared in SQL, never trusted as a date.
  top_pick_seen: z.string().max(64).transform(emptyToNull),
});

function parseBook(formData) {
  const raw = Object.fromEntries(
    ["title", "author", "isbn", "description", "published_year", "total_copies", "top_pick_seen", "genre"].map((k) => [
      k,
      formData.get(k) ?? "",
    ])
  );
  // An unticked checkbox isn't sent at all.
  raw.top_pick = formData.get("top_pick") === "on";
  const parsed = bookSchema.safeParse(raw);
  return parsed.success
    ? { data: parsed.data, values: raw }
    : { error: parsed.error.issues[0]?.message ?? "Invalid input.", values: raw };
}

function dbError(err) {
  if (err?.code === "23505") return "A book with this ISBN already exists.";
  throw err;
}

export async function createBookAction(_prev, formData) {
  const admin = await requireAdmin();
  const { data, error, values } = parseBook(formData);
  if (error) return { error, values };
  try {
    // A visit to this id before it existed may have cached "not found".
    const bookId = await createBook(data);
    updateTag(bookTag(bookId));
    await logAdminEvent(admin, "book.create", { bookId, detail: data.title });
    updateTag("genres");
  } catch (err) {
    return { error: dbError(err), values };
  }
  redirect("/admin/books");
}

export async function updateBookAction(id, _prev, formData) {
  const admin = await requireAdmin();
  const { data, error, values } = parseBook(formData);
  if (error) return { error, values };

  try {
    const result = await updateBook(id, data);
    if (!result.ok) return { error: result.error, values };
    updateTag(bookTag(id));
    updateTag("genres");
    // More copies may serve the waitlist.
    const promoted = await promoteWaitlist(id);
    await logAdminEvent(admin, "book.update", { bookId: id, detail: promoted ? `${promoted} waitlist hold(s) created` : null });
  } catch (err) {
    return { error: dbError(err), values };
  }
  redirect("/admin/books");
}

export async function deleteBookAction(_prev, formData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid book." };
  const ok = await deleteBook(id.data);
  if (!ok) return { error: "Can't delete: someone has this book reserved or borrowed." };
  updateTag(bookTag(id.data));
  updateTag("genres");
  await logAdminEvent(admin, "book.delete", { bookId: id.data });
  refresh();
  return {};
}

export async function markPickedUpAction(_prev, formData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid reservation." };
  const ok = await markPickedUp(id.data);
  if (!ok) return { error: "Only active holds can be marked as picked up." };
  await logAdminEvent(admin, "loan.pickup", { reservationId: id.data });
  refresh();
  return {};
}

export async function adminReturnAction(_prev, formData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid reservation." };
  const ok = await returnBook(id.data);
  if (!ok) return { error: "Only picked-up books can be returned." };
  await logAdminEvent(admin, "loan.return", { reservationId: id.data });
  refresh();
  return {};
}

export async function cancelHoldAction(_prev, formData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid reservation." };
  const ok = await cancelHold(id.data);
  if (!ok) return { error: "Only holds that are still waiting for pickup can be cancelled." };
  await logAdminEvent(admin, "hold.cancel", { reservationId: id.data });
  refresh();
  return {};
}

export async function extendHoldAction(_prev, formData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid reservation." };
  const ok = await extendHold(id.data);
  if (!ok) return { error: "Only holds that haven't lapsed can be extended." };
  await logAdminEvent(admin, "hold.extend", { reservationId: id.data });
  refresh();
  return {};
}

export async function restoreBookAction(_prev, formData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid book." };
  const ok = await restoreBook(id.data);
  if (!ok) return { error: "This book isn't deleted." };
  updateTag(bookTag(id.data));
  updateTag("genres");
  await logAdminEvent(admin, "book.restore", { bookId: id.data });
  refresh();
  return {};
}

const userIdSchema = z.string().trim().min(1).max(200);

async function changeRole(formData, role) {
  const me = await requireAdmin();
  const id = userIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid user." };
  // Keeps at least one admin around: you can't remove your own access.
  if (id.data === String(me.id)) return { error: "You can't change your own role." };
  const ok = await setUserRole(id.data, role);
  if (!ok) return { error: "User not found." };
  await logAdminEvent(me, "user.role", { targetUser: id.data, detail: role });
  refresh();
  return { message: "Saved. Applies at their next sign-in." };
}

export const makeAdminAction = async (_prev, formData) => changeRole(formData, "admin");
export const removeAdminAction = async (_prev, formData) => changeRole(formData, "user");

// CSV import in two steps: "preview" validates and reports; "import" re-validates the same
// text and inserts the valid rows in one statement. Existing ISBNs are skipped.
export async function importBooksAction(_prev, formData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  let text = typeof formData.get("csv") === "string" ? formData.get("csv") : "";
  if (file && typeof file === "object" && file.size > 0) {
    if (file.size > IMPORT_MAX_BYTES) return { error: "The file is larger than 1 MB. Split it into smaller files." };
    text = await file.text();
  }
  const { rows, errors, total } = parseBookCsv(text);
  if (formData.get("mode") !== "import") return { csv: text, preview: rows.slice(0, 20), count: rows.length, errors, total };
  if (rows.length === 0) return { csv: text, errors, total, error: "Nothing to import." };
  const { inserted, skipped } = await importBooks(rows);
  updateTag("genres");
  await logAdminEvent(admin, "book.import", { detail: `${inserted} added, ${skipped} skipped (ISBN already in catalog), ${errors.length} invalid` });
  refresh();
  return { done: { inserted, skipped, invalid: errors.length } };
}
