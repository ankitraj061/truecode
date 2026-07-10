// app/components/NavbarWrapper.tsx
'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const hideNavbar =
    pathname?.startsWith('/problems/') ||
    // Only the in-contest problem-solving view has its own ContestNavbar;
    // the plain contest detail page (/contests/[contestId]) relies on this
    // shared Navbar and must not be hidden here.
    (pathname?.startsWith('/contests/') && pathname?.includes('/problem/')) ||
    pathname?.startsWith('/admin') ||
    pathname === '/editor';

  if (hideNavbar) return null;
  return <Navbar />;
}
