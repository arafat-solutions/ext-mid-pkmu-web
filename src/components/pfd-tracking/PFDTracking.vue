<template>
  <div>
    <div class="canvas-container">
      <canvas ref="canvas" width="1000" height="600"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    const canvas = ref(null);
    let ctx;
    let animationFrameId;

    const MAX_SPEED = 200;
    const MIN_SPEED = 100;

    const state = ref({
      altitude: { current: 8050, target: 8100, display: 8050 },
      speed: { current: 150, target: 155, display: 150, thruster: 0.5 },
      heading: { current: 345, target: 350, display: 345 },
    });

    const drawMovingIndicator = (x, y, width, height, current, label, isVertical = true) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();

      const range = isVertical ? 1000 : 360;
      const pixelsPerUnit = isVertical ? height / range : width / range;
      const offset = (current % range) * pixelsPerUnit;

      ctx.fillStyle = '#555';
      ctx.fillRect(x, y, width, height);

      // Draw scale and labels
      ctx.fillStyle = '#fff';
      const steps = isVertical ? 20 : 36;
      for (let i = -steps; i <= steps * 2; i++) {
        const value = Math.floor(current) - (isVertical ? 500 : 180) + i * (range / steps);
        const pos = isVertical
          ? y + height - (i / steps) * height - offset
          : x + (i / steps) * width - offset;

        if (isVertical) {
          ctx.fillRect(x, pos, width / 3, 1);
          ctx.fillText(value.toFixed(0), x + width / 2, pos);
        } else {
          const adjustedValue = ((value % 360) + 360) % 360;
          ctx.fillRect(pos, y, 1, height / 3);
          ctx.save();
          ctx.translate(pos, y + height / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(adjustedValue.toFixed(0), 0, 0);
          ctx.restore();
        }
      }

      // Draw label
      ctx.fillStyle = '#fff';
      ctx.fillText(label, isVertical ? x : x + width / 2, isVertical ? y + height + 20 : y - 10);

      // Draw current value (blue strip)
      ctx.fillStyle = 'blue';
      if (isVertical) {
        ctx.fillRect(x, y + height / 2, width, 3);
      } else {
        ctx.fillRect(x + width / 2, y, 3, height);
      }

      ctx.restore();
    };

    const drawSpeedGauge = (x, y, width, height, current, thruster) => {
      // Draw speed bar
      ctx.fillStyle = 'blue';
      const speedHeight = ((current - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * height;
      ctx.fillRect(x, y + height - speedHeight, width / 2, speedHeight);

      // Draw thruster bar
      ctx.fillStyle = 'green';
      const thrusterHeight = thruster * height;
      ctx.fillRect(x + width / 2, y + height - thrusterHeight, width / 2, thrusterHeight);

      // Draw labels
      ctx.fillStyle = 'white';
      ctx.fillText(`${current.toFixed(0)} kts`, x, y - 10);
      ctx.fillText(`${(thruster * 100).toFixed(0)}%`, x + width / 2, y - 10);
    };

    const draw = () => {
      ctx.fillStyle = '#777';
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

      drawMovingIndicator(50, 50, 100, 500, state.value.altitude.display, 'ALTITUDE');
      drawMovingIndicator(850, 50, 100, 500, state.value.speed.display, 'SPEED');
      drawSpeedGauge(960, 50, 40, 500, state.value.speed.current, state.value.speed.thruster);
      drawMovingIndicator(200, 530, 600, 50, state.value.heading.display, 'HEADING', false);

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0];

      if (gamepad) {
        const headingChange = gamepad.axes[0] * 2;
        const altitudeChange = -gamepad.axes[1] * 10;

        state.value.heading.target += headingChange;
        state.value.altitude.target = Math.max(0, state.value.altitude.target + altitudeChange);

        // Immediately update display values for continuous movement
        state.value.heading.display = state.value.heading.target;
        state.value.altitude.display = state.value.altitude.target;

        // Update thruster based on a designated button (e.g., right trigger)
        state.value.speed.thruster = gamepad.buttons[7].value; // Assuming right trigger is index 7
      }
    };

    const updateSpeed = () => {
      const targetSpeed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * state.value.speed.thruster;
      const diff = targetSpeed - state.value.speed.current;
      state.value.speed.current += diff * 0.01; // Gradual change
      state.value.speed.display = state.value.speed.current;
    };

    const gameLoop = () => {
      handleGamepad();
      updateSpeed();
      requestAnimationFrame(gameLoop);
    };

    onMounted(() => {
      ctx = canvas.value.getContext('2d');
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

    return { canvas };
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
  background-color: #777; /* Match the canvas background color */
}

.canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>