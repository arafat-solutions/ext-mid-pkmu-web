// pkmu-web/src/components/ScreenShare.vue
<template>
  <div class="screen-share-container">
    <div v-if="error" class="text-red-500 p-4 rounded-md bg-red-50 mb-4">
      {{ error }}
    </div>
    <div v-if="isSharing" class="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md">
      Screen Sharing Active
      <button @click="stopSharing" class="ml-2 bg-blue-600 px-2 py-1 rounded">Stop</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScreenShare',
  data() {
    return {
      stream: null,
      peerConnection: null,
      wsConnection: null,
      isSharing: false,
      error: null,
      sessionId: null,
      reconnectAttempt: 0,
      maxReconnectAttempts: 3,
      pingInterval: null,
      connectionTimeout: null,
      isInitialized: false
    }
  },
  methods: {
    async initializeScreenShare() {
      if (this.isInitialized) {
        console.log('Already initialized, skipping');
        return;
      }

      try {
        console.log('Starting screen share initialization');
        this.isInitialized = true;

        // First establish WebSocket connection
        await this.establishWebSocketConnection();

        // Then request screen sharing
        await this.startScreenCapture();

      } catch (err) {
        console.error('Initialization error:', err);
        this.error = err.message;
        this.cleanup();
      }
    },

    async startScreenCapture() {
      try {
        console.log('Requesting screen sharing permission');
        this.stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor",
          },
          audio: false
        });

        // Handle stream stop
        this.stream.getVideoTracks()[0].addEventListener('ended', () => {
          console.log('Screen share stream ended by user');
          this.stopSharing();
        });

        this.isSharing = true;
        console.log('Screen sharing started successfully');

        // Now that we have both connection and stream, setup peer connection
        await this.setupPeerConnection();

      } catch (err) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Screen sharing permission denied');
        }
        throw err;
      }
    },

    async establishWebSocketConnection() {
      return new Promise((resolve, reject) => {
        const WS_URL = process.env.VUE_APP_WS_URL || 'ws://localhost:3001';
        
        console.log('Establishing WebSocket connection to:', WS_URL);

        // Clear any existing connection
        if (this.wsConnection) {
          console.log('Closing existing connection');
          this.wsConnection.close();
          this.wsConnection = null;
        }

        this.connectionTimeout = setTimeout(() => {
          if (this.wsConnection && this.wsConnection.readyState !== WebSocket.OPEN) {
            console.log('Connection timeout');
            this.wsConnection.close();
            reject(new Error('Connection timeout'));
          }
        }, 5000);

        try {
          this.wsConnection = new WebSocket(WS_URL);

          this.wsConnection.onopen = () => {
            console.log('WebSocket connected successfully');
            clearTimeout(this.connectionTimeout);
            
            // Register as sharer
            this.wsConnection.send(JSON.stringify({
              type: 'register',
              clientType: 'sharer',
              sessionId: this.sessionId || 'default-room'
            }));

            // Setup ping interval
            if (this.pingInterval) {
              clearInterval(this.pingInterval);
            }
            
            this.pingInterval = setInterval(() => {
              if (this.wsConnection?.readyState === WebSocket.OPEN) {
                this.wsConnection.send(JSON.stringify({ type: 'ping' }));
              }
            }, 20000);

            resolve();
          };

          this.wsConnection.onmessage = async (event) => {
            try {
              const message = JSON.parse(event.data);
              console.log('Received message type:', message.type);
              
              switch (message.type) {
                case 'connection':
                  this.sessionId = message.clientId;
                  console.log('Connection established with ID:', this.sessionId);
                  break;
                case 'answer':
                  await this.handleAnswer(message.answer);
                  break;
                case 'candidate':
                  await this.handleCandidate(message.candidate);
                  break;
                case 'pong':
                  console.log('Received pong from server');
                  break;
              }
            } catch (err) {
              console.error('Error handling message:', err);
            }
          };

          this.wsConnection.onclose = (event) => {
            console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
            clearTimeout(this.connectionTimeout);
            clearInterval(this.pingInterval);
            
            if (this.isSharing && !this.isClosingIntentionally) {
              if (this.reconnectAttempt < this.maxReconnectAttempts) {
                this.reconnectAttempt++;
                console.log(`Attempting to reconnect (${this.reconnectAttempt}/${this.maxReconnectAttempts})`);
                setTimeout(() => {
                  this.establishWebSocketConnection();
                }, 2000 * Math.pow(2, this.reconnectAttempt - 1));
              } else {
                console.log('Max reconnection attempts reached');
                this.error = 'Connection lost after multiple attempts';
                this.stopSharing();
              }
            }
          };

          this.wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
            clearTimeout(this.connectionTimeout);
            reject(new Error('WebSocket connection failed'));
          };

        } catch (err) {
          clearTimeout(this.connectionTimeout);
          reject(err);
        }
      });
    },

    async setupPeerConnection() {
      if (!this.stream || !this.wsConnection) {
        console.error('Cannot setup peer connection: Missing stream or connection');
        return;
      }

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      try {
        this.peerConnection = new RTCPeerConnection(configuration);

        // Add tracks to peer connection
        this.stream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.stream);
        });

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate && this.wsConnection?.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
              type: 'candidate',
              candidate: event.candidate,
              sessionId: this.sessionId
            }));
          }
        };

        // Create and send offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        if (this.wsConnection?.readyState === WebSocket.OPEN) {
          this.wsConnection.send(JSON.stringify({
            type: 'offer',
            offer: offer,
            sessionId: this.sessionId
          }));
        }
      } catch (err) {
        console.error('Error setting up peer connection:', err);
        throw err;
      }
    },

    async handleAnswer(answer) {
      try {
        if (this.peerConnection?.signalingState !== 'closed') {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    },

    async handleCandidate(candidate) {
      try {
        if (this.peerConnection?.remoteDescription && candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    },

    stopSharing() {
      console.log('Stopping screen share');
      this.isClosingIntentionally = true;
      this.cleanup();
    },

    cleanup() {
      console.log('Starting cleanup');
      
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log('Track stopped');
        });
        this.stream = null;
      }

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
        console.log('PeerConnection closed');
      }

      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.close(1000, 'Cleanup');
        console.log('WebSocket connection closed');
      }
      this.wsConnection = null;

      this.isSharing = false;
      this.error = null;
      this.sessionId = null;
      this.reconnectAttempt = 0;
      this.isInitialized = false;
      this.isClosingIntentionally = false;
      
      console.log('Cleanup completed');
    }
  },
  beforeUnmount() {
    this.cleanup();
  }
}
</script>