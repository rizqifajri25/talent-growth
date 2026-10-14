# TALENT GROWTH BLOG PLATFORM — FINAL REPORT TAHAP 5
## Full-Stack Blog Post CRUD & Aurora Editorial Experience

Laporan komprehensif ini mendokumentasikan implementasi fitur Create, Read, Update, dan Delete (CRUD) untuk blog post secara end-to-end pada Talent Growth Blog Platform, menghubungkan backend Express, PostgreSQL, Prisma ORM v7, dan frontend React 19 dengan mempertahankan sistem desain **Aurora (Warm Editorial Luxury & Architectural Minimalism)**.

---

## A. EXECUTIVE SUMMARY

Pada Tahap 5, platform blog Talent Growth telah berhasil ditingkatkan dari fondasi autentikasi menjadi sistem publikasi artikel editorial yang berfungsi penuh secara full-stack:
1. **Backend Blog Post CRUD API**: Menghadirkan lima endpoint RESTful terstruktur di `/api/v1/posts` dengan validasi Zod ketat, isolasi identitas author via token JWT, dan otorisasi kepemilikan artikel yang ketat (HTTP 403 untuk non-pemilik).
2. **Keamanan Data & Privasi**: Informasi sensitif seperti password hash, email pengguna, dan sesi database secara konsisten diisolasi dan tidak pernah dibocorkan pada query post publik.
3. **Automated Testing Suite (43 Tests Passed)**: Menambahkan 17 automated integration tests untuk endpoint post tanpa regresi pada 26 authentication tests yang telah ada sebelumnya, menggunakan mekanisme targeted cleanup yang aman tanpa mereset database.
4. **Pengalaman Editorial Aurora**: Menghadirkan halaman The Archive (`/essays`), Reading View (`/essays/:id`), Composition Desk (`/essays/new`), Revision Desk (`/essays/:id/edit`), dan integrasi artikel live pada `HomePage` serta `ProfilePage`.
5. **Kepatuhan Larangan Browser**: Verifikasi diselesaikan 100% melalui linting, typechecking, build testing, dan automated integration test tanpa membuka Chrome atau tool otomasi browser.

---

## B. BACKEND IMPLEMENTATION

### 1. Endpoint dan Method
Prefix rute terdaftar di `/api/v1/posts`:
- `GET /api/v1/posts`: Publik. Mengambil seluruh artikel dari PostgreSQL diurutkan dari yang terbaru (`createdAt: 'desc'`). Menyertakan objek penulis yang aman (`{ id, name, avatarUrl }`).
- `GET /api/v1/posts/:id`: Publik. Mengambil satu artikel berdasarkan UUID. Mengembalikan 404 jika artikel tidak ditemukan, atau 400 jika format UUID tidak valid.
- `POST /api/v1/posts`: Terproteksi (`requireAuth`). Menerima `{ title, content, category? }`. Mengabaikan `authorId` dari request body dan menetapkan identitas penulis secara mutlak dari token JWT verified. Mengembalikan `201 Created`.
- `PUT /api/v1/posts/:id`: Terproteksi (`requireAuth`). Memvalidasi UUID dan body. Menemukan artikel di database, memverifikasi kepemilikan (`existing.authorId === req.auth.userId`). Mengembalikan 404 jika artikel tidak ada, 403 Forbidden jika pengguna bukan pemilik, dan `200 OK` dengan data ter-update jika valid.
- `DELETE /api/v1/posts/:id`: Terproteksi (`requireAuth`). Memverifikasi kepemilikan. Mengembalikan 404 jika tidak ada, 403 Forbidden jika bukan pemilik, dan `200 OK` setelah artikel dihapus dari PostgreSQL.

