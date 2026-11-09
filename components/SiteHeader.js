"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";

export default function SiteHeader() {
  const pathname = usePathname();
  const active = pathname.startsWith("/architecture")
    ? "architecture"
    : pathname.startsWith("/project")
      ? "project"
      : "ask";

  return (
    <header className="site-header">
      <Link aria-label="QuestaCase home" className="questacase-brand" href="/">
        <span className="questacase-icon"><Icon name="scales" size={21} /></span>
        <span>Questa<span>Case</span></span>
      </Link>

      <nav aria-label="Primary navigation" className="site-nav">
        <Link aria-current={active === "ask" ? "page" : undefined} href="/">Ask</Link>
        <Link aria-current={active === "architecture" ? "page" : undefined} href="/architecture/">Design</Link>
        <Link aria-current={active === "project" ? "page" : undefined} href="/project/">Rationale</Link>
      </nav>

      <a className="site-upload" href="/?upload=true">
        <Icon name="upload" size={17} /><span>Upload judgment</span>
      </a>
    </header>
  );
}
