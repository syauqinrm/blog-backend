# Blog Backend API

Backend sederhana untuk aplikasi blog yang mendukung:
- Autentikasi menggunakan JWT
- Role-based access (pembaca, penulis, editor)
- Operasi CRUD untuk postingan dan komentar

## 📦 Tech Stack

- Node.js + Express
- Sequelize ORM + MySQL
- JSON Web Token (JWT)
- bcrypt untuk hashing password
- express-validator untuk validasi input

---

## 🚀 Fitur Utama

### 🔐 Autentikasi
- Registrasi dan login menggunakan email dan password
- Token JWT dengan masa berlaku 30 menit
- Role user: `pembaca`, `penulis`, `editor`
  - Role `editor` tidak bisa dibuat lewat registrasi manual

### ✏️ Postingan
- Penulis bisa membuat, mengedit, menghapus posting miliknya
- Editor bisa mengelola semua posting
- Pembaca hanya bisa melihat postingan dengan status `published`

### 💬 Komentar
- Pembaca dan penulis bisa berkomentar
- Komentar hanya bisa dibuat pada postingan `published`
- Pengguna hanya bisa mengedit/hapus komentarnya sendiri

---

## ⚙️ Instalasi

1. **Clone repositori:**

```bash
git clone https://github.com/namamu/blog-backend.git
cd blog-backend
```

2. **Install Dependencies**

```bash
npm install <look-package.json>
```
3. **Konfigurasi environment:**

Buat file .env berdasarkan .env.example atau contoh berikut:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=blog_db
DB_PORT=3306

JWT_SECRET=JWTs3cr3t
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=10d
PORT=3000
```
4. **Jalankan migrasi & start server:**

```bash
npx sequelize db:create
npx sequelize db:migrate
npm run dev
```

## 🛣️ Endpoints

### Auth
| Method | Endpoint           | Deskripsi             |
| ------ | ------------------ | --------------------- |
| POST   | /api/auth/register | Registrasi user baru  |
| POST   | /api/auth/login    | Login dan ambil token |

### Posts
| Method | Endpoint        | Akses           |
| ------ | --------------- | --------------- |
| GET    | /api/posts      | Semua user      |
| POST   | /api/posts      | Penulis, Editor |
| PUT    | /api/posts/:id | Pemilik, Editor |
| DELETE | /api/posts/:id | Pemilik, Editor |

### Comments
| Method | Endpoint                    | Akses            |
| ------ | --------------------------- | ---------------- |
| GET    | /api/comments/post/:postId | Semua user       |
| POST   | /api/comments/             | Pembaca, Penulis,Editor |
| DELETE | /api/comments/:id          | Pemilik komentar, Pemilik Postingan, Editor |

### Users
| Method | Endpoint                    | Akses            |
| ------ | --------------------------- | ---------------- |
| GET    | /api/users/ /:id              | Editor           |
| POST   | /api/users/:id                | Editor           |
| PUT    | /api/users/:id             | Editor           |
| DELETE | /api/users/:id             | Editor           |

## 🔒 Role-based Access
| Role    | Hak Akses                                  |
| ------- | ------------------------------------------ |
| pembaca | Lihat postingan `published`, beri komentar |
| penulis | CRUD posting miliknya, komentar            |
| editor  | CRUD semua posting, moderasi konten        |

## 📌 Catatan

- Role editor hanya bisa ditambahkan manual lewat database

- Token JWT harus dikirim di setiap request yang butuh autentikasi

- Validasi input dilakukan menggunakan express-validator
