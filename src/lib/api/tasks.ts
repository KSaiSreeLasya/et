import { fetchJson } from "./client";
import { Task } from "../../types";

export type CreateTaskInput = {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  deadline: string;
  assigned_to: string; // server accepts string id from form
};

export function getTasks() {
  return fetchJson<Task[]>("/api/tasks");
}

export function createTask(input: CreateTaskInput) {
  return fetchJson<{ id: number }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTaskStatus(taskId: number, status: Task["status"]) {
  return fetchJson<{ success: true }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export type UpdateTaskInput = Partial<
  Pick<
    Task,
    "title" | "description" | "priority" | "status" | "deadline" | "assigned_to"
  >
>;

export function updateTask(taskId: number, patch: UpdateTaskInput) {
  return fetchJson<{ success: true }>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function getTask(taskId: number) {
  return fetchJson<Task>(`/api/tasks/${taskId}`);
}

export function deleteTask(taskId: number) {
  return fetchJson<{ success: true }>(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

