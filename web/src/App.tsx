import { Route, Routes } from "react-router"
import { ForgotPasswordPage } from "./features/auth/ForgotPasswordPage"
import { HomePage } from "./features/auth/HomePage"
import { InvitationPage } from "./features/auth/InvitationPage"
import { LoginPage } from "./features/auth/LoginPage"
import { ResetPasswordPage } from "./features/auth/ResetPasswordPage"
import { PlaceholderPage } from "./features/home/PlaceholderPage"
import { TopPage } from "./features/home/TopPage"
import { AccountEditPage } from "./features/users/AccountEditPage"
import { AccountsPage } from "./features/users/AccountsPage"
import { ProfilePage } from "./features/users/ProfilePage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/:companyCode" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/accounts/:accountId" element={<AccountEditPage />} />
      <Route path="/account" element={<ProfilePage />} />
      <Route path="/invitation/accept" element={<InvitationPage />} />
      <Route path="/password/forgot" element={<ForgotPasswordPage />} />
      <Route path="/password/reset" element={<ResetPasswordPage />} />
      <Route path="/terms" element={<PlaceholderPage title="利用規約" />} />
      <Route path="/privacy" element={<PlaceholderPage title="プライバシーポリシー" />} />
    </Routes>
  )
}
