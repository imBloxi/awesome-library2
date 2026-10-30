import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";
import { OPERATOR_CONTACT, OPERATOR_NAME } from "@/lib/legal.mjs";

export const metadata = { title: "Privacy policy" };

const operator = OPERATOR_NAME ?? "the people who run this library site";
const contact = OPERATOR_CONTACT
  ? <>by writing to <strong>{OPERATOR_CONTACT}</strong></>
  : <>by asking library staff at the desk. Staff are the people who can export, correct and delete records</>;

const RECORD = [
  ["Identity", "Name, email address, account ID, password (stored only as a hash), role, whether your email is verified, when the account was created and changed.", "You, when you register or edit your profile.", "To run your account and let you sign in.", "Until your account is deleted."],
  ["Sessions", "Session ID and secret token, start and expiry times, the IP address and browser user agent the sign-in service receives.", "Your browser, each time you sign in.", "To keep you signed in, let you review and end sessions, and protect accounts.", "A session stops working when it expires or is ended. Its record can remain until it is cleaned up or the account is deleted."],
  ["Reservations and loans", "Every reservation: the book, when you reserved it, when the hold expires, when you collected and returned it, renewals, whether it came from a waitlist, and whether you removed it from your view.", "You, and library staff when they confirm pickups and returns.", "To run circulation: holds, loans, due dates, renewals, reading access.", "No automatic deletion. Removing a record from My library hides it from you; ctOS keeps it."],
  ["Waitlists and saved books", "Which books you are waiting for or have saved, and when.", "You.", "To hold the next free copy for you and keep your list.", "Until you leave the waitlist, your hold is created, you remove the book, or the account is deleted."],
  ["Staff audit log", "Each staff action: which staff member, what they did, which book or reservation, your account ID for role changes, and when.", "Library staff actions.", "Accountability for every change made to records.", "No automatic deletion."],
  ["Moderation", "Staff notes, warnings, borrowing pauses and suspensions: the reason, the staff member, when it started, when it ends or was lifted and why.", "Library staff.", "To enforce the terms fairly and keep every decision accountable.", "No automatic deletion."],
  ["Request data", "IP address, browser user agent, the page requested and the time.", "Every request your browser makes.", "To serve and secure the site. Processed by the hosting provider.", "For the hosting provider's log retention period."],
];

