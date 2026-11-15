namespace :users do
  desc "契約者へ招待メールを送る。例: bin/rails users:invite EMAIL=person@example.com"
  task invite: :environment do
    email = ENV.fetch("EMAIL", "").strip.downcase
    abort "EMAIL を指定してください。例: bin/rails users:invite EMAIL=person@example.com" if email.blank?
    abort "メールアドレスの形式を確認してください" unless email.match?(Devise.email_regexp)
    abort "このメールアドレスはすでに登録されています" if User.exists?(email: email)

    user = User.invite!(email: email)
    abort user.errors.full_messages.join("\n") if user.errors.any?

    puts "#{email} へ招待メールを送信しました"
  end
end
