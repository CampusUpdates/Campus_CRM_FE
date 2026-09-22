import { API_URL } from "../config/api";

export interface TodoItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
  dueDate: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  isCompleted?: boolean;
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  isCompleted?: boolean;
}

export async function fetchTodos(token: string, date?: string): Promise<TodoItem[]> {
  const url = date ? `${API_URL}/todos?date=${date}` : `${API_URL}/todos`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch todos");
  }

  return response.json();
}

export async function createTodo(token: string, payload: CreateTodoPayload): Promise<TodoItem> {
  const response = await fetch(`${API_URL}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to create todo";
    throw new Error(errorMsg);
  }

  return data;
}

export async function updateTodo(
  token: string,
  id: string,
  payload: UpdateTodoPayload
): Promise<TodoItem> {
  const response = await fetch(`${API_URL}/todos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "Failed to update todo";
    throw new Error(errorMsg);
  }

  return data;
}

export async function deleteTodo(token: string, id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/todos/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete todo");
  }

  return data;
}
