"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { requireUser } from "@/lib/dal";
import { reserveBook, deleteUserReservation, returnBook } from "@/lib/queries/reservations";

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

export async function signOutAction() {
  await getAuth().signOut();
  redirect("/");
}