export default function PrivacyPage() {
  const sections = [
    {
      id: "summary",
      title: "Summary",
      body: (
        <>
          <div className="ctos-callout">
            <p>ctOS is the account system of this library. It records who you are, every session you open, and everything you do with the circulation system: what you reserve, collect, return, wait for and save, and when. Library staff can see that record. So can you.</p>
          </div>
          <p>ctOS does not sell your data, show advertising, use analytics or tracking scripts, follow you across other sites, or send you email.</p>
        </>
      ),
    },
    {
      id: "controller",
      title: "Who is responsible",
      body: <p>The controller of your personal data is {operator}. You can contact them {contact}.</p>,
    },
    {
      id: "record",
      title: "What ctOS records",
      body: (
        <>
          <table className="ctos-table">
            <thead><tr><th scope="col">Record</th><th scope="col">Contents</th><th scope="col">Source</th><th scope="col">Purpose</th><th scope="col">Kept</th></tr></thead>
            <tbody>
              {RECORD.map(([name, what, source, why, kept]) => (
                <tr key={name}><th scope="row">{name}</th><td data-label="Contents">{what}</td><td data-label="Source">{source}</td><td data-label="Purpose">{why}</td><td data-label="Kept">{kept}</td></tr>
              ))}
            </tbody>
          </table>
          <h3>Your profile</h3>
          <p>The account console shows a subject file built from the records above: your counts, the hour and weekday you reserve most often (in UTC), and the authors and genres you borrow most. It is calculated each time you open the console and is not stored separately or shared.</p>
          <h3>Monitoring score</h3>
          <p>ctOS scores every member with circulation history from 0 to 100 using fixed rules over your own records: overdue loans, late returns, holds you didn&apos;t collect, frequent cancelling, many reservations inside one hour, heavy waitlisting, holding the maximum number of books, and recent staff action. Each rule, its points and the evidence behind it are shown to staff and to you in the account console. The score is recalculated on every view and not stored.</p>
          <p>The score only helps staff decide what to look at. It never restricts an account by itself. A person decides every warning, pause or suspension, and must record a reason you can read.</p>
          <h3>On your device</h3>
          <p>The sign-in service sets cookies to keep you signed in. They are strictly necessary. There are no analytics or advertising cookies. Your browser also stores your reader settings, your last chapter in each book and your motion setting. Those stay in your browser; ctOS never receives them. You can clear the reading data from the account console.</p>
          <h3>Observed, not recorded</h3>
          <p>The sign-in and register pages read your language, time zone, screen size and similar settings from your browser to show you what any website can see. Those values stay on the page and are not sent.</p>
        </>
      ),
    },
    {
      id: "rules",
      title: "Automatic rules",
      body: <p>Circulation rules are applied automatically and identically to every member: at most 10 active reservations, holds kept for 7 days, loans of 28 days with one renewal when nobody is waiting, and reading access to a book&apos;s editions only while you have that book checked out. While staff have paused your borrowing, ctOS automatically refuses new reservations, waitlist places, waitlist holds and renewals; while your account is suspended it also closes reading access. Returns always work. No other automated decisions are made about you.</p>,
    },
    {
      id: "access",
      title: "Who can see your record",
      body: (
        <ul>
          <li><strong>You</strong>, in My library and the account console.</li>
          <li><strong>Library staff</strong> (admins) see members&apos; names, email addresses, reservations, loans, waitlists, monitoring scores, moderation history and the staff audit log. Staff notes are visible to staff; you see that a note exists and can ask for its contents. They can confirm pickups and returns, cancel or extend holds, and change account roles. Staff cannot see your password.</li>
          <li><strong>Service providers</strong> that run the site for the library: Vercel (hosting, serving from Frankfurt, Germany) and Neon (the database and the sign-in service). They process data on the library&apos;s behalf under their data processing terms, which also cover any transfer outside the EU. Both are based in the United States.</li>
        </ul>
      ),
    },
    {
      id: "basis",
      title: "Legal basis",
      body: (
        <ul>
          <li><strong>Contract:</strong> your account, reservations, loans and reading access are the service you asked for.</li>
          <li><strong>Legitimate interests:</strong> session and request records to keep accounts secure; monitoring and moderation so copies stay fairly available to every member and the terms are enforced; the staff audit log so every change to a record is accountable. You can object to monitoring by contacting the controller.</li>
        </ul>
      ),
    },
    {
      id: "rights",
      title: "Your rights",
      body: (
        <>
          <p>You can ask for a copy of your data, for corrections, for your account and records to be deleted, for processing to be restricted, or object to processing based on legitimate interests. You can also ask for your data in a portable format.</p>
          <p>Some of this you can do yourself in the <Link href="/account">account console</Link>: see your file, change your display name and password, and end sessions. For everything else, contact the controller {contact}. Requests are answered within one month.</p>
          <p>You can complain to a data protection authority. In Latvia that is the Data State Inspectorate (Datu valsts inspekcija, dvi.gov.lv); elsewhere, the authority where you live or work.</p>
        </>
      ),
    },
    {
      id: "security",
      title: "Security",
      body: (
        <ul>
          <li>Passwords are hashed by the sign-in service and never stored in readable form.</li>
          <li>All traffic is encrypted with HTTPS.</li>
          <li>Every protected page checks your session with the sign-in service; ending a session takes effect on the next request.</li>
          <li>Session tokens are never sent to page scripts. The account console lists sessions without them.</li>
          <li>The site refuses to be framed by other sites and restricts camera, microphone and location access.</li>
        </ul>
      ),
    },
    {
      id: "changes",
      title: "Changes",
      body: <p>When this policy changes, the effective date at the top changes with it. The previous version stays in the site&apos;s public source history.</p>,
    },
  ];
  return (
    <LegalDoc
      label="ctOS record / Privacy"
      title="Privacy policy"
      intro={<p>Exactly what ctOS records about you, why, who sees it and how long it is kept. Everything on this page is in force.</p>}
      sections={sections}
    />
  );
}
