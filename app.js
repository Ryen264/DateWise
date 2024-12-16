// 1. Import thư viện Express
const express = require('express');

// 2. Khởi tạo ứng dụng Express
const app = express();

// 3. Định nghĩa port
const port = 3000;

// 4. Định nghĩa route cho đường dẫn gốc ("/")
app.get('/', (req, res) => {
  res.send('Xin chào từ Express!');
});

// 5. Lắng nghe kết nối trên port đã định nghĩa
app.listen(port, () => {
  console.log(`Server đang lắng nghe trên cổng ${port}`);
});