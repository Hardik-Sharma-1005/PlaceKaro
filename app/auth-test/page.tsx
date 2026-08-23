"use client";

import { RoleGuard } from "../../lib/components/RoleGuard";
import { useAuth } from "../../lib/context/AuthContext";

export default function AuthTestPage() {
  const { firebaseUser, user, loading, userError } = useAuth();

  return (
    <RoleGuard allowedRoles={["student"]}>
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">PlaceKaro Auth Test</h1>

          {loading ? (
            <p className="mt-4 text-gray-600">Loading authentication state...</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <h2 className="font-semibold">Firebase User</h2>
                <p className="text-gray-700">
                  {firebaseUser ? "Logged in" : "Not logged in"}
                </p>
              </div>

              <div>
                <h2 className="font-semibold">Firebase UID</h2>
                <p className="break-all text-gray-700">
                  {firebaseUser?.uid ?? "Not available"}
                </p>
              </div>

              <div>
                <h2 className="font-semibold">PlaceKaro User</h2>
                <p className="text-gray-700">
                  {user ? "Loaded" : "Not loaded"}
                </p>
              </div>

              <div>
                <h2 className="font-semibold">Name</h2>
                <p className="text-gray-700">
                  {user?.displayName ?? "Not available"}
                </p>
              </div>

              <div>
                <h2 className="font-semibold">Email</h2>
                <p className="text-gray-700">
                  {user?.email ?? "Not available"}
                </p>
              </div>

              <div>
                <h2 className="font-semibold">Role</h2>
                <p className="text-gray-700">
                  {user?.role ?? "Not available"}
                </p>
              </div>

              <div>
                <h2 className="font-semibold">Active</h2>
                <p className="text-gray-700">
                  {user?.isActive ? "Yes" : "No"}
                </p>
              </div>

              <div>
                <h2 className="font-semibold">Database Read Result</h2>
                <p className="text-gray-700">
                  {user ? "Successfully loaded from Realtime Database" : "Failed"}
                </p>
              </div>

              {userError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h2 className="font-semibold text-red-800">User Error</h2>
                  <p className="mt-1 text-sm text-red-700">{userError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </RoleGuard>
  );
}