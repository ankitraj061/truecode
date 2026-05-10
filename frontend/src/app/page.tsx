'use client';

import { useSelector } from "react-redux";

import Home from "./Home";
import HomeWithoutLogin from "./HomeWithoutLogin";
import { RootState } from "@/app/store/store";

export default function Page() {
    const { isAuthenticated, user, } = useSelector((state: RootState) => state.auth);


    return (
        <>
            {isAuthenticated && user ? <Home /> : <HomeWithoutLogin />}
        </>
    );
}
