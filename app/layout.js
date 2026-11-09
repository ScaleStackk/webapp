import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./search.css";
import "./info.css";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "QuestaCase | Legal Research Assistant",
  description: "Upload and query court judgments with an AI research assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
