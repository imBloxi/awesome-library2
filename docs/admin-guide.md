# Admin guide

For library staff. You need an account with the `admin` role (see [Making someone an admin](#making-someone-an-admin)). The **Admin** button appears in the toolbar once you sign in. Every admin page and action checks the role on the server, not just the menu.

The admin area has four tabs: **Overview**, **Books**, **Reservations**, **Users**.

## Overview (`/admin`)

Tiles with live counts: books, users, active holds, books out on loan, **overdue loans** (out more than 28 days), **holds expiring within a day**, and books with no free copy. Tiles that need attention are outlined in red. Click a tile to jump to that list. Below the tiles is the recent activity.

## Books (`/admin/books`)

- **Search** works like the public catalogue.
- **Add book** asks for:
  - title and author (required)
  - ISBN (optional, unique)
  - year
  - copies (0 to 1000)
  - description
  - **Top pick this week**
- **Edit** changes any field. You can't set copies below the number currently reserved or borrowed; the form tells you the minimum.
- **Delete** is refused while anyone holds or has borrowed the book.
  - A deleted book disappears from the catalogue, but its reservation history is kept.
  - Its ISBN is cleared, so the ISBN can be reused.
- **Deleted** tab: **Restore** brings a book back. Add its ISBN again from Edit.
- **Export CSV** downloads every active book. Cells that start with `=`, `+`, `-` or `@` are escaped so spreadsheets don't run them as formulas.

### Top picks ("This week's top books")

- Tick **Top pick this week** on a book's form and save. The book goes on the home page shelf for **7 days**.
- **Saving the book again keeps the original date.** Only unticking, saving, then ticking again restarts the 7 days.
- Untick to remove it early. After 7 days it drops off by itself.
- The home page shows the **6 newest** picks. If more than 6 are flagged, the Books page says how many are flagged. It doesn't yet say which ones are hidden (see the [changelog](changelog.md#known-issues)).
- Current picks show a **NEW!** badge in the admin list.

## Reservations (`/admin/reservations`)

Filter by status:

- Active (default)
- Ready for pickup
- Borrowed
- **Overdue** (borrowed more than 28 days ago)
- Returned
- Cancelled
- Expired
- All

You can also search by member email or book title.

| Action | When it's allowed | Effect |
|---|---|---|
| **Picked up** | A live hold | Becomes a loan (Borrowed) |
| **Returned** | A loan | Copy goes back on the shelf |
| **Extend** | A live hold | New 7-day pickup window from now |
| **Cancel** | A live hold | Copy goes back on the shelf |

A hold that has already lapsed can't be extended: its copy may have gone to someone else. **Export CSV** downloads every reservation.

The 28-day overdue threshold is `LOAN_DAYS` in `src/lib/constants.js`.

## Users (`/admin/users`)

- Search by name or email, and see each person's active reservation count.
- **Make admin** or **Remove admin**. The change applies at that person's **next sign-in**.
- You can't change your own role, so there's always at least one admin.

## Making someone an admin

The first admin has to be created in the database. Register in the app, then run this in the Neon SQL editor:

```sql
update neon_auth."user" set role = 'admin' where email = 'you@example.com';
```

Sign out and back in. After that, promote others from the **Users** tab.

## Housekeeping you don't need to do

- A daily job at 02:17 UTC marks lapsed holds as Expired. Availability and the 10-book limit already ignore lapsed holds, so nothing depends on it running.
- Expired top picks need no clean-up. The 7-day window is checked on every page load.
