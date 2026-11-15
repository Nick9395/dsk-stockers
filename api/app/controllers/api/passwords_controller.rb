class Api::PasswordsController < ApplicationController
  SENT_MESSAGE = "メールを送信しました。届いたリンクからパスワードを再設定してください。"

  def create
    email = params[:email].to_s.strip
    if email.blank?
      return render_errors(["メールアドレスを入力してください"])
    end

    user = User.find_by(email: email.downcase)
    user.send_reset_password_instructions if user&.invitation_accepted?
    render json: { message: SENT_MESSAGE }
  end

  def update
    user = User.reset_password_by_token(
      reset_password_token: params[:reset_password_token],
      password: params[:password],
      password_confirmation: params[:password_confirmation]
    )

    if user.errors.empty?
      sign_in(:user, user)
      render json: user_payload(user)
    else
      render_errors(password_reset_errors(user))
    end
  end

  private

  def password_reset_errors(user)
    messages = user.errors.map(&:full_message)
    if user.errors[:reset_password_token].any?
      ["この再設定リンクは無効です。もう一度メールの送信からやり直してください。"]
    else
      messages.presence || ["パスワードを再設定できませんでした。入力内容を確認してください。"]
    end
  end
end
