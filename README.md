
# 📚 Sistem Manajemen Absensi Siswa

Aplikasi berbasis **web** dan **mobile** untuk memudahkan guru dalam mengelola absensi siswa, serta memberikan akses kepada siswa dan wali untuk melihat catatan absensi secara real-time.  
Dilengkapi dengan **dashboard** interaktif, pencatatan absensi yang cepat, dan fitur laporan.

---

## 🚀 Fitur Utama

### 👩‍🏫 Admin / Guru
- **Login & Autentikasi**: Akses aman menggunakan username & password.
- **Manajemen Kelas & Siswa**:
  - Melihat daftar kelas dan siswa.
  - Mencari dan memfilter siswa berdasarkan nama, kelas, atau kriteria lain.
- **Pencatatan Absensi**:
  - Tandai siswa sebagai **Hadir**, **Tidak Hadir**, atau **Terlambat**.
  - Tambahkan catatan alasan ketidakhadiran (contoh: *Sakit*, *Urusan Keluarga*).
  - Penyimpanan otomatis setelah absensi dikirim.
- **Dashboard Administratif**:
  - Ringkasan real-time data absensi.
  - Visualisasi data (grafik mingguan/bulanan).
  - Laporan absensi dalam format **PDF** atau **CSV**.
  - Riwayat absensi dan opsi untuk mengedit data sebelumnya.

### 👨‍🎓 Siswa / Wali
- **Login & Autentikasi**: Akses aman untuk siswa dan wali.
- **Dashboard Pribadi**:
  - Ringkasan kehadiran (contoh: *Hadir: 95%*).
  - Riwayat absensi detail: tanggal, status, dan catatan dari guru.
- **Notifikasi** *(opsional)*:
  - Pemberitahuan real-time saat absensi baru dicatat.

---

## 🛠️ Teknologi yang Digunakan
- **Database**: PostgreSQL / MySQL  
- **Backend**: Node.js (Express) atau Python (Django/Flask)  
- **Frontend**: React / Vue / Angular  
- **Autentikasi**: JWT (JSON Web Token)  
- **Keamanan**:
  - Hashing password
  - Role-based access control (RBAC)
  - Token autentikasi aman

---

## 📂 Struktur Fitur
1. **API Backend**  
   - Endpoint untuk autentikasi, manajemen kelas, absensi, laporan.
2. **Frontend Web**  
   - UI responsif untuk guru, siswa, dan wali.
3. **Mobile App**  
   - Akses melalui browser mobile atau aplikasi hybrid.
4. **Dashboard Analitik**  
   - Grafik & laporan statistik kehadiran.

---

## 📦 Cara Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/username/absensi-siswa.git
cd absensi-siswa
````

### 2. Setup Backend

```bash
cd backend
npm install # atau pip install -r requirements.txt jika menggunakan Python
```

* Buat file `.env` berdasarkan `.env.example` dan isi konfigurasi database.

### 3. Setup Database

```bash
# Jalankan migrasi database
npm run migrate
```

### 4. Setup Frontend

```bash
cd frontend
npm install
```

### 5. Menjalankan Aplikasi

```bash
# Jalankan backend
npm run dev # atau python manage.py runserver

# Jalankan frontend
npm start
```



