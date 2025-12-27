import React, { useEffect, useRef, useState } from 'react';
import './VideoCall.css';

const VideoCall = ({ socket, currentUser, targetUser, onClose, isVideoCall = true }) => {
  const [localStream, setLocalStream] = useState(null);
  const [callStatus, setCallStatus] = useState('Calling...');
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnectionRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus('Connected');
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) socket.emit('call:ice-candidate', { to: targetUser.socketId, candidate: event.candidate });
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { to: targetUser.socketId, offer, from: currentUser });
      } catch (error) {
        setCallStatus('Failed');
      }
    };

    initCall();

    socket.on('call:answer', async ({ answer }) => {
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('call:ice-candidate', async ({ candidate }) => {
      await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('call:end', () => endCall());

    return () => {
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:end');
    };
  }, [socket, targetUser, currentUser, isVideoCall]);

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    socket.emit('call:end', { to: targetUser.socketId });
    onClose();
  };

  const toggleVideo = () => {
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
  };

  const toggleAudio = () => {
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
  };

  return (
    <div className="video-call-modal">
      <div className="video-call-container">
        <div className="call-header">
          <h3>{targetUser.name}</h3>
          <span>{callStatus}</span>
        </div>
        <div className="video-streams">
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          {isVideoCall && <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />}
        </div>
        <div className="call-controls">
          {isVideoCall && <button onClick={toggleVideo}>📹</button>}
          <button onClick={toggleAudio}>🎤</button>
          <button onClick={endCall} className="end-call">📞</button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
