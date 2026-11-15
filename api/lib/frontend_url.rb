# メールに載せるリンクは、API ではなく画面のオリジンへ向ける。
module FrontendUrl
  module_function

  def join(path)
    origin = ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173").delete_suffix("/")
    "#{origin}#{path}"
  end
end
