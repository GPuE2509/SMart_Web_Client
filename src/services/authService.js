import axiosInstance from './axios';
import Cookies from 'js-cookie';

const authService = {
  // Đăng nhập
  SignIn: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/signin', {
        email,
        password,
      });

      if (response.data.token) {
        // Lưu token vào cookie (expires sau 7 ngày)
        Cookies.set('token', response.data.token, { expires: 7 });
        
        // Nếu có thông tin user, lưu luôn
        if (response.data.user) {
          Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
        }
      }

      return response.data;
    } catch (error) {
      // Ném error với format chuẩn, ưu tiên error trước message
      const errorData = error.response?.data || {};
      throw {
        status: error.response?.status,
        message: errorData.error,
        ...errorData
      };
    }
  },

  // Đăng xuất
  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
  },

  // Lấy token hiện tại
  getToken: () => {
    return Cookies.get('token');
  },

  // Lấy thông tin user
  getUser: () => {
    const user = Cookies.get('user');
    return user ? JSON.parse(user) : null;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!Cookies.get('token');
  },
};

export default authService;
