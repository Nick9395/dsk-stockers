class AuthMailer < Devise::Mailer
  def invitation_instructions(record, token, opts = {})
    @accept_url = FrontendUrl.join("/invitation/accept?invitation_token=#{CGI.escape(token)}")
    super
  end

  def reset_password_instructions(record, token, opts = {})
    @reset_url = FrontendUrl.join("/password/reset?reset_password_token=#{CGI.escape(token)}")
    super
  end
end
