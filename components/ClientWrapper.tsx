"use client";

import { useState, useEffect, ReactNode } from "react";

interface ClientWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientWrapper component ensures that its children are only rendered on the client side,
 * avoiding hydration errors by not rendering during server-side rendering.
 */
export default function ClientWrapper({
  children,
  fallback,
}: ClientWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return fallback or null during server side rendering
    return fallback || null;
  }

  return <>{children}</>;
}
