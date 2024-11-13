<template>
  <div ref="container" class="coordination-test">
    <div class="countdown">{{ formattedTime }}</div>
    <canvas ref="canvas"></canvas>
    <img src="@/assets/airplane-icon.png" alt="Airplane" :style="airplaneStyle" class="airplane"
      :class="{ 'out-of-target': !isAligned, 'in-target': isAligned }" />

    <!-- Training Modal -->
    <div v-if="showTrainingModal" class="modal">
      <div class="modal-content">
        <h2>Training Mode</h2>
        <p>Anda akan melakukan latihan yang bertujuan agar anda paham apa yang harus anda lakukan dalam ujian ini.</p>
        <p>Anda akan diberikan waktu 30 detik untuk berlatih.</p>
        <p>Gunakan joystick untuk menggerakkan pesawat dan throttle untuk mengatur kecepatan.</p>
        <p>Perhatikan posisi pesawat dan marker pada layar.</p>
        <p>Latihan akan dimulai setelah anda menekan tombol di bawah.</p>
        <button @click="startTraining" class="modal-button">Mulai Training</button>
      </div>
    </div>

    <!-- Test Start Modal -->
    <div v-if="showTestModal" class="modal">
      <div class="modal-content">
        <h2>Mulai Ujian</h2>
        <p>Latihan telah selesai! Anda akan memulai ujian yang sebenarnya.</p>
        <p>Ujian akan berlangsung selama 1 menit.</p>
        <p>Ingat untuk tetap fokus dan konsentrasi.</p>
        <button @click="startActualTest" class="modal-button">Mulai Ujian</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import * as THREE from 'three';

// Configuration constants with reduced speeds
const CONFIG = {
  PERSPECTIVE_SPEED: {
    DISABLED: 0,
    SLOW: 0.0003,    // Reduced from 0.0005
    MEDIUM: 0.0005,   // Reduced from 0.001
    FAST: 0.001      // Reduced from 0.002
  },
  PERSPECTIVE_INTERVAL: 5000,
  BACKWARD_SPEED: {
    LOW: 0.005,      // Reduced from 0.01
    MEDIUM: 0.015,   // Reduced from 0.03
    HIGH: 0.025      // Reduced from 0.05
  },
  MAX_BACKWARD_POSITION: 5.5,
  MIN_FORWARD_POSITION: -4.5,
  PLANE_ROTATION_SPEED: 0.03,  // Reduced from 0.05
  MAX_PLANE_ROTATION: Math.PI / 4,
  ALIGNMENT_THRESHOLD: 0.5,
  RANDOM_BACKWARD_CHANCE: 0.02, // 2% chance per frame
  RANDOM_BACKWARD_SPEED: 0.02,
  TRAINING_DURATION: 5 * 1000,
  TEST_DURATION: 10 * 1000
};

