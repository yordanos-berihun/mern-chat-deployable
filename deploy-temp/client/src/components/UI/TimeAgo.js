import React, { useState, useEffect } from 'react';

const TimeAgo = ({ date }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const messageDate = new Date(date);
      const seconds = Math.floor((now - messageDate) / 1000);

      if (seconds < 60) {
        setTimeAgo('just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      } else if (seconds < 604800) {
        const days = Math.floor(seconds / 86400);
        setTimeAgo(`${days}d ago`);
      } else {
        setTimeAgo(messageDate.toLocaleDateString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date]);

  return <span title={new Date(date).toLocaleString()}>{timeAgo}</span>;
};

export default TimeAgo;
