import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, Space, Spin } from 'antd';
import { CameraOutlined, CloseOutlined } from '@ant-design/icons';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * Barcode Scanner Component using Html5-QRCode
 * Supports EAN-13, Code-128, and other common barcode formats
 */
const BarcodeScanner = ({ visible, onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = document.getElementById('barcode-reader');
    if (!element) {
      setError('Không tìm thấy phần tử máy quét');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const html5QrcodeScanner = new Html5QrcodeScanner(
        'barcode-reader',
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          supportedScanTypes: [0, 1], // 0 = Camera, 1 = File
          rememberLastUsedCamera: true,
          aspectRatio: 1.777778, // 16:9
          showTorchButtonIfSupported: true,
        },
        false
      );

      html5QrcodeScanner.render(
        async (decodedText, decodedResult) => {
          // Success callback
          console.log(`Barcode scanned: ${decodedText}`, decodedResult);
          await stopScanner();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Error callback - only log, don't show to user (normal for scanning)
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('Scan error:', errorMessage);
          }
        }
      );

      scannerRef.current = html5QrcodeScanner;
      setLoading(false);
      
      // Đổi text sang tiếng Việt
      setTimeout(() => {
        const translations = {
          'Select Camera': 'Chọn Camera',
          'Start Scanning': 'Bắt đầu quét',
          'Stop Scanning': 'Dừng quét',
          'Scan an Image File': 'Quét từ file ảnh',
          'Choose Image': 'Chọn ảnh',
          'Choose Another': 'Chọn ảnh khác',
          'Or drop an image to scan': 'Hoặc kéo thả ảnh để quét',
          'Requesting camera permissions...': 'Đang yêu cầu quyền camera...',
          'Permission denied': 'Không có quyền truy cập',
        };
        
        // Thay đổi text trong tất cả các element
        document.querySelectorAll('#barcode-reader *').forEach(el => {
          const text = el.textContent?.trim();
          if (text && translations[text]) {
            el.textContent = translations[text];
          }
          
          // Thay đổi placeholder
          if (el.placeholder && translations[el.placeholder]) {
            el.placeholder = translations[el.placeholder];
          }
        });
      }, 300);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <CameraOutlined />
          <span>Quét mã vạch</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose} icon={<CloseOutlined />}>
          Đóng
        </Button>,
      ]}
      width={600}
      destroyOnHidden
    >
      <div>
        {error && (
          <Alert
            message="Lỗi camera"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Alert
          message="Hướng dẫn quét"
          description="Đặt mã vạch vào trong khung hình. Máy quét sẽ tự động phát hiện và đọc mã vạch."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Đang mở camera..." />
          </div>
        )}

        <div
          id="barcode-reader"
          style={{
            width: '100%',
            minHeight: '300px',
            display: loading ? 'none' : 'block',
          }}
        />
        
        <style>
          {`
            #barcode-reader video {
              transform: scaleX(-1);
              -webkit-transform: scaleX(-1);
              -moz-transform: scaleX(-1);
            }
          `}
        </style>
      </div>
    </Modal>
  );
};

export default BarcodeScanner;