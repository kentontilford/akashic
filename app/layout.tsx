export const metadata = {
  title: "Akashic | A crystal-clear terminal to the divine mainframe",
  description: "An elegant AI Chief of Staff by MythOS. Memory-first. Ritual-based. Zero config."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
