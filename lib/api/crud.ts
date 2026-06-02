import { request } from './request'
export interface CrudOptions {
  unwrapList?: boolean
}
export function createCrudApi<T>(resource: string, options: CrudOptions = {}) {
  const { unwrapList = true } = options

  return {
    list: () => request<T[]>(resource, { unwrapList }),

    get: (id: string | number) => request<T>(`${resource}/${id}`),

    create: (data: Partial<T>) =>
      request<T>(resource, {
        method: 'POST',
        body: data,
      }),

    update: (id: string | number, data: Partial<T>) =>
      request<T>(`${resource}/${id}`, {
        method: 'PUT',
        body: data,
      }),

    remove: (id: string | number) =>
      request<{ success: boolean }>(`${resource}/${id}`, {
        method: 'DELETE',
      }),
  }
}
