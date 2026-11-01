import { Link } from "react-router"
import "./top-page.css"

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="top-page">
      <main className="top-page__main">
        <h1 className="top-page__title">{title}</h1>
        <p className="top-page__copy">準備中</p>
      </main>
      <footer className="top-page__footer">
        <Link to="/">トップへ戻る</Link>
      </footer>
    </div>
  )
}
