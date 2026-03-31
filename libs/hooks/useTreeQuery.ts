import { useQuery } from "@tanstack/react-query";
import { fetchTree } from "@/libs/api";

export const TREE_KEY = ["family-tree"] as const;

export function useTreeQuery() {
  return useQuery({
    queryKey: TREE_KEY,
    queryFn: fetchTree,
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}
