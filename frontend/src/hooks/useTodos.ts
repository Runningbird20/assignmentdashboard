import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import * as todosApi from "@/api/todos";
import type { Todo, TodoPayload } from "@/types";

function invalidateTodoData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["todos"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useTodos() {
  return useQuery({ queryKey: ["todos"], queryFn: todosApi.fetchTodos });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TodoPayload) => todosApi.createTodo(payload),
    onSuccess: () => invalidateTodoData(queryClient),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<TodoPayload> }) =>
      todosApi.updateTodo(id, payload),
    onSuccess: () => invalidateTodoData(queryClient),
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => todosApi.deleteTodo(id),
    onSuccess: () => invalidateTodoData(queryClient),
  });
}

export function useReorderTodos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => todosApi.reorderTodos(ids),
    // Optimistically reorder the cached list so the drop feels instant.
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      if (previous) {
        const byId = new Map(previous.map((todo) => [todo.id, todo]));
        queryClient.setQueryData(
          ["todos"],
          ids
            .map((id) => byId.get(id))
            .filter((todo): todo is Todo => todo !== undefined),
        );
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(["todos"], context.previous);
    },
    onSettled: () => invalidateTodoData(queryClient),
  });
}