### 2. File yang Dibuat dan Diubah
- **`backend/src/validators/posts.validators.ts`** *(Baru)*: Mendefinisikan schema Zod untuk validasi param UUID, `createPostSchema`, `updatePostSchema`, serta formatter error Zod seragam.
- **`backend/src/services/posts.service.ts`** *(Baru)*: Service layer berorientasi Prisma Client dengan `safeAuthorSelect`, `getAllPosts`, `getPostById`, `createPost`, `updatePost`, dan `deletePost` dengan pengecekan kepemilikan sebelum mutasi.
- **`backend/src/controllers/posts.controller.ts`** *(Baru)*: Controller penanganan HTTP request, mapping status code (200, 201, 400, 401, 403, 404, 500), dan response JSON terstandarisasi.
- **`backend/src/routes/posts.routes.ts`** *(Baru)*: Router Express yang menghubungkan route publik dan route terproteksi dengan middleware `requireAuth`.
- **`backend/src/app.ts`** *(Diperbarui)*: Mendaftarkan `app.use('/api/v1/posts', postRoutes);`.
- **`backend/src/__tests__/posts.api.test.ts`** *(Baru)*: 17 integration tests menggunakan Vitest dan Supertest.

### 3. Validasi Input (Zod)
- **Title**: String wajib, di-trim, minimal 1 karakter, maksimal 255 karakter (sesuai panjang kolom `VarChar(255)` pada Prisma).
- **Content**: String wajib, di-trim, minimal 1 karakter, maksimal 50,000 karakter (teks artikel panjang yang masuk akal).
- **Category**: String opsional, di-trim, maksimal 100 karakter, dinormalisasi menjadi `null` jika berupa string kosong.
- **ID Param**: Format UUID standar v4.

### 4. Ownership Authorization (Keamanan Otorisasi)
Pengecekan hak akses pemilik dilakukan langsung di lapisan service backend:
```typescript
if (existing.authorId !== currentUserId) {
  throw new ForbiddenPostActionError('You do not have permission to edit this post.');
}
```
Setiap manipulasi client-side (seperti memodifikasi URL atau memalsukan payload) akan ditolak oleh server dengan **HTTP 403 Forbidden**.

---

## C. FRONTEND IMPLEMENTATION

### 1. Routes yang Tersedia
- `/` (`HomePage`): Beranda editorial split-hero dengan grid artikel terbaru yang diambil langsung dari database via `GET /api/v1/posts`.
- `/essays` (`EssaysPage`): Arsip publikasi lengkap dengan filter kategori dinamis dan empty state interaktif.
- `/essays/:id` (`PostDetailPage`): Tampilan baca artikel dengan tipografi 18px / 1.85 line-height. Tombol aksi `Edit Essay` dan `Delete` hanya dirender jika pengunjung terautentikasi dan merupakan author artikel tersebut.
- `/essays/new` (`NewPostPage`): Form authoring terproteksi (`ProtectedRoute`) dengan validasi input client-side, penghitung karakter live, loading state submit, dan auto-redirect ke artikel baru.
- `/essays/:id/edit` (`EditPostPage`): Form revisi artikel terproteksi (`ProtectedRoute`) dengan prefilled data, verifikasi ownership client + server, dan proteksi 403 jika diakses oleh non-pemilik.
- `/profile` (`ProfilePage`): Author workspace yang menampilkan data akun serta daftar artikel yang diterbitkan oleh pengguna aktif, lengkap dengan tombol Edit dan Delete.

### 2. Integrasi Axios & Token Management
- **`frontend/src/api/posts.api.ts`**: Menggunakan instance tunggal `apiClient` (`frontend/src/api/client.ts`).
- Request mutasi (`POST`, `PUT`, `DELETE`) secara otomatis menyertakan header `Authorization: Bearer <token>` dari `tokenStore` in-memory RAM tanpa menyentuh Web Storage (`localStorage` / `sessionStorage`).

### 3. Loading, Empty, Success, dan Error States
- **Loading State**: Komponen skeleton dan spinner berputar lembut dengan penanda aksesibilitas `aria-live="polite"`.
- **Empty State**: Kotak empty state bergaris putus-putus khas Aurora dengan pesan jujur dan tombol CTA yang mengarahkan user login untuk menulis artikel pertama atau user anonim untuk mendaftar.
- **Error State**: Banner error elegan (`.alert-banner.alert-error`) yang menampilkan pesan ramah pengguna tanpa membocorkan stack trace server, dilengkapi tombol retry.
- **Delete Confirmation Modal**: Dialog modal accessible dengan `role="alertdialog"`, backdrop blur, peringatan bahwa penghapusan bersifat permanen, pencegahan double-submission, dan dukungan tombol keyboard `Escape`.

