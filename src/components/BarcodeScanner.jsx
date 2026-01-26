import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, Space, Spin, Tabs, Upload, message } from 'antd';
import { CameraOutlined, CloseOutlined, FileImageOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Barcode Scanner Component using Html5-QRCode
 * Supports EAN-13, Code-128, and other common barcode formats
 */
const BarcodeScanner = ({ visible, onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('camera');
  const html5QrCodeRef = useRef(null);
  const isMountedRef = useRef(false);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const startCameraScanner = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize Html5Qrcode if not exists
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      }

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 150 },
        aspectRatio: 1.777778,
        formatsToSupport: [
          0,  // QR_CODE
          8,  // EAN_13
          9,  // EAN_8
          13, // CODE_128
          14, // CODE_39
          15, // CODE_93
          11, // UPC_A
          12, // UPC_E
        ],
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText, decodedResult) => {
          if (!isMountedRef.current) return;
          console.log(`Barcode scanned: ${decodedText}`, decodedResult);
          await stopScanner();
          onScan(decodedText);
          message.success(`Đã quét: ${decodedText}`);
        },
        () => {
          // Ignore scanning errors (normal when no barcode in view)
        }
      );

      setScanning(true);
      setLoading(false);
    } catch (err) {
      console.error('Failed to start camera:', err);
      let errorMsg = 'Không thể truy cập camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Bạn đã từ chối quyền truy cập camera.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'Không tìm thấy camera trên thiết bị.';
      } else if (err.name === 'NotReadableError') {
        errorMsg += 'Camera đang được sử dụng bởi ứng dụng khác.';
      } else {
        errorMsg += err.message || 'Vui lòng kiểm tra quyền truy cập.';
      }
      
      setError(errorMsg);
      setLoading(false);
      setScanning(false);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      setError(null);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      }

      const result = await html5QrCodeRef.current.scanFile(file, true);
      console.log(`Barcode from file: ${result}`, result);
      onScan(result);
      message.success(`Đã quét: ${result}`);
    } catch (err) {
      console.error('Failed to scan file:', err);
      message.error('Không tìm thấy mã vạch trong ảnh');
      setError('Không tìm thấy mã vạch trong ảnh. Vui lòng thử ảnh khác.');
    } finally {
      setLoading(false);
    }
    
    return false; // Prevent default upload
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (visible && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, activeTab]);

  const handleClose = async () => {
    await stopScanner();
    setError(null);
    onClose();
  };

  const handleTabChange = async (key) => {
    await stopScanner();
    setActiveTab(key);
    setError(null);
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
      width={650}
      destroyOnClose
    >
      <div>
        {error && (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane
            tab={
              <span>
                <VideoCameraOutlined />
                Quét bằng camera
              </span>
            }
            key="camera"
          >
            <Alert
              message="Hướng dẫn"
              description="Đặt mã vạch vào trong khung hình màu đỏ. Camera sẽ tự động phát hiện và đọc mã."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" tip="Đang mở camera..." />
              </div>
            )}

            <div
              id="barcode-reader"
              style={{
                width: '100%',
                minHeight: loading ? '0' : '400px',
                display: loading ? 'none' : 'block',
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <FileImageOutlined />
                Tải ảnh lên
              </span>
            }
            key="file"
          >
            <Alert
              message="Hướng dẫn"
              description="Chọn hoặc kéo thả ảnh chứa mã vạch để quét. Hỗ trợ JPG, PNG."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Upload.Dragger
              name="file"
              accept="image/*"
              multiple={false}
              beforeUpload={handleFileUpload}
              showUploadList={false}
              disabled={loading}
            >
              <p className="ant-upload-drag-icon">
                <FileImageOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">Nhấn hoặc kéo ảnh vào đây để quét</p>
              <p className="ant-upload-hint">
                Hỗ trợ: JPG, PNG, JPEG
              </p>
            </Upload.Dragger>

            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin tip="Đang quét ảnh..." />
              </div>
            )}
          </Tabs.TabPane>
        </Tabs>
        
        <style>
          {`
            #barcode-reader video {
              width: 100% !important;
              border-radius: 8px;
            }
            #barcode-reader canvas {
              display: none;
            }
          `}
        </style>
      </div>
    </Modal>
  );
};

export default BarcodeScanner;