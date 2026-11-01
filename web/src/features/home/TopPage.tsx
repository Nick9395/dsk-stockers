import { Link } from "react-router"
import logo from "../../assets/logo.webp"
import "./top-page.css"

export function TopPage() {
  return (
    <div className="top-page">
      <main className="top-page__main">
        <img
          className="top-page__logo rise rise-1"
          src={logo}
          width={400}
          height={400}
          alt=""
        />
        <div className="top-page__body">
          <p className="top-page__lead rise rise-2">
            <span>どこでも誰でも</span>
            <span>倉庫管理が</span>
            <span>簡単にできる</span>
          </p>
          <h1 className="top-page__title text-heading rise rise-3">DSK Stockers</h1>
          <p className="top-page__tagline rise rise-4">備品持出ログ × データ分析</p>
          <Link className="top-page__login rise rise-5" to="/login">
            ログイン
          </Link>
        </div>
      </main>
      <div className="top-page__rule" aria-hidden="true" />
      <footer className="top-page__footer">
        <Link to="/terms">利用規約</Link>
        <Link to="/privacy">プライバシーポリシー</Link>
      </footer>
    </div>
  )
}
