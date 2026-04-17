import { Comment } from "../../types";
import { fetchJson } from "./client";

export function getTaskComments(taskId: number) {
  return fetchJson<Comment[]>(`/api/comments?task_id=${taskId}`);
}

export function getTicketComments(ticketId: number) {
  return fetchJson<Comment[]>(`/api/comments?ticket_id=${ticketId}`);
}

export function createTaskComment(taskId: number, content: string) {
  return fetchJson<Comment>("/api/comments", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId, content }),
  });
}

export function createTicketComment(ticketId: number, content: string) {
  return fetchJson<Comment>("/api/comments", {
    method: "POST",
    body: JSON.stringify({ ticket_id: ticketId, content }),
  });
}

