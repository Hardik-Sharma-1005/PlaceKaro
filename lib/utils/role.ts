import type { UserRole } from "../../types/database";

export function isStudent(role: UserRole): boolean {
  return role === "student";
}

export function isCompany(role: UserRole): boolean {
  return role === "company";
}

export function isPlacement(role: UserRole): boolean {
  return role === "placement";
}

export function isValidRole(role: string): role is UserRole {
  return (
    role === "student" ||
    role === "company" ||
    role === "placement"
  );
}