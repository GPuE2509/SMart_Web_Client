import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Button, message, Space, Upload, Typography, Image, Card } from 'antd';
import { CameraOutlined, UploadOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

const FaceCapture = ({ 
  onFaceDetected, 
  onCapture, 
  captureButtonText = "Capture Face",
  uploadButtonText = "Upload Image",
  showLandmarks = true,
  showExpressions = false,
  referenceDescriptor = null, // For face matching
  disableUpload = false // Disable upload feature (webcam only)
}) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureMethod, setCaptureMethod] = useState('webcam'); // 'webcam' or 'upload'
  const [captureVideo, setCaptureVideo] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matchDistance, setMatchDistance] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null); // Base64 of uploaded image
  const [uploadedImageDescriptor, setUploadedImageDescriptor] = useState(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null); // Image after successful capture

  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;

  // Load models (memoized to prevent re-loading)
  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading models:", error);
      message.error("Không thể tải các mô hình nhận diện khuôn mặt.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Auto-start webcam if upload is disabled
  useEffect(() => {
    if (disableUpload && modelsLoaded && !isLoading && !captureVideo) {
      startVideo();
    }
  }, [disableUpload, modelsLoaded, isLoading]);

  useEffect(() => {
    // Cleanup stream when component unmounts or capture method changes
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [captureMethod]);

  const startVideo = () => {
    if (!modelsLoaded) {
      message.warn("Mô hình đang tải, vui lòng đợi...");
      return;
    }
    setCaptureVideo(true);
    setCaptureMethod('webcam');
    setUploadedImage(null); // Clear uploaded image when starting webcam
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          width: videoWidth,
          height: videoHeight
        } 
      })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(err => {
        console.error("Error accessing webcam:", err);
        alert("Unable to access webcam. Please ensure you have granted camera permissions.");
      });
  };

  const handleVideoOnPlay = () => {
    const intervalId = setInterval(async () => {
      if (canvasRef.current && videoRef.current) {
        const displaySize = {
          width: videoWidth,
          height: videoHeight
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()
          .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        if (resizedDetections.length === 1) {
          // Exactly one face detected
          setFaceDetected(true);
          
          // Draw face detections
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          
          if (showLandmarks) {
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
          }
          
          if (showExpressions) {
            faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
          }

          // If reference descriptor provided, calculate match distance
          if (referenceDescriptor && resizedDetections[0].descriptor) {
            const distance = faceapi.euclideanDistance(
              referenceDescriptor,
              resizedDetections[0].descriptor
            );
            setMatchDistance(distance);
            
            // Display match status on canvas
            ctx.fillStyle = distance < 0.6 ? '#00ff00' : '#ff0000';
            ctx.font = '24px Arial';
            ctx.fillText(
              distance < 0.6 ? `Match: ${(100 - distance * 100).toFixed(1)}%` : 'No Match',
              10,
              30
            );
          }

          if (onFaceDetected) {
            onFaceDetected(resizedDetections[0]);
          }
        } else if (resizedDetections.length > 1) {
          // Multiple faces detected
          setFaceDetected(false);
          setMatchDistance(null);
          
          // Draw all detections
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          
          // Display warning
          ctx.fillStyle = '#ff0000';
          ctx.font = '24px Arial';
          ctx.fillText(
            `Phát hiện ${resizedDetections.length} khuôn mặt! Chỉ 1 người duy nhất`,
            10,
            30
          );
        } else {
          // No face detected
          setFaceDetected(false);
          setMatchDistance(null);
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  };

  const closeWebcam = () => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.pause();
      streamRef.current.getTracks().forEach(track => track.stop());
      setCaptureVideo(false);
      setFaceDetected(false);
      setMatchDistance(null);
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, videoWidth, videoHeight); // Clear canvas when closing webcam
    }
  };

  const captureFace = async () => {
    if (captureMethod === 'webcam') {
      if (!faceDetected) {
        message.warn("Không tìm thấy khuôn mặt. Vui lòng đảm bảo khuôn mặt của bạn hiển thị rõ ràng.");
        return;
      }
  
      try {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
  
        if (detections) {
          // Capture image from video
          const canvas = document.createElement('canvas');
          canvas.width = videoWidth;
          canvas.height = videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0);
          const imageDataUrl = canvas.toDataURL('image/jpeg');
  
          // Save captured image
          setCapturedImage(imageDataUrl);
          message.success('Đã chụp khuôn mặt thành công!');

          if (onCapture) {
            onCapture({
              descriptor: Array.from(detections.descriptor),
              image: imageDataUrl,
              matchDistance: matchDistance
            });
          }
  
          closeWebcam();
        } else {
          message.error("Không thể phát hiện khuôn mặt từ webcam.");
        }
      } catch (error) {
        console.error("Error capturing face from webcam:", error);
        message.error("Lỗi khi chụp khuôn mặt. Vui lòng thử lại.");
      }
    } else if (captureMethod === 'upload' && uploadedImage && uploadedImageDescriptor) {
      // For uploaded image, we already have the descriptor and image data
      setCapturedImage(uploadedImage);
      message.success('Đã xác nhận ảnh thành công!');

      if (onCapture) {
        onCapture({
          descriptor: uploadedImageDescriptor,
          image: uploadedImage,
          matchDistance: null // No real-time matching for uploaded image
        });
      }
    } else {
      message.warn("Vui lòng chọn ảnh hoặc chụp khuôn mặt.");
    }
  };

  const handleUploadChange = ({ file }) => {
    // Get the actual file object (from beforeUpload it's passed directly)
    const fileObj = file instanceof File ? file : (file.originFileObj || file);
    
    if (!fileObj) {
      message.error('Không thể đọc file. Vui lòng thử lại.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setUploadedImage(base64);
      setIsProcessingUpload(true);
      setCaptureMethod('upload');
      closeWebcam(); // Close webcam if open

      try {
        // Load image to detect face and get descriptor
        const img = await faceapi.bufferToImage(fileObj);
        const detections = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections) {
          setUploadedImageDescriptor(Array.from(detections.descriptor));
          setFaceDetected(true);
          message.success('Đã phát hiện khuôn mặt từ ảnh!');
        } else {
          setUploadedImageDescriptor(null);
          setFaceDetected(false);
          message.error('Không tìm thấy khuôn mặt trong ảnh đã tải lên. Vui lòng thử ảnh khác.');
        }
      } catch (error) {
        console.error("Error processing uploaded image:", error);
        message.error('Lỗi khi xử lý ảnh. Vui lòng thử lại.');
        setUploadedImage(null);
        setUploadedImageDescriptor(null);
        setFaceDetected(false);
      } finally {
        setIsProcessingUpload(false);
      }
    };
    
    reader.onerror = () => {
      message.error('Không thể đọc file. Vui lòng thử lại.');
      setIsProcessingUpload(false);
    };
    
    reader.readAsDataURL(fileObj);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            margin: '0 auto',
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading face detection models...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!modelsLoaded) {
    return (
      <div style={{
        backgroundColor: '#fee2e2',
        border: '1px solid #f87171',
        color: '#b91c1c',
        padding: '12px 16px',
        borderRadius: '4px'
      }}>
        Failed to load face detection models. Please refresh the page.
      </div>
    );
  }

  const handleRetake = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setUploadedImageDescriptor(null);
    setFaceDetected(false);
    setCaptureMethod('webcam');
    // Automatically start webcam after retake
    setTimeout(() => startVideo(), 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff' }}>
      {!capturedImage && !disableUpload && (
        <Space style={{ marginBottom: '16px' }}>
          <Button 
            type={captureMethod === 'webcam' ? 'primary' : 'default'} 
            icon={<CameraOutlined />} 
            onClick={startVideo}
            disabled={isLoading || !modelsLoaded}
          >
            Sử dụng Webcam
          </Button>
          <Upload 
            beforeUpload={(file) => {
              // Process file immediately
              handleUploadChange({ file });
              return false; // Prevent upload
            }}
            showUploadList={false}
            accept="image/jpeg,image/png,image/jpg"
            disabled={isLoading || !modelsLoaded}
            maxCount={1}
          >
            <Button 
              type={captureMethod === 'upload' ? 'primary' : 'default'} 
              icon={<UploadOutlined />}
              disabled={isLoading || !modelsLoaded}
            >
              {uploadButtonText}
            </Button>
          </Upload>
        </Space>
      )}

      <div style={{ position: 'relative', width: videoWidth, height: videoHeight, marginBottom: '16px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
        {capturedImage ? (
          <div style={{ width: videoWidth, height: videoHeight, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
            <Image src={capturedImage} alt="Captured Face" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} preview={false} />
            <Card size="small" style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', borderColor: '#52c41a', background: '#f6ffed' }}>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text type="success">Đã chụp thành công!</Text>
              </Space>
            </Card>
          </div>
        ) : (
          <>
            {captureMethod === 'webcam' && (
              <>
                <video 
                  ref={videoRef} 
                  onPlay={handleVideoOnPlay} 
                  width={videoWidth} 
                  height={videoHeight} 
                  style={{ display: captureVideo ? 'block' : 'none' }} 
                  muted 
                />
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, display: captureVideo ? 'block' : 'none' }} />
                {!captureVideo && (
                  <div style={{ width: videoWidth, height: videoHeight, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', color: '#8c8c8c' }}>
                    <Text type="secondary">Vui lòng bật Webcam để bắt đầu</Text>
                  </div>
                )}
                {captureVideo && (
                  <Card size="small" style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', borderColor: faceDetected ? '#52c41a' : '#ff4d4f', background: faceDetected ? '#f6ffed' : '#fff1f0' }}>
                    <Space>
                      {faceDetected ? (
                        <>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <Text type="success">Khuôn mặt đã sẵn sàng!</Text>
                        </>
                      ) : (
                        <>
                          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                          <Text type="danger">Chưa phát hiện khuôn mặt</Text>
                        </>
                      )}
                    </Space>
                  </Card>
                )}
              </>
            )}

            {captureMethod === 'upload' && (
              <div style={{ width: videoWidth, height: videoHeight, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', position: 'relative' }}>
                {uploadedImage ? (
                  <>
                    <Image src={uploadedImage} alt="Uploaded Face" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    {!faceDetected && !isProcessingUpload && (
                      <Card size="small" style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', borderColor: '#ff4d4f', background: '#fff1f0' }}>
                        <Space>
                          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                          <Text type="danger">Không tìm thấy khuôn mặt trong ảnh!</Text>
                        </Space>
                      </Card>
                    )}
                    {faceDetected && !isProcessingUpload && (
                      <Card size="small" style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', borderColor: '#52c41a', background: '#f6ffed' }}>
                        <Space>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <Text type="success">Đã phát hiện khuôn mặt thành công!</Text>
                        </Space>
                      </Card>
                    )}
                  </>
                ) : (
                  <Text type="secondary">Vui lòng tải lên ảnh khuôn mặt của bạn</Text>
                )}
                {isProcessingUpload && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{
                      margin: '0 auto',
                      width: '32px',
                      height: '32px',
                      border: '3px solid #f3f4f6',
                      borderTop: '3px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '8px', color: '#6b7280' }}>Đang xử lý ảnh...</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {capturedImage ? (
        <Button 
          type="default" 
          icon={<ReloadOutlined />}
          onClick={handleRetake} 
          style={{ width: '100%' }}
        >
          Chụp lại
        </Button>
      ) : (
        <Button 
          type="primary" 
          onClick={captureFace} 
          disabled={
            isLoading || 
            isProcessingUpload ||
            (captureMethod === 'webcam' && !faceDetected) || 
            (captureMethod === 'upload' && (!uploadedImage || !faceDetected))
          }
          style={{ width: '100%' }}
        >
          {captureButtonText}
        </Button>
      )}
    </div>
  );
};

export default FaceCapture;
