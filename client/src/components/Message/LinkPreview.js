import React, { useState, useEffect } from 'react';
import './LinkPreview.css';
import { api } from '../../apiClient';

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const data = await api.get(`/api/link-preview?url=${encodeURIComponent(url)}`);
        setPreview(data.data);
      } catch (error) {
        console.error('Failed to fetch preview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [url]);

  if (loading) return <div className="link-preview-loading">Loading preview...</div>;
  if (!preview) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview">
      {preview.image && <img src={preview.image} alt={preview.title} />}
      <div className="link-preview-content">
        <h4>{preview.title}</h4>
        {preview.description && <p>{preview.description}</p>}
        <span className="link-preview-url">{new URL(url).hostname}</span>
      </div>
    </a>
  );
};

export default LinkPreview;
