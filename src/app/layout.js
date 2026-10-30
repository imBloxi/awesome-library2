import "./globals.css";

export const metadata = {
  title: "Dogear — Find your next chapter",
  description:
    "A little less scrolling, a little more getting lost. Discover great books and curate your next chapter with Dogear.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
