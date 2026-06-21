// app/components/NavbarWrapper.tsx
'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export default function NavbarWrapper() {
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const isAuthPage =
    pathname === '/accounts/login' || pathname === '/accounts/signup';

  const hideNavbar =
    pathname?.startsWith('/problems/') ||
    pathname?.startsWith('/contests/') ||
    pathname?.startsWith('/admin') ||
    pathname === '/editor';

  if (hideNavbar) return null;
  if (!isAuthenticated && !isAuthPage) return null;
  return <Navbar />;
}
