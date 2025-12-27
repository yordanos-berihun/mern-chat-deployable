import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export const useChatSocket = (currentUser, dispatch, addError, activeRoom) => {
  const { socketRef } = useSocket(currentUser);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const onConnect = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
      if (currentUser?._id) s.emit('userOnline', currentUser._id);
    };

    const onDisconnect = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });

    const onConnectError = (error) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      addError(`Connection failed: ${error?.message || 'Check if server is running'}`);
    };

    const onMessageEdited = ({ messageId, content, editedAt }) => {
      if (activeRoom) {
        dispatch({ type: 'EDIT_MESSAGE', roomId: activeRoom._id, messageId, content, editedAt });
      }
    };

    const onMessageDeleted = ({ messageId, deleteForEveryone }) => {
      if (activeRoom && deleteForEveryone) {
        dispatch({ type: 'DELETE_MESSAGE', roomId: activeRoom._id, messageId });
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    s.on('messageEdited', onMessageEdited);
    s.on('messageDeleted', onMessageDeleted);

    setSocket(s);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.off('messageEdited', onMessageEdited);
      s.off('messageDeleted', onMessageDeleted);
    };
  }, [socketRef, currentUser?._id, dispatch, addError, activeRoom]);

  return socket;
};
