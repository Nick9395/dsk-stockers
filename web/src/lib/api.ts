export class ApiError extends Error {
  status: number
  errors: string[]

  constructor(status: number, errors: string[]) {
    super(errors[0] ?? "操作に失敗しました。もう一度お試しください。")
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
}

let csrfToken: string | null = null

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken

  const response = await fetch("/api/csrf", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  })
  if (!response.ok) {
    throw new ApiError(response.status, ["ページを再読み込みして、もう一度操作してください"])
  }
  const data = (await response.json()) as { csrf_token: string }
  csrfToken = data.csrf_token
  return csrfToken
}

export async function api<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const method = options.method ?? "GET"
  const headers: Record<string, string> = { Accept: "application/json" }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  if (method !== "GET") {
    headers["X-CSRF-Token"] = await ensureCsrfToken()
  }

  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.status === 403 && method !== "GET" && !retried) {
    csrfToken = null
    return api<T>(path, options, true)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const data = text ? (JSON.parse(text) as { errors?: string[] }) : null
  if (!response.ok) {
    throw new ApiError(response.status, data?.errors ?? ["操作に失敗しました。もう一度お試しください。"])
  }
  return data as T
}

export type CurrentUser = {
  user: {
    email: string | null
    login_id: string | null
    display_name: string | null
    role: "admin" | "editor" | "recorder" | null
    company_code: string | null
  }
}

export type Account = {
  id: number
  role: "admin" | "editor" | "recorder"
  email: string | null
  login_id: string | null
  display_name: string | null
}
