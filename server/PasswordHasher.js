// Import thư viện bcrypt — chuyên dùng để mã hoá (hash) mật khẩu
const bcrypt = require('bcrypt');

// Định nghĩa class PasswordHasher để gom tất cả logic hash & verify password
class PasswordHasher {
  /**
   * Hàm khởi tạo (constructor)
   * @param {number} saltRounds - số vòng lặp khi tạo salt (mặc định là 10)
   * Số này càng cao thì hash càng bảo mật nhưng cũng tốn thời gian xử lý hơn
   */
  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds; // lưu lại giá trị saltRounds để dùng trong class
  }

  /**
   * Hàm hashPassword dùng để mã hoá mật khẩu người dùng
   * @param {string} password - mật khẩu gốc (plain text)
   * @returns {Promise<string>} - trả về chuỗi mật khẩu đã được hash + salt
   */
  async hashPassword(password) {
    // bcrypt sẽ tự sinh ra salt ngẫu nhiên và kết hợp với mật khẩu để tạo hash
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Hàm verifyPassword dùng để kiểm tra mật khẩu nhập vào có đúng không
   * @param {string} password - mật khẩu người dùng nhập
   * @param {string} hashedPassword - mật khẩu đã được hash lưu trong database
   * @returns {Promise<boolean>} - true nếu đúng, false nếu sai
   */
  async verifyPassword(password, hashedPassword) {
    // bcrypt.compare() sẽ hash lại mật khẩu nhập vào rồi so sánh với hash trong DB
    return await bcrypt.compare(password, hashedPassword);
  }
}

// Xuất class ra ngoài để các file khác (AuthService.js, server.js, ...) có thể sử dụng
module.exports = PasswordHasher;
