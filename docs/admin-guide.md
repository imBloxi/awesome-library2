# Admin guide

For library staff. You need an account with the `admin` role (see [Making someone an admin](#making-someone-an-admin)). The **Admin** button appears in the toolbar once you sign in. Every admin page and action checks the role on the server, not just the menu.

The admin area has four tabs: **Overview**, **Books**, **Reservations**, **Users**.

## Overview (`/admin`)

Tiles show live counts: books, users, active holds, books out on loan, **overdue loans**, **holds expiring within 24 hours**, and books with no free copy. Overdue and expiring tiles are outlined in red when they need attention. Click a circulation tile to open its matching reservation filter.

The **Needs attention** queue shows up to eight reservations: overdue loans first, then live holds expiring within 24 hours. Each group starts with its earliest deadline. **View attention queue** opens the full paginated queue. A lapsed hold is excluded even before the daily cleanup job runs.

## Books (`/admin/books`)

- **Search** works like the public catalogue.
- **Add book** asks for:
  - title and author (required)
  - ISBN (optional, unique)
  - year
  - copies (0 to 1000)
  - description
  - genre (optional, feeds the catalog's genre filter)
  - **Top pick this week**
- **Edit** changes any field. You can't set copies below the number currently reserved or borrowed; the form tells you the minimum.
- **Delete** is refused while anyone holds or has borrowed the book.
  - A deleted book disappears from the catalogue, but its reservation history is kept.
  - Its ISBN is cleared, so the ISBN can be reused.
- **Deleted** tab: **Restore** brings a book back. Add its ISBN again from Edit.
- **Import CSV** adds many books at once. **Check file** shows a preview and every invalid line with the reason; **Import** adds the valid rows in one go. Books whose ISBN is already in the catalog are skipped, never overwritten. The export file imports as-is.
- Adding copies to a book with a waitlist gives the new copies to the queue straight away.
- **Export CSV** downloads every active book. Cells that start with `=`, `+`, `-` or `@` are escaped so spreadsheets don't run them as formulas.

### Top picks ("This week's top books")

- Tick **Top pick this week** on a book's form and save. The book goes on the home page shelf for **7 days**.
- **Saving the book again keeps the original date.** Only unticking, saving, then ticking again restarts the 7 days.
- Untick to remove it early. After 7 days it drops off by itself.
- The home page shows the **6 newest** picks. If more are flagged, the Books page lists the ones that aren't shown.
- An edit form left open while a pick expires won't restart it when saved. Deleting a book clears its pick.
- Current picks show a **NEW!** badge in the admin list.

## Reservations (`/admin/reservations`)

Filter by status:

- Active (default)
- **Needs attention** (overdue loans and live holds expiring within 24 hours)
- **Expiring within 24h** (live holds only)
- Waiting for pickup
- Borrowed
- **Overdue** (borrowed more than 28 days ago)
- Returned
- Cancelled
- Expired
- All

You can also search by member name, email or book title. Lists show up to **20 reservations per page**; use **Previous** and **Next** to reach older entries. Search, status, sort and any selected member stay applied while paging. Applying filters starts again on page one.

**Priority** sorting puts overdue loans first, then expiring holds, then other deadlines, with the earliest deadline first in each group. Active lists default to priority; completed reservation history and All default to **Newest first**. You can choose either sort.

Every live hold shows its exact **Pickup by** timestamp, and every borrowed book shows its **Due** timestamp. All dates and times in the staff reservation lists are labeled **UTC**. A loan becomes overdue strictly after pickup plus 28 days, including when it is less than one full day late.

| Action | When it's allowed | Effect |
|---|---|---|
| **Picked up** | A live hold | Becomes a loan (Borrowed) |
| **Returned** | A loan | Copy goes back on the shelf |
| **Extend** | A live hold | New 7-day pickup window from now |
| **Cancel** | A live hold | Copy goes back on the shelf |

A hold that has already lapsed can't be extended: its copy may have gone to someone else. **Export CSV** downloads up to **50,000 reservations** across all members and statuses. The export does not apply the current page's filters and may omit older reservations when the total exceeds that limit.

The 28-day overdue threshold is `LOAN_DAYS` in `src/lib/constants.js`.

## Users (`/admin/users`)

- Search by name or email. Click a person's **active reservation count** to open their exact active reservation list.
- The reservation page shows the selected member's name and email. That member stays selected while you search, change filters or turn pages, even if there are no matches. **Clear member filter** returns to the same search, status and sort across all members. If the member no longer exists, the page says **Member not found** and still offers a way to clear the filter.
- An invalid member filter shows no reservations and offers **Clear member filter**; it never silently opens every member's list.
- **Make admin** or **Remove admin**. The change applies at that person's **next sign-in**.
- You can't change your own role.

## Desk (`/admin/desk`)

One box, focused when the page opens. Scan or type an ISBN (hyphens and spaces don't matter) to see that book's holds and loans, or type a title, name or email. **Mark picked up** and **Mark returned** work right in the list. A return gives the copy to the next person on the waitlist, if any.

## Member pages (`/admin/users/<id>`)

Click a name on **Users**: role, totals, standing, active holds and loans with the usual buttons, waitlist places and recent history.

The **Monitoring** and **Moderate** panels show the member's score with its evidence and let you act:

| Action | Effect | Member sees |
|---|---|---|
| **Warn** | nothing is blocked | the warning and reason in My library (30 days) and the account console |
| **Pause borrowing** (1, 7, 14, 30, 90 days or until lifted) | no new reservations, waitlist places or renewals; waitlist holds go to the next person while they keep their place | a red notice with the reason and end date |
| **Suspend account** (same durations) | everything above, and reading access closes | the same, marked suspended |
| **Staff note** | nothing | that a note exists, not its text |

Every action needs a reason and is logged under **Activity** with your email. Returns always work. **Lift restriction** ends pauses and suspensions early and needs a reason too. You can't moderate your own account. Pauses and suspensions end on their own at their end date.

## Watchlist (`/admin/watchlist`)

A master switch (off by default) and a list of keywords. While it's on, any book whose title, author, genre or description contains an active keyword is **watched**:

- its book page tells members it's on the watchlist before they reserve;
- anyone who reserves, borrows, waits for or saves it within 180 days appears under **Persons of interest** with the matching titles, and gets a **Person of interest** monitoring signal (15 points per title, max 30);
- the member sees the same flag in their account console.

Each keyword needs a reason. **Pause** keeps a keyword without matching; **Remove** deletes it. Every change, including the switch, is logged under **Activity**. Nothing is blocked automatically. Reading history can reveal religion, politics, health or sexuality, so keep keywords narrow and justified.

## Monitoring (`/admin/monitoring`)

Members with any circulation history, ranked by a 0 to 100 score built from their own records. Filters: **Needs review** (45+), **Watch** (20+), **Paused or suspended**, **All members**. **How scores are calculated** on the page lists every rule and its points:

- overdue loans now (most weight), late returns over 90 days, holds not collected over 90 days;
- frequent cancelling (30 days), 5+ reservations inside one hour (last 7 days), heavy waitlisting, holding all 10 reservations;
- warnings, pauses or suspensions in the last 180 days.

Scores are recalculated on every view, never stored, and never act by themselves. Members see their own score and evidence in their account console.

## Stats (`/admin/stats`)

Loans per week for 12 weeks, the 10 most borrowed books, books never borrowed (oldest first) and **waitlist demand**: books people are queuing for, with the copies you have. Good candidates for buying more.

## Activity (`/admin/activity`)

Every admin action, newest first: who did it, on which book, member or reservation, and when (UTC). Imports record how many books were added, skipped and invalid.

## Making someone an admin

The first admin has to be created in the database. Register in the app, then run this in the Neon SQL editor:

```sql
update neon_auth."user" set role = 'admin' where email = 'you@example.com';
```

Sign out and back in. After that, promote others from the **Users** tab.

## Housekeeping you don't need to do

- A daily job at 02:17 UTC marks lapsed holds as Expired and then serves any waitlists those copies can now satisfy. Availability and the 10-book limit already ignore lapsed holds, and a reserve attempt, return or cancellation on the book serves its queue too, so the job only matters for queues nobody touches that day.
- Expired top picks need no clean-up. The 7-day window is checked on every page load.
