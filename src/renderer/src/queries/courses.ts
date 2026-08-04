import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Course, NewCourse } from "@shared/types";

const KEY = ["courses"] as const;

export function useCourses() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.courses.list() });
}

export function useAddCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<NewCourse> & { title: string }) => window.api.courses.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<NewCourse> }) => window.api.courses.update(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRemoveCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.courses.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRestoreDefaultCourses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.courses.restoreDefaults(),
    onSuccess: (data: Course[]) => qc.setQueryData(KEY, data)
  });
}
