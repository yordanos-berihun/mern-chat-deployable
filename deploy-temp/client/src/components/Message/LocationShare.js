import React, { useState } from 'react';
import './LocationShare.css';

const LocationShare = ({ onSend, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setLocation(loc);
        setLoading(false);
      },
      (error) => {
        alert('Failed to get location');
        setLoading(false);
      }
    );
  };

  const handleSend = () => {
    if (location) {
      onSend(location);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="location-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Share Location</h3>
        {!location ? (
          <button onClick={getCurrentLocation} disabled={loading}>
            {loading ? 'Getting location...' : '📍 Get Current Location'}
          </button>
        ) : (
          <>
            <div className="location-preview">
              <p>Latitude: {location.latitude}</p>
              <p>Longitude: {location.longitude}</p>
              <a href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer">
                View on Map
              </a>
            </div>
            <div className="location-actions">
              <button onClick={handleSend}>Send Location</button>
              <button onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationShare;
