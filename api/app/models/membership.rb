class Membership < ApplicationRecord
  ROLES = %w[admin editor recorder].freeze
  ISSUE_ROLES = %w[editor recorder].freeze

  belongs_to :user
  belongs_to :company

  validates :role, inclusion: { in: ROLES }
  validates :user_id, uniqueness: true
end
