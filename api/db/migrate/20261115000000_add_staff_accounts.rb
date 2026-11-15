class AddStaffAccounts < ActiveRecord::Migration[8.1]
  def change
    change_column_null :users, :email, true
    change_column_default :users, :email, from: "", to: nil

    change_table :users, bulk: true do |t|
      t.string :login_id
      t.string :display_name
      t.datetime :deleted_at
    end

    add_index :users, :login_id
  end
end
