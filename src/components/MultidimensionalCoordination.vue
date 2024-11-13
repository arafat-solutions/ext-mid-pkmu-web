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
        <p>Ujian akan berlangsung sesuai dengan waktu yang ditentukan.</p>
        <p>Ingat untuk tetap fokus dan konsentrasi.</p>
        <button @click="startActualTest" class="modal-button">Mulai Ujian</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import * as THREE from 'three';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils';

// Intensity level configurations
const ANOMALI_INTENSITY = {
  LOW: 0.02,
  MEDIUM: 0.04,
  HIGH: 0.06
};

const TURBULENCE_INTENSITY = {
  LOW: 0.0003,
  MEDIUM: 0.0005,
  HIGH: 0.001
};

const POV_CHANGE_SPEED = {
  SLOW: 5000,
  MEDIUM: 3000,
  FAST: 1500
};

const CONFIG = {
  MAX_BACKWARD_POSITION: 5.5,
  MIN_FORWARD_POSITION: -4.5,
  PLANE_ROTATION_SPEED: 0.03,
  MAX_PLANE_ROTATION: Math.PI / 4,
  ALIGNMENT_THRESHOLD: 0.5,
  TRAINING_DURATION: 30 * 1000, // 30 seconds for training
};

export default {
  name: 'PilotCoordinationTest',
  setup() {
    // Refs for template
    const container = ref(null);
    const canvas = ref(null);
    let animationFrameId = null;

    // Get test configuration from storage
    const schedule = JSON.parse(localStorage.getItem('scheduleData'));
    const test = schedule.tests.find((t) => t.name === "Multidimensional Coordination Test");
    const batteryTestId = test.id;
    const configs = test.configs;
    console.log('Test config', configs, batteryTestId);

    // Config management
    const activeConfig = ref(null);
    const currentConfigIndex = ref(0);
    const configStartTime = ref(null);

    // Calculate total test duration
    const getTotalDuration = (configs) => {
      return configs.reduce((total, config) => total + Number(config.duration), 0);
    };
    const totalTestDuration = getTotalDuration(configs) * 1000; // Convert to milliseconds
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

    // Config management functions
    const updateActiveConfig = () => {
      if (!configStartTime.value) {
        configStartTime.value = Date.now();
        activeConfig.value = configs[0];
        return;
      }

      const elapsed = Date.now() - configStartTime.value;
      if (elapsed >= activeConfig.value.duration * 1000) {
        currentConfigIndex.value++;
        if (currentConfigIndex.value < configs.length) {
          configStartTime.value = Date.now();
          activeConfig.value = configs[currentConfigIndex.value];
          console.log('Switching to config:', currentConfigIndex.value, activeConfig.value);
        }
      }
    };

    const getAnomaliIntensity = (level) => {
      return ANOMALI_INTENSITY[level.toUpperCase()] || ANOMALI_INTENSITY.LOW;
    };

    const getTurbulenceIntensity = (level) => {
      return TURBULENCE_INTENSITY[level.toUpperCase()] || TURBULENCE_INTENSITY.LOW;
    };

    const getPovChangeSpeed = (speed) => {
      return POV_CHANGE_SPEED[speed.toUpperCase()] || POV_CHANGE_SPEED.MEDIUM;
    };

    // Computed properties
    const isAligned = computed(() => {
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
      activeConfig.value = configs[0]; // Use first config for training
      userInputs.value = [];
      resetAirplanePosition();
    };

    const startActualTest = () => {
      console.log('Starting actual test...');
      showTestModal.value = false;
      isTrainingMode.value = false;
      startTime.value = Date.now();
      configStartTime.value = Date.now();
      currentConfigIndex.value = 0;
      activeConfig.value = configs[0];
      timeRemaining.value = totalTestDuration;
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
        timeSpent: totalTestDuration - timeRemaining.value,
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
        removeTestByNameAndUpdateLocalStorage('Multidimensional Coordination Test');
        window.location.href = '/module';
      } catch (error) {
        console.error('Error submitting test results:', error);
      }
    };

    // Animation loop with anomali and config-based adjustments
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = Date.now();

      // Update time and check for completion
      if (startTime.value) {
        timeRemaining.value = Math.max(0, (isTrainingMode.value ? CONFIG.TRAINING_DURATION : totalTestDuration) - (now - startTime.value));

        if (timeRemaining.value === 0) {
          if (isTrainingMode.value) {
            showTestModal.value = true;
          } else {
            finishSim();
            cancelAnimationFrame(animationFrameId);
          }
          return;
        }

        // Update active config if not in training mode
        if (!isTrainingMode.value) {
          updateActiveConfig();
        }
      }

      if (!activeConfig.value) return;

      // Update perspective based on active config
      const povSpeed = getPovChangeSpeed(activeConfig.value.turbulence.pov_change);
      if (now - lastPerspectiveChange > povSpeed) {
        perspectiveDirection *= -1;
        lastPerspectiveChange = now;
      }

      const turbulenceIntensity = getTurbulenceIntensity(activeConfig.value.turbulence.intensity);
      perspectiveOffset.value += turbulenceIntensity * perspectiveDirection;

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

      // Apply anomali based on current config
      if (!isTrainingMode.value) {
        // X-axis anomali
        const xAnomaliIntensity = getAnomaliIntensity(activeConfig.value.x_axis.anomali);
        if (Math.random() < 0.1) { // 10% chance per frame
          airplanePosition.value.x += (Math.random() - 0.5) * xAnomaliIntensity;
        }

        // Y-axis anomali
        const yAnomaliIntensity = getAnomaliIntensity(activeConfig.value.y_axis.anomali);
        if (Math.random() < 0.1) {
          airplanePosition.value.y += (Math.random() - 0.5) * yAnomaliIntensity;
        }
      }

      // Regular backward drift
      if (airplanePosition.value.z < CONFIG.MAX_BACKWARD_POSITION) {
        airplanePosition.value.z += 0.015; // Base backward drift
      }

      // Handle gamepad input
      if (gamepadConnected.value) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[gamepad.value.index];

        if (gp) {
          // Apply sensitivity from current config
          const xSensitivity = activeConfig.value.x_axis.sensitivity / 1000;
          const ySensitivity = activeConfig.value.y_axis.sensitivity / 1000;

          // X-axis movement
          const xMovement = gp.axes[0] * xSensitivity;
          airplanePosition.value.x += xMovement;
          airplanePosition.value.x = Math.max(-4.5, Math.min(4.5, airplanePosition.value.x));

          // Y-axis movement (reversed)
          const yMovement = gp.axes[1] * ySensitivity;
          airplanePosition.value.y += yMovement;
          airplanePosition.value.y = Math.max(-4.5, Math.min(4.5, airplanePosition.value.y));

          // Rotations
          const targetRotation = xMovement * CONFIG.MAX_PLANE_ROTATION;
          airplaneRotation.value.z += (targetRotation - airplaneRotation.value.z) * CONFIG.PLANE_ROTATION_SPEED;

          const targetPitch = yMovement * CONFIG.MAX_PLANE_ROTATION;
          airplaneRotation.value.x += (targetPitch - airplaneRotation.value.x) * CONFIG.PLANE_ROTATION_SPEED;
        }
      }

      // Handle thruster input
      if (thrustConnected.value) {
        const gamepads = navigator.getGamepads();
        const th = gamepads[thruster.value.index];

        if (th) {
          airplanePosition.value.z -= (th.axes[2] + 1) * 0.03;
          airplanePosition.value.z = Math.max(CONFIG.MIN_FORWARD_POSITION, Math.min(CONFIG.MAX_BACKWARD_POSITION, airplanePosition.value.z));
        }
      }

      // Record metrics
      if (now - lastMetricRecordTime >= 1000) {
        userInputs.value.push({
          type: isAligned.value ? 'correct' : 'wrong',
          deviations: {
            x: airplanePosition.value.x - (markerPosition.value.x + perspectiveOffset.value),
            y: airplanePosition.value.y - markerPosition.value.y,
            z: airplanePosition.value.z - markerPosition.value.z,
          },
          timestamp: now - startTime.value,
          config: currentConfigIndex.value
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

    // Window resize handler
    const handleResize = () => {
      if (container.value && renderer) {
        const width = container.value.clientWidth;
        const height = container.value.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
      }
    };

    onMounted(() => {
      // Initialize scene and start animation
      initScene();
      animate();

      // Add event listeners
      window.addEventListener('gamepadconnected', onGamepadConnected);
      window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
      window.addEventListener('resize', handleResize);

      // Set initial config
      activeConfig.value = configs[0];
    });

    onUnmounted(() => {
      // Clean up
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Remove event listeners
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      window.removeEventListener('resize', handleResize);

      // Clean up Three.js resources
      if (renderer) {
        renderer.dispose();
        scene.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (object.material.map) {
              object.material.map.dispose();
            }
            object.material.dispose();
          }
        });
      }
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
  background-color: #f0f0f0;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.airplane {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  transform-origin: center;
  transition: filter 0.2s ease;
}

.out-of-target {
  filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.7));
}

.in-target {
  filter: drop-shadow(0 0 5px rgba(0, 255, 0, 0.7));
}

.countdown {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 255, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 24px;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-button {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s ease;
}

.modal-button:hover {
  background-color: #1976D2;
}

.modal-button:active {
  background-color: #1565C0;
  transform: translateY(1px);
}
</style>