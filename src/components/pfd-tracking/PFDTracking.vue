<template>
  <div>
    <div class="canvas-container">
      <canvas ref="canvas" width="1000" height="600"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, reactive } from 'vue';

export default {
  setup() {
    const canvas = ref(null);
    const config = ref({
      duration: "2",
      control: {
        invert_throttle: true,
        invert_y_axis: true,
      },
      simulator: {
        green_dot_speed: 50,
        max_yaw_and_climb_rate: 50,
        turbulence: 20,
      }
    });
    let ctx;
    let animationFrameId;

    const MAX_SPEED = 2000;
    const MIN_SPEED = 10;
    const MAX_THRUST = 1;
    const MIN_THRUST = -1;
    const MOVEMENT_SPEED = ref(0.5);
    const ACCELERATION_FACTOR = 0.001;

    const state = reactive({
      altitude: { current: 8050, target: 8000, display: 8050, labels: [], offTargetTime: 0, targetRange: 400 },
      speed: { current: 150, target: 900, display: 150, labels: [], offTargetTime: 0, targetRange: 400 },
      heading: { current: 345, target: 250, display: 345, labels: [], offTargetTime: 0, targetRange: 100 },
      thrust: 0,
      timeRemaining: 0,
      lastUpdateTime: 0,
      lastTargetUpdateTime: 0,
      turbulence: { x: 0, y: 0 },
    });
    
    const drawMovingIndicator = (x, y, width, height, stateKey, label, isVertical = true) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();

      ctx.fillStyle = '#555';
      ctx.fillRect(x, y, width, height);

      const isHeading = stateKey === 'heading';
      ctx.font = '10px Arial';
      state[stateKey].labels.forEach(label => {
        const pos = isVertical
          ? y + height / 2 + label.offset + (stateKey === 'altitude' ? state.turbulence.y : 0)
          : x + width / 2 + label.offset + (stateKey === 'heading' ? state.turbulence.x : 0);

        const color = getLabelColor(label.value, state[stateKey].target, state[stateKey].targetRange, isHeading);
        ctx.fillStyle = color;

        if (isVertical) {
          ctx.fillRect(x, pos, width / 3, 1);
          ctx.fillText(label.value.toFixed(0), x + width / 2, pos);
        } else {
          ctx.fillRect(pos, y, 1, height / 3);
          ctx.save();
          ctx.translate(pos, y + height / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(label.value.toFixed(0), 0, 0);
          ctx.restore();
        }
      });

      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(label, isVertical ? x : x + width / 2, isVertical ? y + height + 20 : y - 10);

      ctx.fillStyle = 'blue';
      if (isVertical) {
        ctx.fillRect(x, y + height / 2 + (stateKey === 'altitude' ? state.turbulence.y : 0), width, 3);
      } else {
        ctx.fillRect(x + width / 2 + (stateKey === 'heading' ? state.turbulence.x : 0), y, 3, height);
      }

      ctx.restore();
    };

    const drawThrustGauge = (x, y, width, height, thrust, speed) => {
      const normalizedThrust = (thrust - MIN_THRUST) / (MAX_THRUST - MIN_THRUST);

      ctx.fillStyle = 'blue';
      const barHeight = normalizedThrust * height;
      ctx.fillRect(x, y + height - barHeight, width, barHeight);

      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(`${speed.toFixed(0)} kts`, x, y - 10);
      ctx.fillText(`Thrust: ${(thrust * 100).toFixed(0)}%`, x, y - 25);
    };

    const drawCountdown = () => {
      const timerWidth = 100;
      const timerHeight = 40;
      const timerX = canvas.value.width / 2 - timerWidth / 2;
      const timerY = 0;

      // Draw blue background
      ctx.fillStyle = 'blue';
      ctx.fillRect(timerX, timerY, timerWidth, timerHeight);

      // Draw timer text
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const minutes = Math.floor(state.timeRemaining / 60);
      const seconds = Math.floor(state.timeRemaining % 60);
      ctx.fillText(
        `${minutes}:${seconds.toString().padStart(2, '0')}`,
        canvas.value.width / 2,
        timerY + timerHeight / 2
      );
    };

    const generateLabels = (current, count, isVertical, isHeading = false) => {
      const step = isVertical ? 100 : 10;
      const labels = [];
      const halfCount = Math.floor(count / 2);
      const start = Math.floor(current / step) * step - (halfCount * step);
      for (let i = 0; i < count; i++) {
        let value = start + i * step;
        if (isHeading) {
          value = ((value % 360) + 360) % 360;
        }
        labels.push({ value, offset: (i - halfCount) * (isVertical ? 500 / count : 600 / count) });
      }
      return labels;
    };

    const initializeLabels = () => {
      state.altitude.labels = generateLabels(state.altitude.current, 15, true);
      state.speed.labels = generateLabels(state.speed.current, 15, true);
      state.heading.labels = generateLabels(state.heading.current, 36, false, true);
    };

    const updateLabels = (stateKey, newValue, isVertical, isHeading = false) => {
      const labels = state[stateKey].labels;
      const step = isVertical ? 100 : 10;
      const pixelsPerUnit = isVertical ? 500 / 1000 : 600 / 360;
      const labelHeight = isVertical ? 500 / labels.length : 600 / labels.length;

      const diff = (newValue - state[stateKey].display) * MOVEMENT_SPEED.value;
      labels.forEach(label => {
        label.offset -= diff * pixelsPerUnit;
      });

      while (labels[0].offset < -labelHeight * Math.floor(labels.length / 2)) {
        const lastValue = labels[labels.length - 1].value;
        labels.shift();
        labels.push({
          value: isHeading ? ((lastValue + step) % 360) : (lastValue + step),
          offset: labels[labels.length - 1].offset + labelHeight
        });
      }
      while (labels[labels.length - 1].offset > labelHeight * Math.floor(labels.length / 2)) {
        const firstValue = labels[0].value;
        labels.pop();
        labels.unshift({
          value: isHeading ? ((firstValue - step + 360) % 360) : (firstValue - step),
          offset: labels[0].offset - labelHeight
        });
      }

      state[stateKey].display += diff;
    };

    const getLabelColor = (value, target, targetRange, isHeading = false) => {
      let diff = Math.abs(value - target);
      if (isHeading) {
        diff = Math.min(diff, 360 - diff);
      }
      const ratio = Math.min(diff / targetRange, 1);
      const hue = (1 - ratio) * 120; // 120 is green, 0 is red
      return `hsl(${hue}, 100%, 50%)`;
    };

    const draw = () => {
      ctx.fillStyle = '#777';
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

      drawMovingIndicator(50, 50, 100, 500, 'altitude', 'ALTITUDE');
      drawMovingIndicator(850, 50, 100, 500, 'speed', 'SPEED');
      drawThrustGauge(960, 50, 40, 500, state.thrust, state.speed.current);
      drawMovingIndicator(200, 530, 600, 50, 'heading', 'HEADING', false);
      drawCountdown();

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0];

      if (gamepad) {
        const headingChange = gamepad.axes[0] * 2;
        const altitudeChange = config.value.control.invert_y_axis ? gamepad.axes[1] * 10 : -gamepad.axes[1] * 10;
        const thrustChange = config.value.control.invert_throttle ? -gamepad.axes[6] : gamepad.axes[6];

        updateLabels('heading', (state.heading.display + headingChange + 360) % 360, false, true);
        updateLabels('altitude', Math.max(0, state.altitude.display + altitudeChange), true);

        state.thrust = thrustChange;
      }
    };

    const updateSpeed = () => {
      const targetSpeed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * ((state.thrust + 1) / 2);
      const speedDiff = targetSpeed - state.speed.current;
      state.speed.current += speedDiff * ACCELERATION_FACTOR;
      updateLabels('speed', state.speed.current, true);
    };

    const updateTargets = () => {
      console.log('Targets:', state.altitude.target, state.speed.target, state.heading.target);
      const altitudeChange = (Math.random() - 0.5) * 200;
      const speedChange = (Math.random() - 0.5) * 100;
      const headingChange = (Math.random() - 0.5) * 20;

      state.altitude.target = Math.max(0, Math.min(10000, state.altitude.target + altitudeChange));
      state.speed.target = Math.max(MIN_SPEED, Math.min(MAX_SPEED, state.speed.target + speedChange));
      state.heading.target = (state.heading.target + headingChange + 360) % 360;
    };

    const updateTurbulence = () => {
      console.log('Turbulence:', state.turbulence);
      const turbulenceIntensity = config.value.simulator.turbulence / 100;
      state.turbulence.x = (Math.random() - 0.5) * 10 * turbulenceIntensity;
      state.turbulence.y = (Math.random() - 0.5) * 10 * turbulenceIntensity;
    };

    const updateScore = (currentTime) => {
      const timeDiff = currentTime - state.lastUpdateTime;

      ['altitude', 'speed', 'heading'].forEach(key => {
        let diff = Math.abs(state[key].current - state[key].target);
        if (key === 'heading') {
          diff = Math.min(diff, 360 - diff);
        }
        if (diff > state[key].targetRange) {
          state[key].offTargetTime += timeDiff;
        }
      });
    };

    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - state.lastUpdateTime;
      state.timeRemaining -= deltaTime / 1000;

      if (state.timeRemaining <= 0) {
        cancelAnimationFrame(animationFrameId);
        console.log("Game Over. Off-target times:");
        console.log("Altitude:", state.altitude.offTargetTime.toFixed(2), "ms");
        console.log("Speed:", state.speed.offTargetTime.toFixed(2), "ms");
        console.log("Heading:", state.heading.offTargetTime.toFixed(2), "ms");
        return;
      }

      handleGamepad();
      updateSpeed();
      updateScore(currentTime);

      // Update targets every 5 seconds
      if (currentTime - state.lastTargetUpdateTime > 5000) {
        updateTargets();
        state.lastTargetUpdateTime = currentTime;
      }

      // Update turbulence every 100ms
      if (currentTime - state.lastUpdateTime > 100) {
        updateTurbulence();
      }

      state.lastUpdateTime = currentTime;

      requestAnimationFrame(gameLoop);
    };

    onMounted(() => {
      const testData = localStorage.getItem('scheduleData');
      if (testData) {
        const scheduleData = JSON.parse(testData);
        const pfdConfig = scheduleData.tests.find(data => data.name === 'PFD Tracking Test');
        config.value = pfdConfig.config;
        console.log(config.value, 'CONFIG');
      }
      ctx = canvas.value.getContext('2d');
      initializeLabels();
      state.timeRemaining = parseFloat(config.value.duration) * 60;
      state.lastUpdateTime = performance.now();
      state.lastTargetUpdateTime = performance.now();
      draw();
      gameLoop(performance.now());

      window.addEventListener('gamepadconnected', (e) => {
        console.log("Gamepad connected:", e.gamepad.id);
      });

      window.addEventListener('gamepaddisconnected', (e) => {
        console.log("Gamepad disconnected:", e.gamepad.id);
      });
    });

    onUnmounted(() => {
      cancelAnimationFrame(animationFrameId);
    });

    return { canvas, MOVEMENT_SPEED };
  },
};
</script>

<style scoped>
.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: #777;
}

.canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>