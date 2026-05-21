import type { SiteLifecycle } from "@/types/domain";

export const PAGE_SIZE = 12;

type RawParam = string | string[] | undefined;
type RawParams = Record<string, RawParam>;

export interface DirectoryParams {
  query: string;
  category: string | null;
  lifecycle: SiteLifecycle | null;
  page: number;
}

function first(value: RawParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDirectoryParams(params: RawParams): DirectoryParams {
  const query = first(params.q)?.trim() ?? "";
  const category = first(params.category)?.trim() || null;

  const rawLifecycle = first(params.lifecycle);
  const lifecycle: SiteLifecycle | null =
    rawLifecycle === "live" || rawLifecycle === "coming_soon"
      ? rawLifecycle
      : null;

  const parsedPage = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return { query, category, lifecycle, page };
}

export interface Pagination {
  from: number;
  to: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function getPagination(page: number, total: number): Pagination {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  return {
    from,
    to,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
