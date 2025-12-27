import React, { useState, useEffect, useCallback } from 'react';
import './ImagePreview.css';

const ImagePreview = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentImage = images[currentIndex];

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setLoading(true);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setLoading(true);
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = currentImage.filename || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentImage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrevious, handleNext, handleZoomIn, handleZoomOut]);

  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
        
        <div className="image-preview-header">
          <div className="image-info">
            <span className="image-sender">{currentImage.sender}</span>
            <span className="image-date">{new Date(currentImage.date).toLocaleDateString()}</span>
          </div>
          <div className="image-actions">
            <button onClick={handleZoomOut} title="Zoom Out" disabled={zoom <= 0.5}>
              🔍-
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} title="Zoom In" disabled={zoom >= 3}>
              🔍+
            </button>
            <button onClick={handleDownload} title="Download">
              ⬇️
            </button>
            <button onClick={onClose} title="Close" className="close-btn">
              ✕
            </button>
          </div>
        </div>

        <div className="image-preview-content">
          {images.length > 1 && (
            <button className="nav-btn prev-btn" onClick={handlePrevious}>
              ‹
            </button>
          )}

          <div className="image-wrapper">
            {loading && <div className="image-loading">Loading...</div>}
            <img
              src={currentImage.url}
              alt={currentImage.filename || 'Preview'}
              style={{
                transform: `scale(${zoom})`,
                display: loading ? 'none' : 'block'
              }}
              onLoad={() => setLoading(false)}
              draggable={false}
            />
          </div>

          {images.length > 1 && (
            <button className="nav-btn next-btn" onClick={handleNext}>
              ›
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="image-preview-footer">
            <span className="image-counter">
              {currentIndex + 1} / {images.length}
            </span>
            <div className="thumbnail-strip">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`thumbnail ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoom(1);
                    setLoading(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
