import { api } from "@/api/client";
import type { Todo, TodoPayload } from "@/types";

export const fetchTodos = () => api.get<Todo[]>("/todos");

export const createTodo = (payload: TodoPayload) => api.post<Todo>("/todos", payload);

export const updateTodo = (id: number, payload: Partial<TodoPayload>) =>
  api.put<Todo>(`/todos/${id}`, payload);

export const deleteTodo = (id: number) => api.delete(`/todos/${id}`);

export const reorderTodos = (ids: number[]) =>
  api.put<Todo[]>("/todos/reorder", { ids });
