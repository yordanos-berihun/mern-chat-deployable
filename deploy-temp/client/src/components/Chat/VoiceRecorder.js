import React, { useState, useRef } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      alert('Cannot access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      onSend(file);
    }
  };

  const handleCancel = () => {
    if (isRecording) stopRecording();
    if (audioURL) URL.revokeObjectURL(audioURL);
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      {!audioURL ? (
        <div className="recording-controls">
          {!isRecording ? (
            <button onClick={startRecording} className="btn-record">
              🎤 Start Recording
            </button>
          ) : (
            <>
              <div className="recording-indicator">
                <span className="pulse-dot"></span>
                <span className="recording-time">{formatTime(recordingTime)}</span>
                <span className="max-time">/ 2:00</span>
              </div>
              <button onClick={stopRecording} className="btn-stop">
                ⏹️ Stop
              </button>
            </>
          )}
          <button onClick={handleCancel} className="btn-cancel">
            ✕ Cancel
          </button>
        </div>
      ) : (
        <div className="recording-preview">
          <div className="audio-preview">
            <span>🎵 Voice message ({formatTime(recordingTime)})</span>
            <audio src={audioURL} controls />
          </div>
          <div className="preview-actions">
            <button onClick={handleSend} className="btn-send">
              ✓ Send
            </button>
            <button onClick={handleCancel} className="btn-cancel">
              ✕ Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
