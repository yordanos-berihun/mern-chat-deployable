import React, { createContext, useContext, useReducer, useEffect } from 'react';

const ChatContext = createContext();

const initialState = {
  rooms: [],
  activeRoom: null,
  messages: {},
  users: [],
  unreadCounts: {},
  isConnected: false,
  optimisticMessages: {},
  typingUsers: {},
  preferences: {
    notifications: true,
    sound: true,
    theme: 'light'
  }
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    
    case 'SET_ACTIVE_ROOM':
      return { ...state, activeRoom: action.payload };
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: action.payload
        }
      };
    
    case 'ADD_MESSAGE':
      const roomMessages = state.messages[action.roomId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: [...roomMessages, action.payload]
        }
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: (state.messages[action.roomId] || []).map(msg =>
            msg._id === action.messageId ? action.payload : msg
          )
        }
      };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.roomId]: action.count
        }
      };
    
    case 'ADD_OPTIMISTIC_MESSAGE':
      const optimistic = state.optimisticMessages[action.roomId] || [];
      return {
        ...state,
        optimisticMessages: {
          ...state.optimisticMessages,
          [action.roomId]: [...optimistic, action.payload]
        }
      };
    
    case 'REMOVE_OPTIMISTIC_MESSAGE':
      return {
        ...state,
        optimisticMessages: {
          ...state.optimisticMessages,
          [action.roomId]: (state.optimisticMessages[action.roomId] || [])
            .filter(msg => msg._id !== action.messageId)
        }
      };
    
    case 'EDIT_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: (state.messages[action.roomId] || []).map(msg =>
            msg._id === action.messageId
              ? { ...msg, content: action.content, isEdited: true, editedAt: action.editedAt }
              : msg
          )
        }
      };
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: (state.messages[action.roomId] || [])
            .filter(msg => msg._id !== action.messageId)
        }
      };
    
    case 'ADD_REACTION':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: (state.messages[action.roomId] || []).map(msg =>
            msg._id === action.messageId
              ? { ...msg, reactions: action.reactions }
              : msg
          )
        }
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: (state.messages[action.roomId] || []).map(msg =>
            msg._id === action.messageId
              ? { ...msg, readBy: action.readBy }
              : msg
          )
        }
      };
    
    case 'SET_TYPING':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.roomId]: action.payload
        }
      };
    
    case 'SET_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('chatState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    const stateToSave = {
      preferences: state.preferences,
      unreadCounts: state.unreadCounts
    };
    localStorage.setItem('chatState', JSON.stringify(stateToSave));
  }, [state.preferences, state.unreadCounts]);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatState = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatState must be used within ChatProvider');
  }
  return context;
};