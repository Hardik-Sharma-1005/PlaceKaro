"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "../../types/database";
import { useAuth } from "../context/AuthContext";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallback = (
    <div className="p-6 text-center">
      <h2 className="text-lg font-semibold">Access denied</h2>
      <p className="mt-2 text-sm text-gray-600">
        You do not have permission to view this content.
      </p>
    </div>
  ),
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-600">Checking access...</p>
      </div>
    );
  }

  if (!user) {
    // Return null while redirecting
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback;
  }

  return <>{children}</>;
}