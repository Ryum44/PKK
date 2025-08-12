Aplikasi Manajemen Absensi Siswa
Selamat datang di proyek Aplikasi Manajemen Absensi Siswa!

Ini adalah aplikasi web MVP (Minimum Viable Product) yang dirancang untuk mempermudah guru dalam mengelola dan mencatat absensi siswa secara digital. Aplikasi ini memiliki dua peran utama: Guru yang dapat menandai absensi dan Siswa yang dapat melihat catatan kehadiran mereka sendiri.

Fitur Utama
Untuk Guru
Dasbor Guru: Tampilan khusus yang menunjukkan daftar kelas yang diajarkan.

Pencatatan Absensi: Mudah menandai status absensi siswa (hadir, absen, atau terlambat) untuk setiap tanggal.

Manajemen Siswa: Tambah atau hapus siswa dari kelas.

Untuk Siswa
Dasbor Siswa: Tampilan sederhana untuk melihat catatan absensi pribadi mereka.

Teknologi yang Digunakan
Proyek ini dibangun dengan fokus pada kesederhanaan dan efisiensi, menggunakan tumpukan teknologi modern:

Frontend: React (dengan Vite)

Backend: Node.js

Database: MongoDB

CSS: Tailwind CSS

State Management: React Context API

Authentication: Menggunakan Replit Auth untuk otentikasi dasar.

Panduan Instalasi (Development)
Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di lingkungan lokal Anda.

Prasyarat
Pastikan Anda telah menginstal:

Node.js (v18 atau lebih baru)

npm

Langkah-langkah
Kloning Repositori

git clone [URL_REPOSITORI_ANDA]
cd [nama_folder_proyek]

Konfigurasi Backend

Navigasi ke direktori backend.

Buat file .env baru dan tambahkan variabel lingkungan berikut:

MONGO_URL="mongodb://localhost:27017"
DB_NAME="attendance_db"
CORS_ORIGINS="*"

Instal dependensi dan jalankan server backend:

npm install
npm start

Konfigurasi Frontend

Buka terminal baru dan navigasi ke direktori frontend.

Buat file .env baru dan tambahkan variabel lingkungan berikut:

VITE_BACKEND_URL="http://localhost:3000"

Instal dependensi dan jalankan aplikasi frontend:

npm install
npm run dev

Setelah langkah-langkah ini selesai, aplikasi akan dapat diakses di http://localhost:5173 (atau port lain yang ditentukan oleh Vite).

Kontribusi
Kami sangat menyambut kontribusi Anda! Jika Anda ingin membantu mengembangkan aplikasi ini, silakan ikuti alur kerja standar GitHub:

Fork repositori ini.

Buat branch baru (git checkout -b fitur/nama-fitur).

Lakukan perubahan dan commit (git commit -m 'Tambahkan fitur baru').

Push ke branch Anda (git push origin fitur/nama-fitur).

Buat Pull Request baru.
