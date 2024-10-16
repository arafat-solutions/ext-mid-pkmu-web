<template>
  <div ref="container" class="coordination-test">
    <canvas ref="canvas"></canvas>
    <img src="@/assets/airplane-icon.png" alt="Airplane" :style="airplaneStyle" class="airplane"
      :class="{ 'out-of-target': !isAligned, 'in-target': isAligned }" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import * as THREE from 'three';

// Configuration constants
const CONFIG = {
  PERSPECTIVE_SPEED: {
    DISABLED: 0,
    SLOW: 0.0005,
    MEDIUM: 0.001,
    FAST: 0.002
  },
  PERSPECTIVE_INTERVAL: 5000, // ms
  BACKWARD_SPEED: {
    LOW: 0.01,
    MEDIUM: 0.03,
    HIGH: 0.05
  },
  MAX_BACKWARD_POSITION: 5.5,
  MIN_FORWARD_POSITION: -4.5,
  PLANE_ROTATION_SPEED: 0.1,
  MAX_PLANE_ROTATION: Math.PI / 4, // 45 degrees
  ALIGNMENT_THRESHOLD: 0.5
};

export default {
  name: 'PilotCoordinationTest',
  setup() {
    const container = ref(null);
    const canvas = ref(null);
    let scene, camera, renderer, box, marker;
    const markerPosition = ref({ x: 0, y: -4.5, z: 0 });
    const perspectiveOffset = ref(0);
    let originalVertices;

    const airplanePosition = ref({ x: 0, y: 0, z: 0 });
    const airplaneRotation = ref({ x: 0, y: 0, z: 0 });

    const gamepad = ref(null);
    const thruster = ref(null);
    const gamepadConnected = ref(false);
    const thrustConnected = ref(false);

    // Current configuration
    const currentConfig = {
      perspectiveSpeed: CONFIG.PERSPECTIVE_SPEED.MEDIUM,
      backwardSpeed: CONFIG.BACKWARD_SPEED.MEDIUM
    };

    const isAligned = computed(() => {
      const dx = Math.abs(airplanePosition.value.x - markerPosition.value.x);
      const dy = Math.abs(airplanePosition.value.y - markerPosition.value.y);
      return dx < CONFIG.ALIGNMENT_THRESHOLD && dy < CONFIG.ALIGNMENT_THRESHOLD;
    });

    const airplaneStyle = computed(() => ({
      transform: `translate3d(${airplanePosition.value.x * 50}px, ${airplanePosition.value.y * -50}px, ${airplanePosition.value.z * -10}px) 
                  rotateZ(${airplaneRotation.value.z}rad) 
                  rotateX(${airplaneRotation.value.x}rad) 
                  rotateY(${airplaneRotation.value.y}rad) 
                  scale(${5 - airplanePosition.value.z / 10})`,
    }));

    const initScene = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true });
      renderer.setSize(container.value.clientWidth, container.value.clientHeight);

      // Create open box geometry with gradient color
      const geometry = new THREE.BufferGeometry();
      originalVertices = new Float32Array([
        -5, -5, -5, 5, -5, -5, 5, 5, -5, -5, 5, -5, // back
        -5, -5, 5, 5, -5, 5, 5, 5, 5, -5, 5, 5, // sides and top
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

      const colors = new Float32Array(originalVertices.length);
      for (let i = 0; i < colors.length; i += 3) {
        const z = originalVertices[i + 2];
        const t = 1 - (z + 5) / 10; // Normalize z from [-5, 5] to [1, 0]
        colors[i] = 0.529 + 0.471 * t; // R: from white to sky blue
        colors[i + 1] = 0.808 + 0.192 * t; // G: from white to sky blue
        colors[i + 2] = 0.922 + 0.078 * t; // B: from white to sky blue
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

      camera.position.z = 15;
    };

    let lastPerspectiveChange = 0;
    let perspectiveDirection = 1;

    const animate = () => {
      requestAnimationFrame(animate);

      // Update perspective
      const now = Date.now();
      if (now - lastPerspectiveChange > CONFIG.PERSPECTIVE_INTERVAL) {
        perspectiveDirection *= -1;
        lastPerspectiveChange = now;
      }
      perspectiveOffset.value += currentConfig.perspectiveSpeed * perspectiveDirection;

      const positions = box.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        if (originalVertices[i + 2] > 0) {
          positions[i] = originalVertices[i] + perspectiveOffset.value;
        } else {
          positions[i] = originalVertices[i];
        }
      }
      box.geometry.attributes.position.needsUpdate = true;

      // Update marker position
      markerPosition.value.x = perspectiveOffset.value;
      marker.position.x = markerPosition.value.x;

      // Move airplane backward
      if (airplanePosition.value.z < CONFIG.MAX_BACKWARD_POSITION) {
        airplanePosition.value.z += currentConfig.backwardSpeed;
      }

      // Update airplane position based on joystick input
      if (gamepadConnected.value) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[gamepad.value.index];

        // X-axis movement
        const xMovement = gp.axes[0] * 0.1;
        airplanePosition.value.x += xMovement;
        airplanePosition.value.x = Math.max(-4.5, Math.min(4.5, airplanePosition.value.x));

        // Y-axis movement
        const yMovement = -gp.axes[1] * 0.1;
        airplanePosition.value.y += yMovement;
        airplanePosition.value.y = Math.max(-4.5, Math.min(4.5, airplanePosition.value.y));

        // Rotation for left/right movement
        const targetRotation = xMovement * CONFIG.MAX_PLANE_ROTATION;
        airplaneRotation.value.z += (targetRotation - airplaneRotation.value.z) * CONFIG.PLANE_ROTATION_SPEED;

        // Rotation for up/down movement
        const targetPitch = yMovement * CONFIG.MAX_PLANE_ROTATION;
        airplaneRotation.value.x += (targetPitch - airplaneRotation.value.x) * CONFIG.PLANE_ROTATION_SPEED;
      }

      if (thrustConnected.value) {
        const gamepads = navigator.getGamepads();
        const th = gamepads[thruster.value.index];

        // Z-axis movement
        airplanePosition.value.z -= (th.axes[2] + 1) * 0.05;
        airplanePosition.value.z = Math.max(CONFIG.MIN_FORWARD_POSITION, Math.min(CONFIG.MAX_BACKWARD_POSITION, airplanePosition.value.z));
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
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
    });

    return {
      container,
      canvas,
      airplaneStyle,
      isAligned,
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
</style>