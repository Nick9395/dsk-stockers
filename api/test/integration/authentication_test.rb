require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  include ActiveSupport::Testing::TimeHelpers

  test "招待からログインし、パスワードを再設定できる" do
    _user, token = invite("owner@example.com")

    get "/api/invitation", params: { invitation_token: token }
    assert_response :success
    assert_equal "owner@example.com", response.parsed_body["email"]

    assert_no_difference -> { User.count } do
      put "/api/invitation", params: {
        invitation_token: token,
        company_code: "short",
        password: "password12",
        password_confirmation: "password12"
      }, as: :json
      assert_response :unprocessable_entity
    end

    put "/api/invitation", params: {
      invitation_token: token,
      company_code: " ABCD1234 ",
      password: "password12",
      password_confirmation: "password12",
      email: "other@example.com"
    }, as: :json
    assert_response :success
    assert_equal "owner@example.com", response.parsed_body.dig("user", "email")
    assert_equal "abcd1234", response.parsed_body.dig("user", "company_code")
    assert_equal "owner@example.com", User.last.email
    assert_equal "admin", Membership.last.role

    get "/api/me"
    assert_response :success

    delete "/api/session"
    assert_response :no_content

    post "/api/session", params: { email: "owner@example.com", password: "wrong-password" }, as: :json
    assert_response :unauthorized

    post "/api/session", params: { email: "owner@example.com", password: "password12" }, as: :json
    assert_response :success

    delete "/api/session"
    ActionMailer::Base.deliveries.clear
    post "/api/password", params: { email: "missing@example.com" }, as: :json
    assert_response :success
    assert_empty ActionMailer::Base.deliveries

    post "/api/password", params: { email: "owner@example.com" }, as: :json
    assert_response :success
    reset_token = token_from_last_mail("reset_password_token")

    put "/api/password", params: {
      reset_password_token: reset_token,
      password: "newpassword12",
      password_confirmation: "newpassword12"
    }, as: :json
    assert_response :success

    delete "/api/session"
    post "/api/session", params: { email: "owner@example.com", password: "newpassword12" }, as: :json
    assert_response :success
  end

  test "期限の切れた招待では登録できない" do
    _user, token = invite("late@example.com")

    travel 8.days do
      get "/api/invitation", params: { invitation_token: token }
      assert_response :unprocessable_entity
    end
  end

  test "同じ会社コードでは二人目を登録できない" do
    _first, first_token = invite("first@example.com")
    accept(first_token, "warehouse1")

    _second, second_token = invite("second@example.com")
    put "/api/invitation", params: {
      invitation_token: second_token,
      company_code: "warehouse1",
      password: "password12",
      password_confirmation: "password12"
    }, as: :json
    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "この会社コードはすでに使われています"
    assert_nil User.find_by(email: "second@example.com")
  end

  private

  def invite(email)
    ActionMailer::Base.deliveries.clear
    user = User.invite!(email: email)
    assert_empty user.errors, user.errors.full_messages.join(", ")
    [user, token_from_last_mail("invitation_token")]
  end

  def accept(token, company_code)
    put "/api/invitation", params: {
      invitation_token: token,
      company_code: company_code,
      password: "password12",
      password_confirmation: "password12"
    }, as: :json
    assert_response :success
  end

  def token_from_last_mail(name)
    mail = ActionMailer::Base.deliveries.last
    body = mail.text_part ? mail.text_part.decoded : mail.body.decoded
    escaped = body[/#{name}=([^&\s]+)/, 1]
    assert escaped, body
    CGI.unescape(escaped)
  end
end
