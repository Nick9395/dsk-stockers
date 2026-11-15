import type { FormEvent } from "react"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import { ApiError, api, type CurrentUser } from "../../lib/api"
import "./auth.css"

const companyCodePattern = /^[a-z0-9]{8,20}$/

export function LoginPage() {
  const { companyCode: companyCodeParam } = useParams()
  const fixedCompanyCode = companyCodeParam?.toLowerCase()
  const companyCodeIsValid = fixedCompanyCode === undefined || companyCodePattern.test(fixedCompanyCode)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<CurrentUser>("/me"),
    retry: false,
  })
  const [companyCode, setCompanyCode] = useState("")
  const [loginId, setLoginId] = useState("")
  const [staffPassword, setStaffPassword] = useState("")
  const [staffErrors, setStaffErrors] = useState<string[]>([])
  const [staffSubmitting, setStaffSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [ownerErrors, setOwnerErrors] = useState<string[]>([])
  const [ownerSubmitting, setOwnerSubmitting] = useState(false)

  if (me.isSuccess) {
    return <Navigate to="/home" replace />
  }

  async function signIn(body: Record<string, string>, setErrors: (errors: string[]) => void, setSubmitting: (value: boolean) => void) {
    setSubmitting(true)
    setErrors([])
    try {
      const data = await api<CurrentUser>("/session", { method: "POST", body })
      queryClient.setQueryData(["me"], data)
      navigate("/home")
    } catch (error) {
      setErrors(error instanceof ApiError ? error.errors : ["ログインできませんでした。もう一度お試しください。"])
    } finally {
      setSubmitting(false)
    }
  }

  function submitStaff(event: FormEvent) {
    event.preventDefault()
    void signIn(
      {
        company_code: fixedCompanyCode ?? companyCode,
        login_id: loginId,
        password: staffPassword,
      },
      setStaffErrors,
      setStaffSubmitting,
    )
  }

  function submitOwner(event: FormEvent) {
    event.preventDefault()
    void signIn({ email, password }, setOwnerErrors, setOwnerSubmitting)
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title text-heading">ログイン</h1>
        {me.isPending ? (
          <p className="auth-page__lead">読み込み中</p>
        ) : fixedCompanyCode !== undefined && !companyCodeIsValid ? (
          <div className="auth-form">
            <p className="auth-page__lead">このアドレスの会社コードは正しくありません。</p>
            <p className="auth-page__links">
              <Link to="/login">ログイン画面を開く</Link>
            </p>
          </div>
        ) : (
          <>
            <form className="auth-form" onSubmit={submitStaff}>
              <h2 className="auth-form__heading">担当者・記録者</h2>
              <ErrorList errors={staffErrors} />
              {fixedCompanyCode === undefined ? (
                <label>
                  会社コード
                  <input
                    autoCapitalize="none"
                    autoComplete="organization"
                    value={companyCode}
                    onChange={(event) => setCompanyCode(event.target.value)}
                    required
                  />
                </label>
              ) : null}
              <label>
                アカウントID
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  required
                />
              </label>
              <label>
                パスワード
                <input
                  type="password"
                  autoComplete="current-password"
                  value={staffPassword}
                  onChange={(event) => setStaffPassword(event.target.value)}
                  required
                />
              </label>
              <button className="auth-form__submit" type="submit" disabled={staffSubmitting}>
                ログイン
              </button>
            </form>
            {fixedCompanyCode === undefined ? (
              <form className="auth-form" onSubmit={submitOwner}>
                <h2 className="auth-form__heading">契約者</h2>
                <ErrorList errors={ownerErrors} />
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
                <label>
                  パスワード
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
                <button className="auth-form__submit" type="submit" disabled={ownerSubmitting}>
                  ログイン
                </button>
                <p className="auth-page__links">
                  <Link to="/password/forgot">パスワードを忘れた場合</Link>
                </p>
              </form>
            ) : (
              <p className="auth-page__links">
                <Link to="/login">契約者のログイン</Link>
              </p>
            )}
          </>
        )}
        <p className="auth-page__links">
          <Link to="/">トップへ戻る</Link>
        </p>
      </div>
    </div>
  )
}

export function ErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  return (
    <ul className="auth-form__errors" role="alert">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  )
}
