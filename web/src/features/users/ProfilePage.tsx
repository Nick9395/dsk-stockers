import type { FormEvent } from "react"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Navigate } from "react-router"
import { ApiError, api, type CurrentUser } from "../../lib/api"
import { ErrorList } from "../auth/LoginPage"
import "../auth/auth.css"

export function ProfilePage() {
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<CurrentUser>("/me"),
    retry: false,
  })
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
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

  const user = me.data.user
  const shownName = displayName ?? user.display_name ?? ""

  async function saveName(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    setNotice("")
    try {
      const data = await api<CurrentUser>("/profile", {
        method: "PATCH",
        body: { display_name: shownName },
      })
      queryClient.setQueryData(["me"], data)
      setDisplayName(null)
      setNotice("表示名を保存しました。")
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
    try {
      const data = await api<CurrentUser>("/profile", {
        method: "PATCH",
        body: {
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        },
      })
      queryClient.setQueryData(["me"], data)
      setCurrentPassword("")
      setPassword("")
      setPasswordConfirmation("")
      setNotice("パスワードを変更しました。")
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["パスワードを変更できませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title text-heading">表示名とパスワード</h1>
        <p className="auth-page__email">{user.login_id || user.email}</p>
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
        <form className="auth-form" onSubmit={savePassword}>
          <h2 className="auth-form__heading">パスワードを変更</h2>
          <label>
            現在のパスワード
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
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
            パスワードを変更
          </button>
        </form>
        <p className="auth-page__links">
          <Link to="/home">ホームへ戻る</Link>
        </p>
      </div>
    </div>
  )
}
