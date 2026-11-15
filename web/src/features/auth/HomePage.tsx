import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Navigate, useNavigate } from "react-router"
import { api, type CurrentUser } from "../../lib/api"
import { roleLabel } from "../users/labels"
import "./auth.css"

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<CurrentUser>("/me"),
    retry: false,
  })

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
  const name = user.display_name || user.login_id || user.email

  async function logout() {
    await api("/session", { method: "DELETE" })
    queryClient.removeQueries({ queryKey: ["me"] })
    navigate("/")
  }

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <h1 className="auth-page__title text-heading">DSK Stockers</h1>
        <p className="auth-page__email">{name}</p>
        <p className="auth-page__meta">{user.role ? roleLabel[user.role] : ""}</p>
        <p className="auth-page__meta">会社コード {user.company_code}</p>
        <div className="auth-form">
          {user.role === "admin" ? (
            <Link className="auth-form__submit" to="/accounts">
              アカウント管理
            </Link>
          ) : null}
          <Link className="auth-form__secondary" to="/account">
            表示名とパスワード
          </Link>
          <button className="auth-form__secondary" type="button" onClick={() => void logout()}>
            ログアウト
          </button>
        </div>
        <p className="auth-page__links">
          <Link to="/">トップへ戻る</Link>
        </p>
      </div>
    </div>
  )
}
