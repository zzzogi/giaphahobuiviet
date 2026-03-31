import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPerson,
  updatePerson,
  deletePerson,
  PersonInput,
} from "@/libs/api";
import { TREE_KEY } from "./useTreeQuery";

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PersonInput) => createPerson(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TREE_KEY }),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonInput> }) =>
      updatePerson(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TREE_KEY }),
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TREE_KEY }),
  });
}
