require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Api
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # 画面は日本時間。データベースの時刻は UTC のまま保存する。
    config.time_zone = "Tokyo"
    config.active_record.default_timezone = :utc

    # 文言は日本語固定。エラー文は locale ファイルに置く。
    config.i18n.default_locale = :ja
    config.i18n.available_locales = [:ja]

    # API モードでも、ログイン状態はクッキーセッションで持つ。
    config.api_only = true
    config.session_store :cookie_store,
      key: "_dsk_stockers_session",
      same_site: :lax,
      secure: Rails.env.production?,
      httponly: true
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use config.session_store, config.session_options
    config.middleware.use ActionDispatch::Flash
  end
end
