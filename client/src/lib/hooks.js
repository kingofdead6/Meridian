import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { errorMessage } from './api';

export function useList(resource, params = {}, options = {}) {
  return useQuery({
    queryKey: [resource, params],
    queryFn: () => api.get(`/${resource}`, { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useRecord(path, options = {}) {
  return useQuery({
    queryKey: [path.split('/')[0], 'record', path],
    queryFn: () => api.get(`/${path}`).then((r) => r.data),
    enabled: Boolean(path) && !path.endsWith('/new'),
    ...options,
  });
}

/** Options for selects: every record of a resource (up to 500). */
export function useOptions(resource, params = {}, enabled = true) {
  const q = useList(resource, { limit: 500, ...params }, { enabled, staleTime: 60_000 });
  return q.data?.data || q.data || [];
}

/** Wraps a mutation with toasts and a full cache refresh, since documents touch many modules. */
export function useAction(fn, { success, onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (data, vars) => {
      await qc.invalidateQueries();
      if (success) toast.success(typeof success === 'function' ? success(data, vars) : success);
      onSuccess?.(data, vars);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
