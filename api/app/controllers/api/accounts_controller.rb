class Api::AccountsController < ApplicationController
  before_action :require_admin

  def index
    render json: accounts_payload
  end

  def show
    user = find_active_account
    render json: { account: account_json(user) } if user
  end

  def create
    user, messages = User.create_staff(
      company: current_user.company,
      role: params[:role].to_s,
      login_id: params[:login_id],
      display_name: params[:display_name],
      password: params[:password],
      password_confirmation: params[:password_confirmation]
    )
    if user
      render json: { account: account_json(user) }, status: :created
    else
      render_errors(messages)
    end
  end

  def update
    user = find_active_account
    return unless user

    messages = apply_changes(user)
    if messages.any?
      render_errors(messages)
    elsif user.save
      render json: { account: account_json(user) }
    else
      render_errors(user.errors.map(&:full_message))
    end
  end

  def destroy
    user = find_active_account
    return unless user

    if user.membership.role == "admin"
      return render_errors(["管理者のアカウントは削除できません"])
    end

    user.update!(deleted_at: Time.current)
    head :no_content
  end

  private

  def find_active_account
    user = current_user.company.active_users.includes(:membership).find_by(id: params[:id])
    unless user
      render_errors(["アカウントが見つかりません"], status: :not_found)
      return nil
    end
    user
  end

  def apply_changes(user)
    messages = []
    user.display_name = params[:display_name] if params.key?(:display_name)

    if params.key?(:password) || params.key?(:password_confirmation)
      if user.membership.role == "admin"
        messages << "管理者のパスワードは、ログイン中の本人が変更します"
      else
        messages.concat(User.password_issue_messages(params[:password], params[:password_confirmation]))
        if messages.empty?
          user.password = params[:password]
          user.password_confirmation = params[:password_confirmation]
        end
      end
    end
    messages
  end

  def accounts_payload
    accounts = current_user.company.active_users.includes(:membership).sort_by do |user|
      [user.membership.role == "admin" ? 0 : 1, user.login_id.to_s, user.email.to_s]
    end
    {
      accounts: accounts.map { |user| account_json(user) },
      limit: Company.account_limit,
      active_count: accounts.size,
      login_url: FrontendUrl.join("/login/#{current_user.company.code}")
    }
  end
end
