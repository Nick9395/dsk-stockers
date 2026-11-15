class User < ApplicationRecord
  devise :database_authenticatable, :recoverable, :lockable, :timeoutable,
         :validatable, :invitable

  has_one :membership, dependent: :destroy
  has_one :company, through: :membership

  # 作成前の一意チェックに使う。所属は membership 側に保存する。
  attr_accessor :joining_company

  normalizes :login_id, with: ->(login_id) { login_id.to_s.strip.downcase.presence }
  normalizes :display_name, with: ->(display_name) { display_name.to_s.strip.presence }

  before_validation :clear_blank_email
  validate :login_id_must_be_available, if: -> { new_record? || will_save_change_to_login_id? }
  validate :display_name_must_be_short

  def self.password_issue_messages(password, confirmation)
    messages = []
    password = password.to_s
    confirmation = confirmation.to_s

    if password.blank?
      messages << "パスワードを入力してください"
    elsif password.length < Devise.password_length.min
      messages << "パスワードは#{Devise.password_length.min}文字以上にしてください"
    elsif password.length > Devise.password_length.max
      messages << "パスワードは#{Devise.password_length.max}文字以内にしてください"
    end
    messages << "パスワード（確認）が一致しません" if password != confirmation
    messages
  end

  def self.create_staff(company:, role:, login_id:, display_name:, password:, password_confirmation:)
    messages = []
    messages << "役割を選択してください" unless Membership::ISSUE_ROLES.include?(role)
    messages.concat(password_issue_messages(password, password_confirmation))
    return [nil, messages] if messages.any?

    company.with_lock do
      if company.active_users.count >= Company.account_limit
        next [nil, ["アカウントは#{Company.account_limit}件までです"]]
      end

      user = new(
        login_id: login_id,
        display_name: display_name,
        password: password,
        password_confirmation: password_confirmation
      )
      user.joining_company = company
      unless user.valid?
        next [nil, user.errors.map(&:full_message)]
      end

      user.save!
      Membership.create!(user: user, company: company, role: role)
      [user, []]
    end
  end

  # 担当者と記録者はメールを持たない。契約者だけ必須。
  def email_required?
    login_id.blank?
  end

  # メールがないアカウントは、ロック解除メールを送らず時間で解除する。
  def lock_access!(opts = {})
    super(email.present? ? opts : opts.merge(send_instructions: false))
  end

  private

  def login_id_must_be_available
    return if login_id.blank? && email.present?

    if login_id.blank?
      errors.add(:base, "アカウントIDを入力してください")
    elsif !login_id.match?(/\A[a-z0-9]{8,20}\z/)
      errors.add(:base, "アカウントIDは8文字以上20文字以内の半角英小文字と数字で入力してください")
    elsif duplicate_login_id?
      errors.add(:base, "このアカウントIDはすでに使われています")
    end
  end

  def duplicate_login_id?
    company = joining_company
    return false if company.nil?

    company.active_users.where(login_id: login_id).where.not(id: id).exists?
  end

  def clear_blank_email
    self.email = nil if email.blank?
  end

  def display_name_must_be_short
    return if display_name.nil? || display_name.length <= 50

    errors.add(:base, "表示名は50文字以内で入力してください")
  end
end
