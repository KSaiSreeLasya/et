export type Role = 'admin' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  deadline: string;
  assigned_to: number;
  assigned_to_name?: string;
  created_by: number;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: 'Technical' | 'HR' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  raised_by: number;
  raised_by_name?: string;
  assigned_to?: number;
  created_at: string;
}

export interface Analytics {
  taskStats: { status: string; count: number }[];
  ticketStats: { status: string; count: number }[];
  employeePerformance: { name: string; completed_tasks: number }[];
}
