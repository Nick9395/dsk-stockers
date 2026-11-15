require "test_helper"

class AccountsTest < ActionDispatch::IntegrationTest
  test "管理者が担当者を発行し、会社コードとアカウントIDでログインできる" do
    accept_owner("owner@example.com", "warehouse1")

    post "/api/accounts", params: {
      role: "recorder",
      login_id: " Ward0001 ",
      display_name: " 3階病棟 ",
      password: "password12",
      password_confirmation: "password12"
    }, as: :json
    assert_response :created
    body = response.parsed_body["account"]
    assert_equal "recorder", body["role"]
    assert_equal "ward0001", body["login_id"]
    assert_equal "3階病棟", body["display_name"]
    assert_nil body["email"]

    delete "/api/session"
    post "/api/session", params: {
      company_code: "WAREHOUSE1",
      login_id: "WARD0001",
      password: "password12"
    }, as: :json
    assert_response :success
    assert_equal "ward0001", response.parsed_body.dig("user", "login_id")
    assert_equal "recorder", response.parsed_body.dig("user", "role")
    assert_equal "warehouse1", response.parsed_body.dig("user", "company_code")
  end

  test "別の会社では同じアカウントIDを使える" do
    accept_owner("first@example.com", "warehouse1")
    issue_recorder("ward0001")
    delete "/api/session"

    accept_owner("second@example.com", "warehouse2")
    post "/api/accounts", params: {
      role: "editor",
      login_id: "ward0001",
      password: "password12",
      password_confirmation: "password12"
    }, as: :json
    assert_response :created
  end

  test "削除したアカウントは上限に含めず、同じIDを再発行できる" do
    accept_owner("owner@example.com", "warehouse1")
    stub_const(Company, :ACCOUNT_LIMIT, 2) do
      issue_recorder("ward0001")
      post "/api/accounts", params: staff_params("ward0002"), as: :json
      assert_response :unprocessable_entity
      assert_includes response.parsed_body["errors"], "アカウントは2件までです"

      account_id = User.find_by(login_id: "ward0001").id
      delete "/api/accounts/#{account_id}"
      assert_response :no_content

      post "/api/session", params: {
        company_code: "warehouse1",
        login_id: "ward0001",
        password: "password12"
      }, as: :json
      assert_response :unauthorized

      post "/api/accounts", params: staff_params("ward0001"), as: :json
      assert_response :created
    end
  end

  test "担当者はアカウントを発行できず、本人は表示名とパスワードを変更できる" do
    accept_owner("owner@example.com", "warehouse1")
    issue_recorder("ward0001")
    delete "/api/session"
    post "/api/session", params: {
      company_code: "warehouse1",
      login_id: "ward0001",
      password: "password12"
    }, as: :json
    assert_response :success

    post "/api/accounts", params: staff_params("ward0002"), as: :json
    assert_response :forbidden

    patch "/api/profile", params: { display_name: "南病棟" }, as: :json
    assert_response :success
    assert_equal "南病棟", response.parsed_body.dig("user", "display_name")

    patch "/api/profile", params: {
      current_password: "wrong-password",
      password: "newpassword12",
      password_confirmation: "newpassword12"
    }, as: :json
    assert_response :unprocessable_entity

    patch "/api/profile", params: {
      current_password: "password12",
      password: "newpassword12",
      password_confirmation: "newpassword12"
    }, as: :json
    assert_response :success

    delete "/api/session"
    post "/api/session", params: {
      company_code: "warehouse1",
      login_id: "ward0001",
      password: "newpassword12"
    }, as: :json
    assert_response :success
  end

  test "管理者はパスワードを上書きでき、管理者自身は削除できない" do
    accept_owner("owner@example.com", "warehouse1")
    issue_recorder("ward0001")
    staff = User.find_by(login_id: "ward0001")

    patch "/api/accounts/#{staff.id}", params: {
      password: "resetpassword",
      password_confirmation: "resetpassword"
    }, as: :json
    assert_response :success
    assert staff.reload.valid_password?("resetpassword")

    get "/api/accounts"
    assert_response :success
    assert_equal "http://localhost:5173/login/warehouse1", response.parsed_body["login_url"]
    assert_equal 2, response.parsed_body["active_count"]

    owner = User.find_by(email: "owner@example.com")
    delete "/api/accounts/#{owner.id}"
    assert_response :unprocessable_entity
    assert_nil owner.reload.deleted_at
  end

  test "短すぎるアカウントIDと、メール再設定では担当者を探さない" do
    accept_owner("owner@example.com", "warehouse1")
    post "/api/accounts", params: staff_params("short"), as: :json
    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "アカウントIDは8文字以上20文字以内の半角英小文字と数字で入力してください"

    issue_recorder("ward0001")
    post "/api/accounts", params: staff_params("ward0001"), as: :json
    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "このアカウントIDはすでに使われています"

    ActionMailer::Base.deliveries.clear
    post "/api/password", params: { email: "ward0001" }, as: :json
    assert_response :success
    assert_empty ActionMailer::Base.deliveries
  end

  private

  def accept_owner(email, company_code)
    ActionMailer::Base.deliveries.clear
    User.invite!(email: email)
    token = token_from_last_mail
    put "/api/invitation", params: {
      invitation_token: token,
      company_code: company_code,
      password: "password12",
      password_confirmation: "password12"
    }, as: :json
    assert_response :success
  end

  def issue_recorder(login_id)
    post "/api/accounts", params: staff_params(login_id), as: :json
    assert_response :created
  end

  def staff_params(login_id)
    {
      role: "recorder",
      login_id: login_id,
      password: "password12",
      password_confirmation: "password12"
    }
  end

  def token_from_last_mail
    mail = ActionMailer::Base.deliveries.last
    body = mail.text_part ? mail.text_part.decoded : mail.body.decoded
    escaped = body[/invitation_token=([^&\s]+)/, 1]
    assert escaped, body
    CGI.unescape(escaped)
  end
end
