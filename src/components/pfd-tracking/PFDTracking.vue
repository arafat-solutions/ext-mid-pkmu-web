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
    let ctx;
    let animationFrameId;

    const MAX_SPEED = 200;
    const MIN_SPEED = 100;
    const MOVEMENT_SPEED = ref(0.1); // Adjustable movement speed

    const state = reactive({
      altitude: { current: 8050, target: 8100, display: 8050, labels: [] },
      speed: { current: 150, target: 155, display: 150, acceleration: 0, labels: [] },
      heading: { current: 345, target: 350, display: 345, labels: [] },
    });

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

    const drawMovingIndicator = (x, y, width, height, stateKey, label, isVertical = true) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();

      ctx.fillStyle = '#555';
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = '#fff';
      state[stateKey].labels.forEach(label => {
        const pos = isVertical
          ? y + height / 2 + label.offset
          : x + width / 2 + label.offset;

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
      ctx.fillText(label, isVertical ? x : x + width / 2, isVertical ? y + height + 20 : y - 10);

      ctx.fillStyle = 'blue';
      if (isVertical) {
        ctx.fillRect(x, y + height / 2, width, 3);
      } else {
        ctx.fillRect(x + width / 2, y, 3, height);
      }

      ctx.restore();
    };

    const drawSpeedGauge = (x, y, width, height, current, acceleration) => {
      const normalizedSpeed = (current - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
      const barHeight = normalizedSpeed * height;

      ctx.fillStyle = 'blue';
      ctx.fillRect(x, y + height - barHeight, width, barHeight);

      ctx.fillStyle = 'white';
      ctx.fillText(`${current.toFixed(0)} kts`, x, y - 10);
      ctx.fillText(`Acc: ${acceleration.toFixed(2)}`, x, y - 25);
    };

    const draw = () => {
      ctx.fillStyle = '#777';
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

      drawMovingIndicator(50, 50, 100, 500, 'altitude', 'ALTITUDE');
      drawMovingIndicator(850, 50, 100, 500, 'speed', 'SPEED');
      drawSpeedGauge(960, 50, 40, 500, state.speed.current, state.speed.acceleration);
      drawMovingIndicator(200, 530, 600, 50, 'heading', 'HEADING', false);

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0];

      if (gamepad) {
        const headingChange = gamepad.axes[0] * 2;
        const altitudeChange = -gamepad.axes[1] * 10;

        updateLabels('heading', (state.heading.display + headingChange + 360) % 360, false, true);
        updateLabels('altitude', Math.max(0, state.altitude.display + altitudeChange), true);

        state.speed.acceleration = gamepad.buttons[7].value;
      }
    };

    const updateSpeed = () => {
      const maxAcceleration = 0.1;
      const acceleration = state.speed.acceleration * maxAcceleration;
      state.speed.current = Math.max(MIN_SPEED, Math.min(MAX_SPEED, state.speed.current + acceleration));
      updateLabels('speed', state.speed.current, true);
    };

    const gameLoop = () => {
      handleGamepad();
      updateSpeed();
      requestAnimationFrame(gameLoop);
    };

    onMounted(() => {
      ctx = canvas.value.getContext('2d');
      initializeLabels();
      draw();
      gameLoop();

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
  /* Match the canvas background color */
}

.canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>