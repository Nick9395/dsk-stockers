import { Route, Routes } from "react-router"
import { PlaceholderPage } from "./features/home/PlaceholderPage"
import { TopPage } from "./features/home/TopPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/login" element={<PlaceholderPage title="ログイン" />} />
      <Route path="/terms" element={<PlaceholderPage title="利用規約" />} />
      <Route path="/privacy" element={<PlaceholderPage title="プライバシーポリシー" />} />
    </Routes>
  )
}