---

## D. AURORA DESIGN SYSTEM PERMANENCE

Halaman artikel dan form CRUD Tahap 5 sepenuhnya meneruskan standar desain **Aurora (Warm Editorial Luxury & Architectural Minimalism)**:

1. **Tokens yang Digunakan**:
   - Background Canvas: `--color-bg: #FBFBFA` (Porcelain)
   - Cards & Surfaces: `--color-surface: #FFFFFF` (Pure White) dengan hairline borders `#E8E6DF`.
   - Typography: `--font-serif` (*Instrument Serif*) untuk judul artikel, `--font-sans` (*Plus Jakarta Sans*) untuk teks bacaan, dan `--font-mono` (*JetBrains Mono*) untuk tanggal dan badge status.
   - Accents: Kuningan teredam (`--color-accent-brass: #C2A676`) dan background badge kuningan (`--color-accent-brass-bg: rgba(194, 166, 118, 0.12)`).
   - Action Buttons: Pill buttons dengan warna hitam pekat (`#0A0A0A`) dan ikon panah directional (`↗`).
2. **Layout Pembacaan Editorial**:
   - Lebar kontainer artikel dibatasi hingga `820px` agar panjang baris nyaman untuk mata pembaca (*optimal reading measure*).
   - Ukuran font teks isi adalah `1.125rem` (18px) dengan line-height `1.85`.
   - Konten teks dirender secara aman menggunakan CSS `white-space: pre-wrap;` tanpa merender HTML mentah.
3. **Keterbatasan Pemeriksaan Visual**:
   - Sesuai instruksi ketat pengguna pada Tahap 5, pemeriksaan browser tidak dijalankan sama sekali.
   - Kualitas desain dijamin melalui token CSS yang seragam, audit struktur DOM, dan checklist manual testing untuk pengujian visual independen oleh pengguna.

---

## E. AUTOMATED VERIFICATION

| Kategori Pengujian | Perintah / Target | Hasil Aktual | Catatan |
| :--- | :--- | :--- | :--- |
| **Backend TypeScript Build** | `npm run build` | ✅ **Lulus (Exit Code 0)** | Prisma Client ter-generate & `tsc` lulus tanpa error |
| **Backend Test Suite (Total)** | `npm test` (vitest) | ✅ **43 passed (43)** | 3 test files lulus dalam 25.38s |
| - *Auth Validators Test* | `auth.validators.test.ts` | ✅ **10 passed (10)** | Validasi 72-byte UTF-8, Zod format |
| - *Auth API Integration* | `auth.api.test.ts` | ✅ **16 passed (16)** | Register, login, me, session revocation |
| - *Posts API Integration* | `posts.api.test.ts` | ✅ **17 passed (17)** | Public read, create, update, delete, 403, 404, 400 |
| **Frontend Linting** | `npm run lint` (oxlint) | ✅ **0 warnings, 0 errors** | 24 file diperiksa, clean code standards |
| **Frontend Production Build** | `npm run build` (tsc -b && vite) | ✅ **Lulus (Exit Code 0)** | Gzip bundle ~110 kB selesai dalam 985ms |
| **Database Diagnostics** | `GET /api/v1/health/db` | ✅ **200 OK** | Koneksi PostgreSQL lokal responsif dan stabil |

---

## F. DATABASE SAFETY & TEST ISOLATION

- **Database yang Digunakan**: Database development PostgreSQL lokal (`talent_growth_dev`).
- **Pembersihan Data Uji (Targeted Cleanup)**:
  - Uji otomatis membuat user dan post dengan ID / UUID unik.
  - Setiap ID yang dibuat dicatat dalam array penampung (`createdUserIds` dan `createdPostIds`).
  - Blok `afterAll` secara spesifik hanya menghapus record dengan ID tersebut:
    ```typescript
    await prisma.post.deleteMany({ where: { id: { in: createdPostIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    ```
