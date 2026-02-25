import { useState, useEffect } from 'react';
import { Spin } from 'antd';
import authService from '../../services/authService';
import StaffAttendance from '../StaffAttendance';

function SellerAttendance() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <div>Không thể tải thông tin người dùng</div>;
  }

  return <StaffAttendance userId={user._id} userName={user.full_name} />;
}

export default SellerAttendance;
