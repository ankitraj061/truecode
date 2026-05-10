'use client'

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProblemPage() {
  const { slug } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (slug) {
      router.replace(`/problems/${slug}/description`);
    }
  }, [slug, router]);

  return null;
}
