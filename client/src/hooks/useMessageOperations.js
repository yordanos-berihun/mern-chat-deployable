import { useCallback } from 'react';

export const useMessageOperations = (apiCall, dispatch, addError, currentUser, activeRoom, socket) => {
  const handleEditMessage = useCallback(async (messageId, content) => {
    try {
      const response = await apiCall(`/api/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content, userId: currentUser._id })
      });
      if (response.ok) {
        dispatch({ type: 'EDIT_MESSAGE', roomId: activeRoom._id, messageId, content, editedAt: new Date() });
        if (socket) socket.emit('messageEdited', { messageId, content, roomId: activeRoom._id });
        return true;
      }
      throw new Error('Failed to edit message');
    } catch (error) {
      addError(error.message || 'Failed to edit message');
      return false;
    }
  }, [apiCall, dispatch, addError, currentUser, activeRoom, socket]);

  const handleDeleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
    if (!window.confirm(deleteForEveryone ? 'Delete for everyone?' : 'Delete for you?')) return;
    try {
      const response = await apiCall(`/api/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentUser._id, deleteForEveryone })
      });
      if (response.ok) {
        dispatch({ type: 'DELETE_MESSAGE', roomId: activeRoom._id, messageId });
        if (socket) socket.emit('messageDeleted', { messageId, roomId: activeRoom._id, deleteForEveryone });
      }
    } catch (error) {
      addError(error.message || 'Failed to delete message');
    }
  }, [currentUser, activeRoom, apiCall, dispatch, socket, addError]);

  const forwardMessage = useCallback(async (forwardingMessage, selectedRoomIds) => {
    if (!forwardingMessage || selectedRoomIds.length === 0) return;
    try {
      const response = await apiCall(`/api/messages/${forwardingMessage._id}/forward`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser._id, targetRoomIds: selectedRoomIds })
      });
      if (response.ok) {
        const data = await response.json();
        addError(`Message forwarded to ${data.data.count} chat(s)`, 'success');
        return true;
      }
      throw new Error('Failed to forward message');
    } catch (error) {
      addError(error.message || 'Failed to forward message');
      return false;
    }
  }, [currentUser, apiCall, addError]);

  return { handleEditMessage, handleDeleteMessage, forwardMessage };
};
