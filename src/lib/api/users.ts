import { fetchJson } from "./client";
import { User } from "../../types";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee";
};

export type UpdateUserInput = {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "employee";
};

export function getUsers() {
  return fetchJson<User[]>("/api/users");
}

export function createUser(input: CreateUserInput) {
  return fetchJson<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(id: number, input: UpdateUserInput) {
  return fetchJson<{ success: true }>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: number) {
  return fetchJson<{ success: true }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

