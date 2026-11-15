class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection

  protect_from_forgery with: :exception
  # API コントローラはテスト環境の無効化を自動では引き継がない。
  self.allow_forgery_protection = Rails.application.config.action_controller.allow_forgery_protection

  rescue_from ActionController::InvalidAuthenticityToken do
    render json: { errors: ["ページを再読み込みして、もう一度操作してください"] }, status: :forbidden
  end

  private

  def render_errors(messages, status: :unprocessable_entity)
    render json: { errors: Array(messages) }, status: status
  end

  def user_payload(user)
    {
      user: {
        email: user.email,
        login_id: user.login_id,
        display_name: user.display_name,
        role: user.membership&.role,
        company_code: user.company&.code
      }
    }
  end

  def account_json(user)
    {
      id: user.id,
      role: user.membership.role,
      email: user.email,
      login_id: user.login_id,
      display_name: user.display_name
    }
  end

  def require_active_user
    return if current_user&.deleted_at.nil?

    sign_out(:user) if current_user
    head :unauthorized
  end

  def require_admin
    require_active_user
    return if performed?
    return if current_user.membership&.role == "admin"

    render_errors(["この操作は管理者だけが実行できます"], status: :forbidden)
  end
end
