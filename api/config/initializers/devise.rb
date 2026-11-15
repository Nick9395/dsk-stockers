# frozen_string_literal: true

Devise.setup do |config|
  config.mailer_sender = "DSK Stockers <no-reply@localhost>"
  config.mailer = "AuthMailer"

  # JSON の認証失敗は 401 のまま返す。HTML へのリダイレクトにしない。
  config.navigational_formats = [:html]

  require "devise/orm/active_record"

  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]
  config.skip_session_storage = [:http_auth]
  config.sign_out_via = :delete
  config.responder.error_status = :unprocessable_content
  config.responder.redirect_status = :see_other

  config.password_length = 8..128
  config.timeout_in = 30.minutes
  config.reset_password_within = 6.hours

  # ロックは Devise の標準。20 回失敗でロックし、1 時間またはメールで解除する。
  config.lock_strategy = :failed_attempts
  config.unlock_strategy = :both
  config.maximum_attempts = 20
  config.unlock_in = 1.hour

  config.invite_for = 7.days
end
