class Company < ApplicationRecord
  has_many :memberships, dependent: :restrict_with_exception
  has_many :users, through: :memberships

  ACCOUNT_LIMIT = 100

  def self.account_limit
    ACCOUNT_LIMIT
  end

  def active_users
    users.where(deleted_at: nil)
  end

  normalizes :code, with: ->(code) { code.to_s.strip.downcase }

  validate :code_must_be_available

  private

  def code_must_be_available
    if code.blank?
      errors.add(:base, "会社コードを入力してください")
    elsif !code.match?(/\A[a-z0-9]{8,20}\z/)
      errors.add(:base, "会社コードは8文字以上20文字以内の半角英小文字と数字で入力してください")
    elsif self.class.where(code: code).where.not(id: id).exists?
      errors.add(:base, "この会社コードはすでに使われています")
    end
  end
end
