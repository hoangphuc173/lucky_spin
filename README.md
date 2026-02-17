# 🎰 Vòng Quay May Mắn - Lucky Spin Wheel (Tet Version)

Một ứng dụng quay thưởng may mắn với giao diện **Premium Casino** kết hợp không khí **Tết Nguyên Đán** rực rỡ.  
Dự án được xây dựng bằng **HTML, CSS (Vanilla), JavaScript** thuần và sử dụng **Firebase** để xác thực & lưu trữ.

🔗 **Live Demo:** [https://vqmn-1f9c7.web.app](https://vqmn-1f9c7.web.app)

---

## ✨ Tính Năng Nổi Bật

### 🎨 Giao Diện & Trải Nghiệm
- **Chủ đề Tết:** Lồng đèn đung đưa, hoa mai/đào rơi lả tả, font chữ thư pháp ông đồ.
- **Mascot 3D:** Đồng xu vàng xoay 3D (Pure CSS) cực xịn.
- **Hiệu ứng:** Glassmorphism (kính mờ), Particle Background, Pháo giấy (Confetti).
- **Âm thanh:** Nhạc nền Tết rộn ràng + Hiệu ứng quay số, trúng thưởng sống động.

### ⚙️ Chức Năng
- **Đăng nhập Google:** Sử dụng Firebase Auth.
- **Vòng quay:** 
  - Tỉ lệ trúng thưởng có thể cấu hình.
  - Hiệu ứng đèn LED chạy quanh vòng quay.
- **Admin Panel:** Quản lý lượt quay của người dùng (Thêm/Bớt lượt).
- **Lịch sử:** Lưu lại kết quả quay của từng người dùng.

---

## 🚀 Cài Đặt & Chạy Local (Trên máy tính)

### 1. Tải mã nguồn
```bash
git clone https://github.com/hoangphuc173/lucky_spin.git
cd lucky_spin
```

### 2. Chạy thử
Bạn có thể dùng bất kỳ Web Server nào (Live Server, Python http.server, etc).  
Cách đơn giản nhất dùng `npx`:

```bash
# Cài đặt serve (nếu chưa có)
npm install -g serve

# Chạy server tại thư mục hiện tại
serve .
```
Truy cập: `http://localhost:3000`

---

## ☁️ Hướng Dẫn Deploy (Firebase Hosting)

Dự án đã được cấu hình sẵn để deploy lên Firebase.

### 1. Cài đặt Firebase CLI
Nếu bạn chưa cài đặt Firebase CLI:
```bash
npm install -g firebase-tools
```

### 2. Đăng nhập
```bash
firebase login
```

### 3. Deploy
Chỉ cần chạy lệnh sau để đẩy code lên Hosting:

```bash
firebase deploy --only hosting
```

Sau khi chạy xong, bạn sẽ nhận được đường link (ví dụ: `https://vqmn-1f9c7.web.app`).

> **Lưu ý:** Nếu bạn sửa file và deploy lại mà không thấy thay đổi, hãy nhớ thêm tham số version vào link CSS/JS trong `index.html` (ví dụ: `style.css?v=2`) để xóa bộ nhớ đệm (cache).

---

## 🛠️ Cấu Hình Giải Thưởng

Để sửa tên giải thưởng hoặc tỉ lệ trúng, bạn mở file `js/app.js` (hoặc `js/wheel.js` tùy cấu trúc) và tìm mảng `prizes`:

```javascript
const prizes = [
  { text: "10k", color: "#...", probability: 0.3 },
  { text: "50k", color: "#...", probability: 0.1 },
  ...
];
```

---

## 📂 Cấu Trúc Thư Mục

- `index.html`: Giao diện chính.
- `css/`:
  - `style.css`: Style chính (đêm hội Casino, Mascot 3D).
  - `tet.css`: Style riêng cho dịp Tết (Lồng đèn, Font chữ).
- `js/`: Mã nguồn logic (Firebase, Wheel, Effects...).
- `firebase.json`: Cấu hình deploy.

---

© 2026 Lucky Spin Team. Chúc Mừng Năm Mới! 🎆
