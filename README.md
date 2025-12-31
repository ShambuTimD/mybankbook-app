# 🛠️ Development Setup Guide — Inertia Laravel Core

> This guide walks developers through setting up the **[Inertia Laravel Core](https://github.com/timddevelopers/inertia-laravel-core)** project for local development.

---

## ⚙️ Prerequisites

Make sure the following are installed:

| Tool             | Recommended Version |
| ---------------- | ------------------- |
| PHP              | >= 8.2              |
| Composer         | 2.x                 |
| Laravel CLI      | >= 10.x             |
| Node.js          | >= 18.x             |
| NPM or Yarn      | >= 9.x              |
| MySQL/PostgreSQL | As needed           |

---

## 🚀 Clone the Repository

```bash
git clone https://github.com/timddevelopers/inertia-laravel-core.git
cd inertia-laravel-core
```

---

## 📦 Install Laravel (Backend) Dependencies

```bash
composer install
```

---

## 📦 Install React (Frontend) Dependencies

```bash
npm install
# OR
yarn
```

---

## 🔐 Setup Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update the following fields:

   ```env
   APP_NAME="Timd Inertia App"
   APP_URL=http://localhost:8000

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_database
   DB_USERNAME=your_username
   DB_PASSWORD=your_password

   VITE_APP_NAME="${APP_NAME}"
   ```

---

## 🔑 Generate Application Key

```bash
php artisan key:generate
```

---

## 🧱 Run Database Migrations

```bash
php artisan migrate
# Optional:
php artisan db:seed
```

---

## 🔌 Run Laravel Backend Server

```bash
php artisan serve
```

> This starts the Laravel server at: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🌐 Start Vite Dev Server (React + Inertia)

```bash
npm run dev
# OR
yarn dev
```

> Vite runs on [http://localhost:5173](http://localhost:5173) and hot reloads the React frontend.

---

## 🧪 Useful Dev Commands

| Task               | Command                        |
| ------------------ | ------------------------------ |
| Migrate DB         | `php artisan migrate`          |
| Rollback Migration | `php artisan migrate:rollback` |
| Seed DB            | `php artisan db:seed`          |
| Vite Dev Server    | `npm run dev` or `yarn dev`    |
| Build Assets       | `npm run build`                |
| Clear Cache        | `php artisan optimize:clear`   |

---

## 🗂 Project Structure Overview

```
├── app/                # Laravel Controllers, Models, etc.
├── resources/js/       # React (Inertia) components
│   ├── Pages/          # Inertia pages
│   ├── Layouts/        # Shared layouts
├── routes/web.php      # Laravel routes using Inertia
├── .env                # Environment config
├── vite.config.js      # Vite config for React
```

---

## 🔒 Auth (Optional)

If using Laravel Breeze, Fortify, or custom guards, ensure:

* Login, register, forgot-password routes are set up
* Middleware like `auth` is applied properly to protected routes

Example:

```php
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'));
});
```

---

## 🐞 Debugging Tips

* **Inertia errors**:

  * Make sure you return `Inertia::render(...)` and not `return view(...)`.
* **Frontend issues**:

  * Clear cache: `npm cache clean --force`
  * Restart Vite: `Ctrl+C` then `npm run dev`
* **Backend issues**:

  * Clear config cache: `php artisan config:clear`

---

## ✅ You're Ready!

Open [http://localhost:8000](http://localhost:8000) in your browser.

* Laravel serves backend APIs
* React via Inertia renders the frontend
* Vite handles hot reloading

