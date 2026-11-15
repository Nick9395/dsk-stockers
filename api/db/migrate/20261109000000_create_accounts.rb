class CreateAccounts < ActiveRecord::Migration[8.1]
  def change
    create_table :companies do |t|
      t.string :code, null: false
      t.timestamps
    end
    add_index :companies, :code, unique: true

    create_table :users do |t|
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.integer :failed_attempts, null: false, default: 0
      t.string :unlock_token
      t.datetime :locked_at
      t.timestamps null: false
    end
    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :unlock_token, unique: true

    create_table :memberships do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.references :company, null: false, foreign_key: true
      t.string :role, null: false
      t.timestamps
    end

    # 招待そのものは利用者の行を作る前にここに置く。
    create_table :devise_invitations do |t|
      t.string :invitation_token
      t.datetime :invitation_created_at
      t.datetime :invitation_sent_at
      t.datetime :invitation_accepted_at
      t.datetime :superseded_at
      t.string :superseded_reason
      t.datetime :revoked_at
      t.datetime :resource_created_at
      t.json :invite_key, null: false, default: {}
      t.string :invite_key_digest, null: false
      t.references :invitable, polymorphic: true
      t.references :invited_by, polymorphic: true
      t.timestamps
    end
    add_index :devise_invitations, :invitation_token, unique: true
    add_index :devise_invitations, [:invitable_type, :invite_key_digest],
      name: "index_devise_invitations_on_type_and_invite_key"
  end
end
