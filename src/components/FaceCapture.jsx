import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceCapture = ({ 
  onFaceDetected, 
  onCapture, 
  captureButtonText = "Capture Face",
  showLandmarks = true,
  showExpressions = false,
  referenceDescriptor = null // For face matching
}) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matchDistance, setMatchDistance] = useState(null);

  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;

  useEffect(() => {
    const loadModels = async () => {
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
        setIsLoading(false);
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
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

        if (resizedDetections.length > 0) {
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
        } else {
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
    }
  };

  const captureFace = async () => {
    if (!faceDetected) {
      alert("No face detected. Please ensure your face is visible.");
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

        if (onCapture) {
          onCapture({
            descriptor: Array.from(detections.descriptor),
            image: imageDataUrl,
            matchDistance: matchDistance
          });
        }

        closeWebcam();
      }
    } catch (error) {
      console.error("Error capturing face:", error);
      alert("Error capturing face. Please try again.");
    }
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

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {!captureVideo ? (
          <button
            onClick={startVideo}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Open Camera
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={captureFace}
              disabled={!faceDetected}
              style={{
                backgroundColor: faceDetected ? '#22c55e' : '#d1d5db',
                color: faceDetected ? 'white' : '#6b7280',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: faceDetected ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (faceDetected) e.target.style.backgroundColor = '#16a34a';
              }}
              onMouseOut={(e) => {
                if (faceDetected) e.target.style.backgroundColor = '#22c55e';
              }}
            >
              {captureButtonText}
            </button>
            <button
              onClick={closeWebcam}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              Close Camera
            </button>
          </div>
        )}
      </div>

      {captureVideo && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <video
            ref={videoRef}
            height={videoHeight}
            width={videoWidth}
            onPlay={handleVideoOnPlay}
            style={{ borderRadius: '10px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
            autoPlay
            muted
          />
          <canvas
            ref={canvasRef}
            width={videoWidth}
            height={videoHeight}
            style={{ position: 'absolute', top: 0, left: 0, borderRadius: '10px' }}
          />
          {!faceDetected && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px'
            }}>
              Please position your face in the frame
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
