import { fetchJson } from "./client";
import { Ticket } from "../../types";

export type CreateTicketInput = {
  title: string;
  description: string;
  category: Ticket["category"];
  priority: Ticket["priority"];
};

export function getTickets() {
  return fetchJson<Ticket[]>("/api/tickets");
}

export function createTicket(input: CreateTicketInput) {
  return fetchJson<{ id: number }>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTicket(
  ticketId: number,
  patch: Partial<Pick<Ticket, "status" | "assigned_to">>
) {
  return fetchJson<{ success: true }>(`/api/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

