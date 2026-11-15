class Api::SessionsController < ApplicationController
  def show
    if current_user && current_user.deleted_at.nil?
      render json: user_payload(current_user)
    else
      sign_out(:user) if current_user
      head :unauthorized
    end
  end

  def create
    if params[:login_id].present? || params[:company_code].present?
      create_with_login_id
    else
      create_with_email
    end
  end

  def destroy
    sign_out(:user)
    head :no_content
  end

  private

  def create_with_email
    user = User.find_for_database_authentication(email: params[:email])
    user = nil if user&.deleted_at
    authenticate(user, params[:password], "メールアドレスかパスワードが正しくありません")
  end

  def create_with_login_id
    code = params[:company_code].to_s.strip.downcase
    login_id = params[:login_id].to_s.strip.downcase
    company = Company.find_by(code: code)
    user = company&.active_users&.find_by(login_id: login_id)
    authenticate(user, params[:password], "会社コード、アカウントID、パスワードのいずれかが正しくありません")
  end

  def authenticate(user, password, failure_message)
    if user&.access_locked?
      return render_errors(["ログインの失敗が続いたため、アカウントをロックしました"], status: :unauthorized)
    end

    authenticated = user&.valid_for_authentication? { user.valid_password?(password) }
    if authenticated
      sign_in(:user, user)
      render json: user_payload(user)
    elsif user&.access_locked?
      render_errors(["ログインの失敗が続いたため、アカウントをロックしました"], status: :unauthorized)
    else
      render_errors([failure_message], status: :unauthorized)
    end
  end
end
