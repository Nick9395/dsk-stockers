import type { FormEvent } from "react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useSearchParams } from "react-router"
import { ApiError, api, type CurrentUser } from "../../lib/api"
import { ErrorList } from "./LoginPage"
import "./auth.css"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("reset_password_token") ?? ""
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [errors, setErrors] = useState<string[]>(token ? [] : ["この再設定リンクは無効です。もう一度メールの送信からやり直してください。"])
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      const data = await api<CurrentUser>("/password", {
        method: "PUT",
        body: {
          reset_password_token: token,
          password,
          password_confirmation: passwordConfirmation,
        },
      })
      queryClient.setQueryData(["me"], data)
      navigate("/home")
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["パスワードを再設定できませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title text-heading">新しいパスワード</h1>
        {token ? (
          <form className="auth-form" onSubmit={submit}>
            <ErrorList errors={errors} />
            <label>
              パスワード
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label>
              パスワード（確認）
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
            </label>
            <button className="auth-form__submit" type="submit" disabled={submitting}>
              パスワードを設定する
            </button>
          </form>
        ) : (
          <ErrorList errors={errors} />
        )}
        <p className="auth-page__links">
          <Link to="/password/forgot">メールの送信からやり直す</Link>
        </p>
      </div>
    </div>
  )
}
