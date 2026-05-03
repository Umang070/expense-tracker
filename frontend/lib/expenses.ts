import type { ExpenseRow } from "@/components/expenses/expenses-table";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("expense_tracker_token") ??
    localStorage.getItem("user_token")
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const data = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;
  return data?.message ?? `Request failed (${response.status}).`;
}

export type ApiExpense = {
  id: number;
  userId: number;
  amount: string | number;
  category: string;
  paymentMethod: string;
  description: string | null;
  receiptName: string | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export function mapApiExpenseToRow(record: ApiExpense): ExpenseRow {
  return {
    id: String(record.id),
    amount: Number(record.amount),
    category: record.category,
    paymentMethod: record.paymentMethod,
    description: record.description ?? "",
    date: record.date,
    receiptName: record.receiptName ?? undefined,
  };
}

export type ListExpensesResponse = {
  data: ApiExpense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function listExpenses(params?: {
  page?: number;
  limit?: number;
}): Promise<ListExpensesResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}/api/expenses?${query}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as ListExpensesResponse;
}

export type CreateExpensePayload = {
  amount: number;
  category: string;
  paymentMethod: string;
  description?: string;
  date: string;
  receiptName?: string | null;
};

export async function createExpense(
  payload: CreateExpensePayload
): Promise<ApiExpense> {
  const response = await fetch(`${API_BASE_URL}/api/expenses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      amount: payload.amount,
      category: payload.category,
      paymentMethod: payload.paymentMethod,
      description: payload.description ?? "",
      date: payload.date,
      receiptName: payload.receiptName ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as ApiExpense;
}

export type UpdateExpensePayload = Partial<{
  amount: number;
  category: string;
  paymentMethod: string;
  description: string;
  date: string;
  receiptName: string | null;
}>;

export async function updateExpense(
  id: number,
  payload: UpdateExpensePayload
): Promise<ApiExpense> {
  const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as ApiExpense;
}

export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await parseErrorMessage(response));
  }
}
