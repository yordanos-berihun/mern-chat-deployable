import React, { useState, useEffect, useRef } from 'react';
import './VideoCall.css';

const VideoCall = ({ socket, currentUser, targetUser, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    startLocalStream();
    setupSocketListeners();
    
    return () => {
      endCall();
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Cannot access camera/microphone');
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(config);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', {
          to: targetUser.socketId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    return pc;
  };

  const startCall = async () => {
    setIsCalling(true);
    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('call:offer', {
      to: targetUser.socketId,
      offer: offer,
      from: currentUser
    });
  };

  const setupSocketListeners = () => {
    socket.on('call:offer', async ({ offer, from, fromUser }) => {
      if (window.confirm(`${fromUser.name} is calling. Accept?`)) {
        const pc = createPeerConnection();
        peerConnectionRef.current = pc;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call:answer', { to: from, answer });
        setIsCalling(true);
      }
    });

    socket.on('call:answer', async ({ answer }) => {
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('call:ice-candidate', async ({ candidate }) => {
      await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('call:end', () => {
      endCall();
    });
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    socket.emit('call:end', { to: targetUser?.socketId });
    onClose();
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        <div className="video-grid">
          <div className="video-box remote">
            <video ref={remoteVideoRef} autoPlay playsInline />
            {!remoteStream && <div className="waiting">Waiting for {targetUser.name}...</div>}
          </div>
          <div className="video-box local">
            <video ref={localVideoRef} autoPlay playsInline muted />
          </div>
        </div>
        
        <div className="call-controls">
          {!isCalling && (
            <button onClick={startCall} className="btn-call">📞 Call</button>
          )}
          <button onClick={toggleAudio} className={`btn-control ${!isAudioEnabled ? 'disabled' : ''}`}>
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>
          <button onClick={toggleVideo} className={`btn-control ${!isVideoEnabled ? 'disabled' : ''}`}>
            {isVideoEnabled ? '📹' : '📵'}
          </button>
          <button onClick={endCall} className="btn-end">❌ End</button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
