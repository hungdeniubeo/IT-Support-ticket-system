# IT Support Ticket System

Ứng dụng cá nhân giúp nhân viên IT Support ghi lại yêu cầu, theo dõi quá trình xử lý và tra cứu lại giải pháp. Phiên bản hiện tại lưu dữ liệu trong trình duyệt, không cần tài khoản, máy chủ, API key hay biến môi trường.

## Tính năng

- Trang tổng quan hiển thị số ticket theo trạng thái và các ticket gần đây
- Tìm kiếm, lọc theo trạng thái, mức độ ưu tiên và danh mục
- Tạo, chỉnh sửa và xóa ticket (có bước xác nhận)
- Ghi lại mô tả, quá trình kiểm tra, nguyên nhân, cách xử lý và ghi chú nội bộ
- Tự tăng mã ticket và không dùng lại mã đã xóa
- Năm ticket ví dụ chỉ được thêm trong lần mở ứng dụng đầu tiên
- Xuất toàn bộ ticket thành tệp JSON để sao lưu
- Giao diện tiếng Việt, có thể sử dụng trên máy tính và màn hình nhỏ

## Công nghệ

- React và TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- localStorage thông qua lớp repository để có thể thay thế bằng một nguồn dữ liệu khác sau này

## Cài đặt

Cài Node.js 20.19+ hoặc 22.12+ và npm, sau đó chạy:

```sh
npm install
```

## Chạy trong môi trường phát triển

```sh
npm run dev
```

Mở địa chỉ cục bộ mà Vite hiển thị. Ticket được lưu trong hồ sơ trình duyệt hiện tại và không tự đồng bộ giữa các thiết bị.

## Kiểm tra và build

```sh
npm test
npm run build
```

Các tệp build production được tạo trong thư mục `dist/`. Để chạy thử bản build:

```sh
npm run preview
```
