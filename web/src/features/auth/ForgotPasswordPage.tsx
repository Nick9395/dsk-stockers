import type { FormEvent } from "react"
import { useState } from "react"
import { Link } from "react-router"
import { ApiError, api } from "../../lib/api"
import { ErrorList } from "./LoginPage"
import "./auth.css"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    setMessage("")
    try {
      const data = await api<{ message: string }>("/password", {
        method: "POST",
        body: { email },
      })
      setMessage(data.message)
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["メールを送信できませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title text-heading">パスワード再設定</h1>
        <p className="auth-page__lead">登録したメールアドレスへ再設定用のリンクを送ります。</p>
        <form className="auth-form" onSubmit={submit}>
          <ErrorList errors={errors} />
          {message ? <p role="status">{message}</p> : null}
          <label>
            メールアドレス
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button className="auth-form__submit" type="submit" disabled={submitting}>
            メールを送る
          </button>
        </form>
        <p className="auth-page__links">
          <Link to="/login">ログインへ戻る</Link>
        </p>
      </div>
    </div>
  )
}
