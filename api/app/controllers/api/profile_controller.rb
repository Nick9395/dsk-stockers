class Api::ProfileController < ApplicationController
  before_action :require_active_user

  def update
    user = current_user
    messages = []
    user.display_name = params[:display_name] if params.key?(:display_name)

    changing_password = params.key?(:password) || params.key?(:password_confirmation) || params.key?(:current_password)
    if changing_password
      messages << "現在のパスワードが正しくありません" unless user.valid_password?(params[:current_password].to_s)
      messages.concat(User.password_issue_messages(params[:password], params[:password_confirmation]))
      if messages.empty?
        user.password = params[:password]
        user.password_confirmation = params[:password_confirmation]
      end
    end

    if messages.empty? && user.save
      render json: user_payload(user)
    else
      messages.concat(user.errors.map(&:full_message)) unless user.errors.empty?
      render_errors(messages.uniq)
    end
  end
end
