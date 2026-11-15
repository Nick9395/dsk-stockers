import type { FormEvent } from "react"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import { ApiError, api, type Account, type CurrentUser } from "../../lib/api"
import { ErrorList } from "../auth/LoginPage"
import { roleLabel } from "./labels"
import "../auth/auth.css"

export function AccountEditPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<CurrentUser>("/me"),
    retry: false,
  })
  const account = useQuery({
    queryKey: ["account", accountId],
    queryFn: () => api<{ account: Account }>(`/accounts/${accountId}`),
    enabled: me.data?.user.role === "admin" && accountId !== undefined,
    retry: false,
  })
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [issuedPassword, setIssuedPassword] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  const [submitting, setSubmitting] = useState(false)

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

  if (account.isPending) {
    return (
      <div className="auth-page">
        <p className="auth-page__lead">読み込み中</p>
      </div>
    )
  }

  if (account.isError || !account.data) {
    return <Navigate to="/accounts" replace />
  }

  const current = account.data.account
  const shownName = displayName ?? current.display_name ?? ""
  const isAdmin = current.role === "admin"

  async function saveName(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    setNotice("")
    try {
      const data = await api<{ account: Account }>(`/accounts/${current.id}`, {
        method: "PATCH",
        body: { display_name: shownName },
      })
      queryClient.setQueryData(["account", accountId], data)
      setDisplayName(null)
      setNotice("表示名を保存しました。")
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["表示名を保存できませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    setNotice("")
    setIssuedPassword("")
    try {
      await api(`/accounts/${current.id}`, {
        method: "PATCH",
        body: { password, password_confirmation: passwordConfirmation },
      })
      setIssuedPassword(password)
      setPassword("")
      setPasswordConfirmation("")
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["パスワードを変更できませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  async function remove() {
    if (!window.confirm("このアカウントを削除します。ログインできなくなります。")) return
    setErrors([])
    try {
      await api(`/accounts/${current.id}`, { method: "DELETE" })
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      navigate("/accounts")
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["アカウントを削除できませんでした。もう一度お試しください。"])
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title text-heading">{roleLabel[current.role]}</h1>
        <p className="auth-page__email">{current.login_id || current.email}</p>
        <ErrorList errors={errors} />
        {notice ? <p role="status">{notice}</p> : null}
        <form className="auth-form" onSubmit={saveName}>
          <label>
            表示名（任意）
            <input value={shownName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <button className="auth-form__submit" type="submit" disabled={submitting}>
            表示名を保存
          </button>
        </form>
        {isAdmin ? (
          <p className="auth-page__lead">管理者のパスワードは、ログイン中の本人が変更します。</p>
        ) : (
          <form className="auth-form" onSubmit={savePassword}>
            <h2 className="auth-form__heading">パスワードを上書き</h2>
            <label>
              新しいパスワード
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label>
              新しいパスワード（確認）
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
            </label>
            <button className="auth-form__submit" type="submit" disabled={submitting}>
              パスワードを上書き
            </button>
          </form>
        )}
        {issuedPassword ? (
          <p className="account-issued-password" role="status">
            新しいパスワードは {issuedPassword} です。この画面を離れると再表示できません。
          </p>
        ) : null}
        {isAdmin ? null : (
          <button className="auth-form__secondary" type="button" onClick={() => void remove()}>
            このアカウントを削除
          </button>
        )}
        <p className="auth-page__links">
          <Link to="/accounts">一覧へ戻る</Link>
        </p>
      </div>
    </div>
  )
}
