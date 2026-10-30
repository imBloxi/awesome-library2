# User guide

Everything a visitor or member can do. Staff tasks are in the [admin guide](admin-guide.md).

## Finding a book

The home page (`/`) is the catalogue.

- **Search** matches title, author and ISBN together, so `orwell 1984` works. Case doesn't matter. `%` and `_` are matched literally, not as wildcards.
- **Narrow your search** (the group box under the search bar):
  - **On the shelf now**: hides books with no free copy.
  - **Published from / to**: a year range. If you enter them backwards (2000 to 1990) the site swaps them for you.
- **Clear all filters** appears whenever a search or filter is active and takes you back to the full catalogue.
- Results update as you type. With a search, the best matches come first; otherwise they're sorted by title. **Sort** also offers newest in the library and publication year, and **Genre** narrows to one genre. 20 per page. **Next »** and **« Previous** keep your search and filters.
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
  - No copy free: **Join the waitlist**. You see your place in the queue; when a copy comes back it's held for you for 7 days.
  - **Save for later** keeps the book on your list without reserving it.
- **About this book**: the description, if the library has added one.
- **More by this author** and **Readers also borrowed**: up to 6 books each. They load just after the rest of the page.
- **Babel Editions**: imagined versions of the book, written by the library's story generator. See below.

## Babel Editions

- **Read a Babel Edition** opens edition 1; **Roll a random edition** opens another. Each edition has its own characters and plot, built from the book's title and description, about 2,500 words in ten chapters. The same edition number always reads the same, so you can share the link.
- The title page shows the cover, estimated reading time and an upfront original-story note. **Start from chapter 1** begins a book; **Continue chapter N** returns to the last chapter opened in that edition on this device. Catalog book pages also keep their **Continue reading** link.
- Open **Appearance** for text size, Serif/Sans and Light/Sepia/Dark. Choices are remembered on this device; reading still works when storage is blocked.
- Open **Contents** to jump chapters. Chapter pages show your chapter position, a short reading estimate, and the titles of the previous/next chapters. **←/→** turn chapters when you are reading; they leave buttons, links, editable fields and selected text alone.
- **Download for offline** saves a self-contained HTML file, with its own contents and a return link after every chapter. It uses no scripts or external resources.
- **Babel** in the header (`/babel`) invents whole books that don't exist, from a number.
- These are original stories, not the real books.
- Stories use planned discoveries, consequences and endings. The same metadata and edition number repeat within the current generator version; writing improvements can update editions at existing links. Names and themes are drawn from limited metadata patterns, so an imagined edition is not a full adaptation of the published book.

## Your account

- **Register** (top right) with name, email and a password of at least 8 characters, then **Sign in**.
- **Sign out** is in the toolbar. Hover over it to see which email you're signed in with.

## Reservations

**My reservations** (`/reservations`) lists everything you've reserved, newest first, and shows how many of your 10 slots are in use.

| Status | What it means | What you can do |
|---|---|---|
| Ready for pickup · Nd left | The library is holding a copy for you for N more days | **Cancel** |
| Borrowed · due date | You've picked it up | **Renew 4 weeks** (once, if nobody is waiting and it isn't overdue), **Return** |
| Returned / Cancelled / Expired | Finished | **Delete** it from your list |

Rules:

- **At most 10** active reservations (holds plus borrowed books) at a time.
- **One copy per book** per person.
- **7 days to pick up.** After that the hold lapses and the copy goes back on the shelf.
- **Waitlist**: up to 20 books at once. You keep your place if you're at the 10-book limit when your turn comes; the copy goes to the next person and you get the following one.
- **Notices**: a number on **My reservations** in the header counts books ready to collect, holds ending within 24 hours and overdue loans. The page explains each one.
- If you try to break a rule (say, reserving an 11th book) you get a red ⚠ message explaining why. Nothing is half-done.

## Keyboard and accessibility

- Press **Tab** on any page to reveal **Skip to content**.
- Every control shows a dotted focus outline, like Windows 95 did.
- Text contrast meets WCAG AA. The "window" decorations are hidden from screen readers.
- Inputs use 16px text, so phones don't zoom in when you tap them.
