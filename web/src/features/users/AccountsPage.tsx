import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Navigate } from "react-router"
import QRCode from "qrcode"
import { ApiError, api, type Account, type CurrentUser } from "../../lib/api"
import { ErrorList } from "../auth/LoginPage"
import { roleLabel } from "./labels"
import "../auth/auth.css"

type AccountList = {
  accounts: Account[]
  limit: number
  active_count: number
  login_url: string
}

export function AccountsPage() {
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<CurrentUser>("/me"),
    retry: false,
  })
  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountList>("/accounts"),
    enabled: me.data?.user.role === "admin",
    retry: false,
  })
  const [role, setRole] = useState<"editor" | "recorder">("recorder")
  const [loginId, setLoginId] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  if (me.isPending) {
    return (
      <div className="auth-page">
        <p className="auth-page__lead">読み込み中</p>
      </div>
    )
  }

  if (me.isError || !me.data) {
    return <Navigate to="/login" replace />
  }

  if (me.data.user.role !== "admin") {
    return <Navigate to="/home" replace />
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      await api("/accounts", {
        method: "POST",
        body: {
          role,
          login_id: loginId,
          display_name: displayName,
          password,
          password_confirmation: passwordConfirmation,
        },
      })
      setLoginId("")
      setDisplayName("")
      setPassword("")
      setPasswordConfirmation("")
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["アカウントを発行できませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  async function copyLoginUrl() {
    if (!accounts.data) return
    await navigator.clipboard.writeText(accounts.data.login_url)
    setCopied(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel auth-page__panel--wide">
        <h1 className="auth-page__title text-heading">アカウント管理</h1>
        {accounts.isPending ? (
          <p className="auth-page__lead">読み込み中</p>
        ) : accounts.isError || !accounts.data ? (
          <p className="auth-page__lead">アカウント一覧を読み込めませんでした。</p>
        ) : (
          <>
            <p className="auth-page__meta">
              {accounts.data.active_count} / {accounts.data.limit} 件
            </p>
            <section className="account-login-link">
              <h2 className="auth-form__heading">倉庫の端末用ログイン</h2>
              <p className="auth-page__lead">このアドレスでは、会社コードの入力が省略されます。</p>
              <p className="account-login-link__url">{accounts.data.login_url}</p>
              <button className="auth-form__secondary" type="button" onClick={() => void copyLoginUrl()}>
                {copied ? "コピーしました" : "アドレスをコピー"}
              </button>
              <LoginQr url={accounts.data.login_url} />
            </section>
            <ul className="account-list">
              {accounts.data.accounts.map((account) => (
                <li key={account.id}>
                  <Link to={`/accounts/${account.id}`}>
                    <span>{roleLabel[account.role]}</span>
                    <strong>{account.display_name || account.login_id || account.email}</strong>
                    {account.login_id ? <small>{account.login_id}</small> : null}
                  </Link>
                </li>
              ))}
            </ul>
            <form className="auth-form" onSubmit={submit}>
              <h2 className="auth-form__heading">アカウントを発行</h2>
              <ErrorList errors={errors} />
              <label>
                役割
                <select value={role} onChange={(event) => setRole(event.target.value as "editor" | "recorder")}>
                  <option value="recorder">記録者</option>
                  <option value="editor">担当者</option>
                </select>
              </label>
              <label>
                アカウントID
                <input
                  autoCapitalize="none"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  required
                />
              </label>
              <label>
                表示名（任意）
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label>
                初期パスワード
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <label>
                初期パスワード（確認）
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  required
                />
              </label>
              <button className="auth-form__submit" type="submit" disabled={submitting}>
                発行する
              </button>
            </form>
          </>
        )}
        <p className="auth-page__links">
          <Link to="/home">ホームへ戻る</Link>
        </p>
      </div>
    </div>
  )
}

function LoginQr({ url }: { url: string }) {
  const [src, setSrc] = useState("")

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(url, { margin: 1, width: 240 }).then((value) => {
      if (active) setSrc(value)
    })
    return () => {
      active = false
    }
  }, [url])

  if (!src) return null
  return <img className="account-login-link__qr" src={src} alt="倉庫の端末用ログインのQRコード" />
}
