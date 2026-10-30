"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { requireUser } from "@/lib/dal";
import {
  reserveBook, deleteUserReservation, returnBook, renewLoan, joinBookWaitlist, leaveBookWaitlist,
} from "@/lib/queries/reservations";
import { toggleSaved } from "@/lib/queries/books";
import { WAITLIST_LIMIT } from "@/lib/queries/waitlist-sql.mjs";

const idSchema = z.coerce.number().int().positive();

export async function reserveAction(_prev, formData) {
  const user = await requireUser();
  const bookId = idSchema.safeParse(formData.get("id"));
  if (!bookId.success) return { error: "Invalid book." };

  const result = await reserveBook(user.id, bookId.data);
  if (!result.ok) return { error: result.error };
  refresh();
  return { message: "Reserved. Pick it up at the library within 7 days." };
}

export async function deleteReservationAction(_prev, formData) {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid reservation." };

  const ok = await deleteUserReservation(user.id, id.data);
  if (!ok) return { error: "This reservation can't be deleted. Return the book first." };
  refresh();
  return {};
}

export async function returnAction(_prev, formData) {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid reservation." };

  const ok = await returnBook(id.data, user.id);
  if (!ok) return { error: "Only picked-up books can be returned." };
  refresh();
  return {};
}

export async function renewAction(_prev, formData) {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid reservation." };
  const result = await renewLoan(user.id, id.data);
  if (!result.ok) return { error: result.error };
  refresh();
  return { message: "Renewed. You have it for another 4 weeks." };
}

export async function joinWaitlistAction(_prev, formData) {
  const user = await requireUser();
  const bookId = idSchema.safeParse(formData.get("id"));
  if (!bookId.success) return { error: "Invalid book." };
  const ok = await joinBookWaitlist(user.id, bookId.data);
  if (!ok) return { error: `Couldn't join. You may already hold this book, or be waiting for ${WAITLIST_LIMIT} books.` };
  refresh();
  return { message: "You're on the waitlist. When a copy comes back it's held for you for 7 days." };
}

export async function leaveWaitlistAction(_prev, formData) {
  const user = await requireUser();
  const bookId = idSchema.safeParse(formData.get("id"));
  if (!bookId.success) return { error: "Invalid book." };
  await leaveBookWaitlist(user.id, bookId.data);
  refresh();
  return {};
}

export async function saveBookAction(_prev, formData) {
  const user = await requireUser();
  const bookId = idSchema.safeParse(formData.get("id"));
  if (!bookId.success) return { error: "Invalid book." };
  const saved = await toggleSaved(user.id, bookId.data, formData.get("save") === "1");
  if (saved === null) return { error: "This book can't be saved." };
  refresh();
  return {};
}

export async function signOutAction() {
  await getAuth().signOut();
  redirect("/");
}