- **Konfirmasi Keamanan**:
  - **TIDAK ADA** perintah reset database (`prisma migrate reset`).
  - **TIDAK ADA** penghapusan seluruh tabel (`TRUNCATE` atau `DROP`).
  - **TIDAK ADA** operasi destruktif yang memengaruhi data pengguna di luar tes.

---

## G. STATUS GIT REPOSITORY

- **Branch aktif**: `main`
- **Pesan commit**: `feat(talent-growth): Implement blog post CRUD and author permissions`
- **Status Working Tree**: Clean
- **Status Push**: **TIDAK DILAKUKAN PUSH** ke remote repository (sesuai instruksi ketat pengguna pada Tahap 5).

---

## H. CHECKLIST MANUAL TESTING

Silakan buka browser Chrome di komputer Anda pada alamat **`http://localhost:5173`** dan ikuti panduan pengujian berurutan berikut untuk memverifikasi UI dan fungsi aplikasi secara langsung:

### 1. Membaca Daftar Artikel sebagai Pengunjung (Tamu)
- **Langkah**: Buka `http://localhost:5173/`. Scroll ke bagian *"Recent Perspectives"* atau klik menu **Essays** pada header.
- **Ekspektasi**: Daftar artikel dari database muncul dalam kartu putih bergaris tipis Aurora, menampilkan judul serif, badge topik bernuansa brass, nama penulis, tanggal format humanis, dan link `Read essay ↗`. Jika database kosong, muncul kotak empty state elegan.

### 2. Membuka Detail Artikel
- **Langkah**: Klik pada salah satu judul artikel atau tombol `Read essay ↗`.
- **Ekspektasi**: Halaman `/essays/:id` terbuka. Menampilkan judul besar dengan font Instrument Serif, tanggal dan nama author, serta isi artikel yang nyaman dibaca dengan line-height lega. Tidak ada tombol Edit atau Delete yang muncul jika Anda belum login atau bukan pemilik artikel.

### 3. Mencoba Mengakses Form Create / Edit Tanpa Login
- **Langkah**: Tanpa login, ketikkan langsung URL `http://localhost:5173/essays/new` di address bar.
- **Ekspektasi**: Protected Route guard otomatis mengarahkan browser Anda ke `/login`.

### 4. Membuat Artikel Baru sebagai Pengguna Terautentikasi
- **Langkah**:
  1. Login menggunakan akun Anda di `/login` (atau buat akun di `/register`).
  2. Klik tombol `Write an essay ↗` pada Navbar atau klik tombol di halaman profil.
  3. Form *"Compose New Essay"* terbuka di `/essays/new`.
  4. Masukkan judul: *"Refleksi Arsitektur Perangkat Lunak"*, kategori: *"Architecture"*, dan isi artikel minimal 2 paragraf.
  5. Klik tombol `Publish Essay ↗`.
- **Ekspektasi**: Tombol berubah menjadi *"Publishing..."* dan dinonaktifkan. Setelah sukses, Anda otomatis diarahkan ke halaman detail artikel yang baru dibuat (`/essays/:id`).

### 5. Memverifikasi Artikel Muncul di Beranda dan Arsip
- **Langkah**: Navigasikan kembali ke `Home` (`/`) atau `Essays` (`/essays`).
- **Ekspektasi**: Artikel yang baru Anda buat muncul di urutan paling atas dari daftar artikel.

### 6. Mengedit Artikel Milik Sendiri
- **Langkah**:
  1. Pada halaman detail artikel milik Anda (`/essays/:id`), klik tombol `Edit Essay`.
  2. Form terisi otomatis (*prefilled*) dengan data judul, kategori, dan konten yang ada.
  3. Ubah judul atau tambahkan teks baru pada isi artikel.
  4. Klik `Save Revisions ↗`.
- **Ekspektasi**: Anda diarahkan kembali ke detail artikel dan perubahannya langsung tampak. Label *"· Updated [Tanggal]"* muncul pada footer artikel.

