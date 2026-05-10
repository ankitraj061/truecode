'use client';
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "@/app/slices/authSlice";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/app/store/store";
import { motion } from 'framer-motion';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && error) {
      router.push("/");
    }
  }, [loading, error, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center p-12 bg-elevated rounded-2xl border border-border-primary shadow-lg max-w-md w-full mx-4">
          {/* Subtle Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-sm">
              <svg
                className="w-8 h-8 text-brand" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <motion.h2 
            className="text-xl font-semibold text-primary mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Authenticating...
          </motion.h2>

          {/* Subtext */}
          <motion.p 
            className="text-text-secondary text-sm mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            We’re verifying your session securely.
          </motion.p>

          {/* Progress Line — Quiet and refined */}
          <div className="w-full bg-secondary rounded-full h-1.5 mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-brand rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            />
          </div>

          {/* Dots — Subtle, rhythmic, not distracting */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-text-tertiary rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}