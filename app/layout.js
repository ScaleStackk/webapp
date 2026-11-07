import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./search.css";

export const metadata = {
  title: "QuestaCase | Legal Research Assistant",
  description: "Upload and query court judgments with an AI research assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
