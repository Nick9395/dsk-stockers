import type { FormEvent } from "react"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useSearchParams } from "react-router"
import { ApiError, api, type CurrentUser } from "../../lib/api"
import { ErrorList } from "./LoginPage"
import "./auth.css"

const invalidLink = ["この招待リンクは無効です。運営者に招待を依頼してください。"]

export function InvitationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("invitation_token") ?? ""
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const invitation = useQuery({
    queryKey: ["invitation", token],
    enabled: token.length > 0,
    retry: false,
    queryFn: () => api<{ email: string }>(`/invitation?invitation_token=${encodeURIComponent(token)}`),
  })
  const [companyCode, setCompanyCode] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      const data = await api<CurrentUser>("/invitation", {
        method: "PUT",
        body: {
          invitation_token: token,
          company_code: companyCode,
          password,
          password_confirmation: passwordConfirmation,
        },
      })
      queryClient.setQueryData(["me"], data)
      navigate("/home")
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["登録できませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  const loadErrors = token.length === 0 ? invalidLink : invitation.isError && invitation.error instanceof ApiError ? invitation.error.errors : []

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title text-heading">利用開始</h1>
        {invitation.isPending && token.length > 0 ? (
          <p className="auth-page__lead">読み込み中</p>
        ) : loadErrors.length > 0 ? (
          <>
            <ErrorList errors={loadErrors} />
            <p className="auth-page__links">
              <Link to="/">トップへ戻る</Link>
            </p>
          </>
        ) : (
          <>
            <p className="auth-page__lead">招待されたメールアドレスで登録します。</p>
            <form className="auth-form" onSubmit={submit}>
              <ErrorList errors={errors} />
              <label>
                メールアドレス
                <input type="email" value={invitation.data?.email ?? ""} readOnly />
              </label>
              <label>
                会社コード
                <input
                  value={companyCode}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(event) => setCompanyCode(event.target.value)}
                  required
                />
              </label>
              <p className="auth-page__meta">8文字以上20文字以内の半角英小文字と数字</p>
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
                登録してはじめる
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