export default {
  name: 'PilotCoordinationTest',
  setup() {
    // Refs for template
    const container = ref(null);
    const canvas = ref(null);
    let animationFrameId = null;

    // Three.js objects
    let scene, camera, renderer, box, marker;

    // State management
    const markerPosition = ref({ x: 0, y: -4.5, z: 0 });
    const perspectiveOffset = ref(0);
    const airplanePosition = ref({ x: 0, y: 0, z: 0 });
    const airplaneRotation = ref({ x: 0, y: 0, z: 0 });
    let originalVertices;

    // Input devices
    const gamepad = ref(null);
    const thruster = ref(null);
    const gamepadConnected = ref(false);
    const thrustConnected = ref(false);

    // Game state
    const timeRemaining = ref(0);
    const userInputs = ref([]);
    const startTime = ref(null);
    const showTrainingModal = ref(true);
    const showTestModal = ref(false);
    const isTrainingMode = ref(true);

    // Animation timing
    let lastPerspectiveChange = 0;
    let perspectiveDirection = 1;
    let lastMetricRecordTime = 0;

    const currentConfig = {
      perspectiveSpeed: CONFIG.PERSPECTIVE_SPEED.MEDIUM,
      backwardSpeed: CONFIG.BACKWARD_SPEED.MEDIUM
    };

    const schedule = JSON.parse(localStorage.getItem('scheduleData'));
    const test = schedule.tests.find((t) => t.name === "Multidimensional Coordination Test");
    const batteryTestId = test.id;
    const configs = test.configs;
    console.log('Test config', configs, batteryTestId);

    // Computed properties with updated alignment check
    const isAligned = computed(() => {
      // Adjust x position check based on perspective offset
      const adjustedX = airplanePosition.value.x - perspectiveOffset.value;
      const dx = Math.abs(adjustedX - markerPosition.value.x);
      const dy = Math.abs(airplanePosition.value.y - markerPosition.value.y);
      return dx < CONFIG.ALIGNMENT_THRESHOLD && dy < CONFIG.ALIGNMENT_THRESHOLD;
    });

    const formattedTime = computed(() => {
      const seconds = Math.ceil(timeRemaining.value / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    });

    const airplaneStyle = computed(() => ({
      transform: `translate3d(${airplanePosition.value.x * 50}px, ${airplanePosition.value.y * -50}px, ${airplanePosition.value.z * -10}px) 
                  rotateZ(${airplaneRotation.value.z}rad) 
                  rotateX(${airplaneRotation.value.x}rad) 
                  rotateY(${airplaneRotation.value.y}rad) 
                  scale(${5 - airplanePosition.value.z / 10})`,
    }));

    // Scene initialization
    const initScene = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true });
      renderer.setSize(container.value.clientWidth, container.value.clientHeight);

      // Create box geometry
      const geometry = new THREE.BufferGeometry();
      originalVertices = new Float32Array([
        -8, -5, -5, 8, -5, -5, 8, 5, -5, -8, 5, -5,
        -8, -5, 5, 8, -5, 5, 8, 5, 5, -8, 5, 5,
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(originalVertices.slice(), 3));

      const indices = [
        0, 1, 2, 0, 2, 3,  // back
        1, 5, 6, 1, 6, 2,  // right
        4, 0, 3, 4, 3, 7,  // left
        3, 2, 6, 3, 6, 7,  // top
        4, 5, 1, 4, 1, 0   // bottom
      ];
      geometry.setIndex(indices);

      // Set colors
      const colors = new Float32Array(originalVertices.length);
      for (let i = 0; i < colors.length; i += 3) {
        const z = originalVertices[i + 2];
        const t = 1 - (z + 5) / 10;
        colors[i] = 0.529 + 0.471 * t;
        colors[i + 1] = 0.808 + 0.192 * t;
        colors[i + 2] = 0.922 + 0.078 * t;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: false });
      box = new THREE.Mesh(geometry, material);
      scene.add(box);

      // Create marker
      const markerGeometry = new THREE.ConeGeometry(0.5, 1, 32);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
      marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = Math.PI;
      marker.position.set(markerPosition.value.x, markerPosition.value.y, markerPosition.value.z);
      scene.add(marker);

      camera.position.z = 20;
    };

    // Game state management
    const startTraining = () => {
      console.log('Starting training mode...');
      showTrainingModal.value = false;
      isTrainingMode.value = true;
      startTime.value = Date.now();
      timeRemaining.value = CONFIG.TRAINING_DURATION;
      userInputs.value = [];
      resetAirplanePosition();
    };

    const startActualTest = () => {
      console.log('Starting actual test...');
      showTestModal.value = false;
      isTrainingMode.value = false;
      startTime.value = Date.now();
      timeRemaining.value = CONFIG.TEST_DURATION;
      userInputs.value = [];
      resetAirplanePosition();
    };

    const resetAirplanePosition = () => {
      airplanePosition.value = { x: 0, y: 0, z: 0 };
      airplaneRotation.value = { x: 0, y: 0, z: 0 };
    };

    const finishSim = async () => {
      const alignmentScore = userInputs.value.filter(input => input.type === 'correct').length;
      const totalInputs = userInputs.value.length;
      const accuracyPercentage = (alignmentScore / totalInputs) * 100;

      const avgDeviations = userInputs.value.reduce((acc, curr) => {
        acc.x += Math.abs(curr.deviations.x);
        acc.y += Math.abs(curr.deviations.y);
        acc.z += Math.abs(curr.deviations.z);
        return acc;
      }, { x: 0, y: 0, z: 0 });

      avgDeviations.x /= totalInputs;
      avgDeviations.y /= totalInputs;
      avgDeviations.z /= totalInputs;

      const scores = {
        alignmentScore,
        accuracyPercentage,
        totalAttempts: totalInputs,
        averageDeviations: avgDeviations,
        timeSpent: CONFIG.TEST_DURATION - timeRemaining.value,
        graph_data: userInputs.value
      };
      const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
      const test = scheduleData.tests.find((t) => t.name === "Multidimensional Coordination Test");
      const payload = {
        'testSessionId': scheduleData.sessionId,
        'userId': scheduleData.userId,
        'moduleId': scheduleData.moduleId,
        'batteryTestId': test.id,
        'result': scores,
      };


      console.log('Simulation completed! Final scores:', scores);
      const API_URL = process.env.VUE_APP_API_URL;
      try {
        const response = await fetch(`${API_URL}/api/submission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        console.log('Test results submitted:', data);
      } catch (error) {
        console.error('Error submitting test results:', error);
      }
      return scores;
    };

    // Animation loop with random backward movement
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = Date.now();

      // Update time and check for completion
      if (startTime.value) {
        timeRemaining.value = Math.max(0, (isTrainingMode.value ? CONFIG.TRAINING_DURATION : CONFIG.TEST_DURATION) - (now - startTime.value));

        if (timeRemaining.value === 0) {
          if (isTrainingMode.value) {
            showTestModal.value = true;
          } else {
            finishSim();
            // Cancel animation loop
            cancelAnimationFrame(animationFrameId);
          }
          return;
        }
      }

      // Update perspective
      if (now - lastPerspectiveChange > CONFIG.PERSPECTIVE_INTERVAL) {
        perspectiveDirection *= -1;
        lastPerspectiveChange = now;
      }
      perspectiveOffset.value += currentConfig.perspectiveSpeed * perspectiveDirection;

      // Update box vertices
      const positions = box.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        if (originalVertices[i + 2] > 0) {
          positions[i] = originalVertices[i] + perspectiveOffset.value;
        } else {
          positions[i] = originalVertices[i];
        }
      }
      box.geometry.attributes.position.needsUpdate = true;

      // Update marker
      markerPosition.value.x = perspectiveOffset.value;
      marker.position.x = markerPosition.value.x;

      // Random backward movement
      if (Math.random() < CONFIG.RANDOM_BACKWARD_CHANCE) {
        airplanePosition.value.z += CONFIG.RANDOM_BACKWARD_SPEED;
      }

      // Regular backward drift
      if (airplanePosition.value.z < CONFIG.MAX_BACKWARD_POSITION) {
        airplanePosition.value.z += currentConfig.backwardSpeed;
      }

      // Handle gamepad input
      if (gamepadConnected.value) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[gamepad.value.index];

        if (gp) {
          // X-axis movement (reduced sensitivity)
          const xMovement = gp.axes[0] * 0.05;
          airplanePosition.value.x += xMovement;
          airplanePosition.value.x = Math.max(-4.5, Math.min(4.5, airplanePosition.value.x));

          // Y-axis movement (reversed and reduced sensitivity)
          const yMovement = gp.axes[1] * 0.05; // Removed negative sign to reverse
          airplanePosition.value.y += yMovement;
          airplanePosition.value.y = Math.max(-4.5, Math.min(4.5, airplanePosition.value.y));

          // Rotations
          const targetRotation = xMovement * CONFIG.MAX_PLANE_ROTATION;
          airplaneRotation.value.z += (targetRotation - airplaneRotation.value.z) * CONFIG.PLANE_ROTATION_SPEED;

          const targetPitch = yMovement * CONFIG.MAX_PLANE_ROTATION;
          airplaneRotation.value.x += (targetPitch - airplaneRotation.value.x) * CONFIG.PLANE_ROTATION_SPEED;
        }
      }

      // Handle thruster input with reduced sensitivity
      if (thrustConnected.value) {
        const gamepads = navigator.getGamepads();
        const th = gamepads[thruster.value.index];

        if (th) {
          // Reduced throttle sensitivity
          airplanePosition.value.z -= (th.axes[2] + 1) * 0.03;  // Reduced from 0.05
          airplanePosition.value.z = Math.max(CONFIG.MIN_FORWARD_POSITION, Math.min(CONFIG.MAX_BACKWARD_POSITION, airplanePosition.value.z));
        }
      }

      // Record metrics
      if (now - lastMetricRecordTime >= 1000) {
        userInputs.value.push({
          type: isAligned.value ? 'correct' : 'wrong',
          deviations: {
            x: airplanePosition.value.x - (markerPosition.value.x + perspectiveOffset.value), // Adjusted for perspective
            y: airplanePosition.value.y - markerPosition.value.y,
            z: airplanePosition.value.z - markerPosition.value.z,
          },
          timestamp: now - startTime.value
        });
        lastMetricRecordTime = now;
      }

      renderer.render(scene, camera);
    };

    const onGamepadConnected = (e) => {
      console.log('Connected:', e);
      if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
        console.log("Correct gamepad connected:", e.gamepad);
        gamepad.value = e.gamepad;
        gamepadConnected.value = true;
      } else if (e.gamepad.id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
        console.log("Correct thruster connected:", e.gamepad);
        thruster.value = e.gamepad;
        thrustConnected.value = true;
      }
    };

    const onGamepadDisconnected = (e) => {
      if (gamepad.value && e.gamepad.index === gamepad.value.index) {
        gamepad.value = null;
        gamepadConnected.value = false;
      } else if (thruster.value && e.gamepad.index === thruster.value.index) {
        thruster.value = null;
        thrustConnected.value = false;
      }
    };

    onMounted(() => {
      initScene();
      animate();
      window.addEventListener('gamepadconnected', onGamepadConnected);
      window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
    });

    onUnmounted(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
    });

    return {
      container,
      canvas,
      airplaneStyle,
      isAligned,
      formattedTime,
      showTrainingModal,
      showTestModal,
      startTraining,
      startActualTest,
    };
  }
}
</script>

<style scoped>
.coordination-test {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.airplane {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  transform-origin: center;
}

.out-of-target {
  filter: drop-shadow(0 0 5px red);
}

.in-target {
  filter: drop-shadow(0 0 5px green);
}

.countdown {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 24px;
  z-index: 10;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  max-width: 500px;
}

.modal-button {
  background-color: blue;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 1rem;
}

.modal-button:hover {
  background-color: darkblue;
}
</style>