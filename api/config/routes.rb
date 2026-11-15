Rails.application.routes.draw do
  devise_for :users, skip: :all

  namespace :api do
    get "csrf", to: "csrf#show"
    get "me", to: "sessions#show"
    post "session", to: "sessions#create"
    delete "session", to: "sessions#destroy"
    get "invitation", to: "invitations#show"
    put "invitation", to: "invitations#update"
    post "password", to: "passwords#create"
    put "password", to: "passwords#update"
    resources :accounts, only: [:index, :show, :create, :update, :destroy]
    patch "profile", to: "profile#update"
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
