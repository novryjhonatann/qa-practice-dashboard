# QA Practice Dashboard

Aplikasi web latihan untuk automation testing dengan Katalon Studio (Web UI dan API).

## Menjalankan

Double-click `start.bat`, atau dari terminal:

```
node server.js
```

Lalu buka http://localhost:3000. Tidak perlu `npm install`.

Data tersimpan di memori: restart server atau panggil `POST /api/reset` untuk mengembalikan data awal (12 proyek).

## Akun latihan

| Username | Password | Hasil |
|---|---|---|
| admin | admin123 | Login berhasil (Administrator) |
| tester | tester123 | Login berhasil (QA Engineer) |
| locked | locked123 | Ditolak: "Akun Anda terkunci" |

## Halaman

| URL | Isi |
|---|---|
| `/` | Login (validasi field kosong, password salah, akun terkunci, "Ingat saya", lihat password) |
| `/dashboard.html` | Statistik, tabel proyek (search, filter status, sort kolom, pagination 5 baris), tambah/edit via modal, hapus dengan konfirmasi, toast |
| `/form.html` | Form pendaftaran (text, email, select, radio, checkbox, date, file upload, textarea), JS alert/confirm/prompt, elemen dinamis 3 detik, tombol aktif setelah 5 detik, hover menu, tab baru, iframe, drag & drop |

Daftar proyek sengaja diberi jeda 0.3–1.2 detik supaya test harus memakai wait dengan benar (`WebUI.waitForElementVisible`, bukan `delay`).

## Locator

Semua elemen penting punya `id` dan `data-testid`. Contoh XPath/CSS:

| Elemen | CSS |
|---|---|
| Input username | `#username` atau `[data-testid="input-username"]` |
| Input password | `#password` |
| Tombol login | `#btn-login` |
| Pesan error login | `[data-testid="login-error"]` |
| Nama user di header | `#user-name` |
| Tombol logout | `#btn-logout` (memunculkan JS confirm) |
| Kartu statistik | `#stat-total`, `#stat-planning`, `#stat-progress`, `#stat-testing`, `#stat-done` |
| Kolom cari | `#search` |
| Filter status | `#filter-status` |
| Spinner loading | `#loading` |
| Baris tabel | `[data-testid="project-row"]` |
| Sel nama di baris | `[data-testid="cell-name"]` |
| Tombol edit / hapus proyek | `[data-testid="btn-edit-PRJ-001"]`, `[data-testid="btn-delete-PRJ-001"]` |
| Tombol tambah | `#btn-add` |
| Field modal | `#f-code`, `#f-name`, `#f-owner`, `#f-status`, `#f-priority`, `#f-progress`, `#f-due` |
| Pesan error field modal | `#err-code`, `#err-name`, `#err-owner`, `#err-progress`, `#err-dueDate` |
| Simpan / batal | `#btn-save`, `#btn-cancel` |
| Konfirmasi hapus | `#btn-delete-confirm` |
| Toast sukses | `[data-testid="toast-success"]` |
| Info tabel | `#table-info` (contoh: "Menampilkan 1-5 dari 12 proyek") |
| Pagination | `#btn-prev`, `#btn-next`, `#page-info` |

XPath contoh: baris berdasarkan nama proyek
`//tr[@data-testid='project-row'][td[@data-testid='cell-name' and text()='Portal Pelanggan v3']]`

## API

Semua endpoint selain login, reset, dan health butuh header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan | Status |
|---|---|---|---|
| POST | `/api/login` | Body `{"username","password"}` → `{token, user}` | 200, 400, 401, 423 |
| POST | `/api/logout` | Hapus token | 200 |
| GET | `/api/me` | User yang sedang login | 200, 401 |
| GET | `/api/stats` | Jumlah proyek per status | 200 |
| GET | `/api/projects?search=&status=` | Daftar proyek | 200 |
| GET | `/api/projects/{id}` | Detail proyek | 200, 404 |
| POST | `/api/projects` | Tambah proyek | 201, 400 |
| PUT | `/api/projects/{id}` | Ubah sebagian/semua field | 200, 400, 404 |
| DELETE | `/api/projects/{id}` | Hapus proyek | 200, 404 |
| POST | `/api/reset` | Kembalikan data awal | 200 |
| GET | `/api/health` | Cek server hidup | 200 |

Contoh body tambah proyek:

```json
{
  "code": "PRJ-013",
  "name": "Aplikasi Kasir Toko",
  "owner": "Novry",
  "status": "Planning",
  "priority": "High",
  "progress": 0,
  "dueDate": "2027-01-31"
}
```

Aturan validasi: `code` format `PRJ-XXX` dan unik, `name` 3–100 karakter, `owner` wajib, `status` salah satu dari Planning / In Progress / Testing / Done, `priority` salah satu dari Low / Medium / High / Critical, `progress` bilangan bulat 0–100, `dueDate` format `YYYY-MM-DD`. Gagal validasi → 400 dengan `errors` per field.
