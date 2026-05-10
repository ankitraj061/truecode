// app/components/NavbarWrapper.tsx
'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export default function NavbarWrapper() {
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const hideNavbar =
    pathname?.startsWith('/problems/') ||
    pathname?.startsWith('/contests/') ||
    pathname?.startsWith('/admin') ||
    pathname === '/editor';

  if (hideNavbar || !isAuthenticated) return null;
  return <Navbar />;
}
