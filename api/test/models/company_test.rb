require "test_helper"

class CompanyTest < ActiveSupport::TestCase
  test "大文字と空白を小文字の会社コードにする" do
    company = Company.new(code: "  ABCD1234 ")
    assert company.valid?
    assert_equal "abcd1234", company.code
  end

  test "短すぎる会社コードは受け付けない" do
    company = Company.new(code: "abc123")
    assert_not company.valid?
    assert_includes company.errors.map(&:full_message), "会社コードは8文字以上20文字以内の半角英小文字と数字で入力してください"
  end

  test "同じ会社コードは登録できない" do
    Company.create!(code: "abcd1234")
    duplicate = Company.new(code: "ABCD1234")
    assert_not duplicate.valid?
    assert_includes duplicate.errors.map(&:full_message), "この会社コードはすでに使われています"
  end
end
