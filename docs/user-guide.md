# User guide

Everything a visitor or member can do. Staff tasks are in the [admin guide](admin-guide.md).

## Finding a book

The home page (`/`) is the catalogue.

- **Search** matches title, author and ISBN together, so `orwell 1984` works. Case doesn't matter. `%` and `_` are matched literally, not as wildcards.
- **Narrow your search** (the group box under the search bar):
  - **On the shelf now**: hides books with no free copy.
  - **Published from / to**: a year range. If you enter them backwards (2000 to 1990) the site swaps them for you.
- **Clear all filters** appears whenever a search or filter is active and takes you back to the full catalogue.
- Results are sorted by title, 20 per page. **Next »** and **« Previous** keep your search and filters.
- Click an **author's name** to see all their books.

Everything you search for is in the address bar (for example `/?q=river&available=1&from=1900`), so you can bookmark or share a search. Nonsense values in the URL are ignored instead of causing an error.

### This week's top books

On the plain first page of the catalogue (no search, no filters) a yellow **★ This week's top books ★** shelf shows up to 6 books chosen by the librarians, newest first. A book stays there for 7 days after it's picked. Top picks also carry a blinking red **NEW!** in the results table. The blinking stops if your device asks for reduced motion.

### Reading the status column

| Shows | Means |
|---|---|
| ● 2 of 3 available (green) | 2 copies are free to reserve right now |
| ○ None available (red) | Every copy is on hold or out on loan |

Holds that weren't picked up within 7 days stop counting automatically, so the numbers are always current.

## The book page

Click a title to open `/books/<id>`:

- **Cover**: drawn by the site, with a colour per book. It isn't the real cover.
- **Library card**: author, year, ISBN, number of copies and live availability.
- **Reserve box**:
  - Signed out: **Sign in to reserve**, or register.
  - Signed in with a copy free: **📖 Reserve this book**. A green ✔ message confirms it.
  - No copy free: a note to check back later.
- **About this book**: the description, if the library has added one.
- **More by this author**: up to 6 other books by the same author. It loads just after the rest of the page.

## Your account

- **Register** (top right) with name, email and a password of at least 8 characters, then **Sign in**.
- **Sign out** is in the toolbar. Hover over it to see which email you're signed in with.

## Reservations

**My reservations** (`/reservations`) lists everything you've reserved, newest first, and shows how many of your 10 slots are in use.

| Status | What it means | What you can do |
|---|---|---|
| Ready for pickup · Nd left | The library is holding a copy for you for N more days | **Cancel** |
| Borrowed | You've picked it up | **Return** |
| Returned / Cancelled / Expired | Finished | **Delete** it from your list |

Rules:

- **At most 10** active reservations (holds plus borrowed books) at a time.
- **One copy per book** per person.
- **7 days to pick up.** After that the hold lapses and the copy goes back on the shelf.
- If you try to break a rule (say, reserving an 11th book) you get a red ⚠ message explaining why. Nothing is half-done.

## Keyboard and accessibility

- Press **Tab** on any page to reveal **Skip to content**.
- Every control shows a dotted focus outline, like Windows 95 did.
- Text contrast meets WCAG AA. The "window" decorations are hidden from screen readers.
- Inputs use 16px text, so phones don't zoom in when you tap them.
