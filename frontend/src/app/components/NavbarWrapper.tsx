// app/components/NavbarWrapper.tsx
'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const hideNavbar =
    pathname?.startsWith('/problems/') ||
    pathname?.startsWith('/contests/') ||
    pathname?.startsWith('/admin') ||
    pathname === '/editor';

  if (hideNavbar) return null;
  return <Navbar />;
}