### 7. Uji Pembatasan Hak Akses Antara 2 Akun Berbeda
- **Langkah**:
  1. Catat URL artikel yang dibuat oleh Akun A (misal: `/essays/<uuid-artikel-a>`).
  2. Logout dari Akun A, lalu buat/masuk dengan Akun B.
  3. Buka URL artikel Akun A tersebut.
  4. Periksa apakah tombol Edit dan Delete muncul.
  5. Coba paksa akses halaman edit dengan mengetikkan `/essays/<uuid-artikel-a>/edit` di address bar.
- **Ekspektasi**: Pada detail artikel, tombol Edit dan Delete **tidak ditampilkan**. Pada saat dipaksa masuk ke URL edit, halaman menampilkan kartu **403 Forbidden — Permission Denied** dengan penjelasan bahwa artikel ini dimiliki oleh author lain.

### 8. Menghapus Artikel Milik Sendiri
- **Langkah**:
  1. Login kembali dengan akun pemilik artikel.
  2. Masuk ke halaman detail artikel milik Anda atau buka halaman **Profile**.
  3. Klik tombol `Delete` (berwarna merah lembut).
  4. Dialog konfirmasi *"Delete Essay?"* muncul dengan peringatan aksi permanen.
  5. Coba tekan tombol `Escape` pada keyboard (modal harus tertutup).
  6. Buka kembali modal, lalu klik `Delete Permanently`.
- **Ekspektasi**: Tombol berubah menjadi *"Deleting..."*. Setelah terhapus, Anda diarahkan kembali ke `/essays`. Artikel tersebut sudah tidak ada lagi di daftar, dan jika URL lama dibuka akan menampilkan halaman **404 · Essay Unavailable**.

### 9. Menguji Validasi Form Input
- **Langkah**: Pada form `/essays/new`, biarkan input judul dan isi artikel kosong, lalu klik `Publish Essay`.
- **Ekspektasi**: Submit dibatalkan di sisi client. Muncul pesan error merah tepat di bawah field title (*"Title is required and cannot be empty"*) dan content. Input border berubah menjadi merah lembut.

### 10. Menguji Filter Kategori di Halaman The Archive
- **Langkah**: Buka `/essays`.
- **Ekspektasi**: Muncul deretan pill kategori (*"All"*, *"Architecture"*, dsb.). Mengklik salah satu pill akan menyaring artikel sesuai kategori tersebut tanpa reload halaman.

### 11. Menguji Tampilan Responsif Mobile
- **Langkah**: Buka Developer Tools Chrome (`F12`), aktifkan toggle device toolbar (ukuran layar iPhone/Android), lalu jelajahi halaman Home, Essays, Detail, dan Editor.
- **Ekspektasi**: Header beralih ke mobile drawer hamburger, grid artikel berubah menjadi single column, ukuran judul berskala dinamis, dan seluruh tombol tetap mudah disentuh dengan nyaman.

---

## I. REMAINING WORK (TAHAP BERIKUTNYA)

Fitur-fitur berikut ini secara sengaja belum diimplementasikan pada Tahap 5 dan dijadwalkan untuk tahap berikutnya:
- ⏳ **Tahap 6: Sistem Komentar** (Relasi tabel `Comment`, nested comments, posting komentar pada artikel).
- ⏳ **Tahap 7: Otorisasi & Manajemen Profil Lanjutan** (Direktori penulis / Writers, bio author, pengelolaan akun).
- ⏳ **Tahap 8: Pencarian, Pagination, & Markdown Editor** (Full-text search, pagination query, rich markdown syntax parsing).
- ⏳ **Tahap 9: Upload Cover Image & Media** (Integrasi file upload storage).
- ⏳ **Tahap 10: Testing Akhir & Polish**.
- ⏳ **Tahap 11: Deployment Produksi** (Vercel, Railway, Supabase).

---

## J. COMPLETION STATUS

**Status Tahap 5: SELESAI (COMPLETED)**

Seluruh persyaratan fungsional CRUD blog post, otorisasi kepemilikan author, integrasi full-stack frontend React 19, kepatuhan design system Aurora, automated testing 43/43 tests, dan larangan inspeksi browser telah terpenuhi dan diverifikasi secara menyeluruh.
