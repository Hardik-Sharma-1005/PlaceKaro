"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  signIn,
  signUp,
} from "../../lib/services/authService";

import type { UserRole } from "../../types/database";

type Mode = "signin" | "signup";

const roles: { value: UserRole; label: string }[] = [
  {
    value: "student",
    label: "Student",
  },
  {
    value: "company",
    label: "Company / Recruiter",
  },
  {
    value: "placement",
    label: "Placement Cell",
  },
];

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
  }

  function validatePassword(pass: string): string | null {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }

        await signUp(email, password, role, displayName);

        setSuccess("Account created successfully.");

        setDisplayName("");
        setEmail("");
        setPassword("");

        setTimeout(() => {
          setMode("signin");
          setSuccess("");
        }, 1200);
      } else {
        await signIn(email, password);

        setSuccess("Signed in successfully.");

        setTimeout(() => {
          router.push("/placement");
        }, 700);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-gray-400">
            PLACEKARO
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Placement Intelligence
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Build your employability profile. Connect with opportunities.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/[0.05] p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                mode === "signin"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {mode === "signin"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {mode === "signin"
                ? "Sign in to continue to PlaceKaro."
                : "Start building your PlaceKaro employability profile."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label
                    htmlFor="displayName"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Display name
                  </label>

                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(event) =>
                      setDisplayName(event.target.value)
                    }
                    placeholder="Enter your name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-gray-600 focus:border-white/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="mb-2 block text-sm text-gray-300"
                  >
                    Account type
                  </label>

                  <select
                    id="role"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as UserRole)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-white/30"
                  >
                    {roles.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-gray-300"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-gray-600 focus:border-white/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-gray-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-gray-600 focus:border-white/30"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          PlaceKaro · Placement Intelligence Platform
        </p>
      </div>
    </main>
  );
}