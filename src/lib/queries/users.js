import { db } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/queries/books";

function likePattern(q) {
  return `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
}

const COLS = `u.id, u.name, u.email, u.role,
  (select count(*)::int from active_reservations a where a.user_id = u.id) as active_count`;

// Fetches one extra row to know whether there's a next page.
export async function listUsers({ q = "", page = 1 }) {
  const offset = (page - 1) * PAGE_SIZE;
  const rows = q
    ? await db().query(
        `select ${COLS} from neon_auth."user" u
         where (u.name || ' ' || u.email) ilike $1
         order by u.email limit $2 offset $3`,
        [likePattern(q), PAGE_SIZE + 1, offset]
      )
    : await db().query(
        `select ${COLS} from neon_auth."user" u order by u.email limit $1 offset $2`,
        [PAGE_SIZE + 1, offset]
      );
  return { users: rows.slice(0, PAGE_SIZE), hasNext: rows.length > PAGE_SIZE };
}

// Roles are stored as plain "admin" / "user". The change applies at the user's next sign-in.
export async function setUserRole(id, role) {
  const rows = await db().query(
    `update neon_auth."user" set role = $2 where id = $1 returning id`,
    [id, role]
  );
  return rows.length === 1;
}
