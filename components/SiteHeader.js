"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";

export default function SiteHeader() {
  const pathname = usePathname();
  const active = pathname.startsWith("/design") || pathname.startsWith("/architecture")
    ? "design"
    : pathname.startsWith("/demo")
      ? "demo"
      : "aim";

  return (
    <header className={`site-header${active === "demo" ? " site-header-demo" : ""}`}>
      <Link aria-label="QuestaCase home" className="questacase-brand" href="/">
        <span className="questacase-icon"><Icon name="graph" size={22} strokeWidth={2} /></span>
        <span>Questa<span>Case</span></span>
      </Link>

      <div className="site-header-actions">
        {active === "demo" && (
          <Link className="site-upload" href="/demo/?upload=true">
            <Icon name="upload" size={17} /><span>Upload judgment</span>
          </Link>
        )}
        <nav aria-label="Primary navigation" className="site-nav">
          <Link aria-current={active === "demo" ? "page" : undefined} href="/demo/">Demo</Link>
          <Link aria-current={active === "design" ? "page" : undefined} href="/design/">Design</Link>
          <Link aria-current={active === "aim" ? "page" : undefined} href="/">Aim</Link>
        </nav>
      </div>
    </header>
  );
}
