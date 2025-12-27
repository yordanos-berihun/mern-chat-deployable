import React, { useEffect, useRef, useCallback } from 'react';

const MessagePagination = ({ onLoadMore, hasMore, loading }) => {
  const observerRef = useRef();
  const loadMoreRef = useRef();

  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const option = { root: null, rootMargin: '20px', threshold: 0 };
    observerRef.current = new IntersectionObserver(handleObserver, option);
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  return (
    <div ref={loadMoreRef} style={{ height: '20px', margin: '10px 0' }}>
      {loading && <div style={{ textAlign: 'center', color: '#999' }}>Loading more...</div>}
    </div>
  );
};

export default MessagePagination;
