class Api::InvitationsController < ApplicationController
  def show
    invited = invited_user
    if invited
      render json: { email: invited.email }
    else
      render_errors(["この招待リンクは無効です。運営者に招待を依頼してください。"])
    end
  end

  def update
    invited = invited_user
    unless invited
      return render_errors(["この招待リンクは無効です。運営者に招待を依頼してください。"])
    end

    company = Company.new(code: params[:company_code])
    messages = company_and_password_errors(company)
    return render_errors(messages) if messages.any?

    accepted = nil
    begin
      ActiveRecord::Base.transaction do
        accepted = User.accept_invitation!(
          invitation_token: invitation_token,
          password: params[:password],
          password_confirmation: params[:password_confirmation]
        )
        if accepted.errors.any?
          messages = accepted.errors.map(&:full_message)
          raise ActiveRecord::Rollback
        end

        company.save!
        Membership.create!(user: accepted, company: company, role: "admin")
      end
    rescue ActiveRecord::RecordNotUnique
      return render_errors(["この会社コードはすでに使われています"])
    end

    if accepted.nil? || accepted.errors.any?
      return render_errors(messages.presence || ["この招待リンクは無効です。運営者に招待を依頼してください。"])
    end

    accepted.reload
    sign_in(:user, accepted)
    render json: user_payload(accepted)
  end

  private

  def invitation_token
    params[:invitation_token].to_s
  end

  def invited_user
    User.find_by_invitation_token(invitation_token, true)
  end

  def company_and_password_errors(company)
    company.validate
    messages = company.errors.map(&:full_message)
    password = params[:password].to_s
    confirmation = params[:password_confirmation].to_s

    if password.blank?
      messages << "パスワードを入力してください"
    elsif password.length < Devise.password_length.min
      messages << "パスワードは#{Devise.password_length.min}文字以上にしてください"
    end
    messages << "パスワード（確認）が一致しません" if password != confirmation
    messages
  end
end
