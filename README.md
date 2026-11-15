# DSK Stockers

中小企業向けの倉庫管理アプリです。備品の在庫と持ち出しを、その場で記録します。

ブラウザで開くのはフロントエンドだけです。API とデータベースはコンテナ内で動きます。開発用の Ruby と Node.js を Mac 本体には入れません。

## ディレクトリ

| パス | 内容 |
| --- | --- |
| `api/` | Rails API |
| `web/` | React の画面 |
| `docker/` | 開発用の Docker イメージ |
| `compose.yaml` | 開発用の Compose 定義 |

## 技術スタック

| 役割 | 採用 |
| --- | --- |
| API | Ruby 4.0、Rails 8.1（API モード）、Minitest |
| 画面 | TypeScript 7、React 19、Vite 8、Tailwind CSS 4、React Router、TanStack Query |
| データベース | PostgreSQL 18 |
| 開発メール | Mailpit |
| 実行環境 | Docker Compose（`node:26`、`ruby:4.0`、`postgres:18`） |

画面の文言は日本語で、部品の中に直接書きます。時刻は UTC で保存し、表示は日本時間です。

## 初回セットアップ

Docker が動いている状態で、リポジトリのルートで実行します。

```bash
cp .env.example .env
docker compose up --build
```

別のターミナルでデータベースを作ります。

```bash
docker compose exec api bin/rails db:prepare
docker compose exec api bin/rails users:invite EMAIL=person@example.com
```

`users:invite` は、契約者のメールアドレスへ招待を送ります。届いたメールは Mailpit で確認します。リンクから会社コードとパスワードを登録すると、そのメールアドレスでログインできます。

## 開く URL

| URL | 用途 |
| --- | --- |
| http://localhost:5173 | 画面。開発中はここを開く |
| http://localhost:3002 | Rails API。ヘルスチェックは http://localhost:3002/up |
| http://localhost:8025 | Mailpit。開発中に送ったメールをここで見る |

画面の `/api` は、Vite が `http://api:3000` へ転送します。

## よく使うコマンド

コマンドはリポジトリのルートで実行します。`api` と `web` は Compose のサービス名です。

```bash
docker compose up -d          # バックグラウンドで起動
docker compose stop           # 止める
docker compose logs -f api    # API のログを見る
docker compose exec api bin/rails console
docker compose exec api bin/rails test
docker compose exec api bin/rails db:prepare
docker compose exec api bin/rails users:invite EMAIL=person@example.com
docker compose exec web npm run lint
```
