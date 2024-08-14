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

    const state = ref({
      altitude: { current: 8050, target: 8100, display: 8050 },
      speed: { current: 150, target: 155, display: 150 },
      heading: { current: 345, target: 350, display: 345 },
    });

    const drawMovingIndicator = (x, y, width, height, min, max, current, target, display, label, isVertical = true) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();

      const range = max - min;
      const pixelsPerUnit = isVertical ? height / range : width / range;
      const offset = (current - display) * pixelsPerUnit;

      ctx.fillStyle = '#555'; // Darker grey for indicator background
      ctx.fillRect(x, y, width, height);

      // Draw scale
      ctx.fillStyle = '#fff';
      const steps = isVertical ? 30 : 36;
      for (let i = 0; i <= steps; i++) {
        const value = min + range * (i / steps);
        const pos = isVertical
          ? y + height - (i / steps) * height + offset
          : x + (i / steps) * width - offset;

        if (isVertical) {
          ctx.fillRect(x, pos, width / 3, 1);
          ctx.fillText(value.toFixed(0), x + width / 2, pos);
        } else {
          ctx.fillRect(pos, y, 1, height / 3);
          ctx.save();
          ctx.translate(pos, y + height / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(value.toFixed(0), 0, 0);
          ctx.restore();
        }
      }

      // Draw label
      ctx.fillStyle = '#fff';
      const labelPos = isVertical
        ? y + height + offset
        : x - offset;
      ctx.fillText(label, isVertical ? x : labelPos, isVertical ? labelPos : y - 10);

      // Draw current value (blue strip)
      const currentPos = isVertical ? y + height / 2 : x + width / 2;
      ctx.fillStyle = 'blue';
      if (isVertical) {
        ctx.fillRect(x, currentPos, width, 3);
      } else {
        ctx.fillRect(currentPos, y, 3, height);
      }

      // Draw target (green dot)
      const targetOffset = (target - current) * pixelsPerUnit;
      const targetPos = isVertical
        ? currentPos - targetOffset
        : currentPos + targetOffset;

      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(isVertical ? x + width / 2 : targetPos, isVertical ? targetPos : y + height / 2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawSpeedGauge = (x, y, width, height, current, max) => {
      ctx.fillStyle = 'blue';
      const gaugeHeight = (current / max) * height;
      ctx.fillRect(x, y + height - gaugeHeight, width, gaugeHeight);
    };

    const draw = () => {
      ctx.fillStyle = '#777'; // Light grey background
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

      // Altitude indicator (left)
      drawMovingIndicator(50, 50, 100, 500, 7500, 8500, state.value.altitude.current, state.value.altitude.target, state.value.altitude.display, 'ALTITUDE');

      // Speed indicator (right)
      drawMovingIndicator(850, 50, 100, 500, 100, 200, state.value.speed.current, state.value.speed.target, state.value.speed.display, 'SPEED');
      drawSpeedGauge(960, 50, 20, 500, state.value.speed.current, 200);

      // Heading indicator (bottom center)
      drawMovingIndicator(200, 530, 600, 50, 0, 360, state.value.heading.current, state.value.heading.target, state.value.heading.display, 'HEADING', false);

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0]; // Assuming the first connected gamepad

      if (gamepad) {
        // Assuming X axis (index 0) controls heading, Y axis (index 1) controls altitude
        const headingChange = gamepad.axes[0] * 2;
        const altitudeChange = -gamepad.axes[1] * 10; // Invert Y axis

        state.value.heading.target = (state.value.heading.target + headingChange + 360) % 360;
        state.value.altitude.target = Math.max(7500, Math.min(8500, state.value.altitude.target + altitudeChange));

        // Use buttons to control speed
        if (gamepad.buttons[0].pressed) {
          state.value.speed.target = Math.min(200, state.value.speed.target + 1);
        } else if (gamepad.buttons[1].pressed) {
          state.value.speed.target = Math.max(100, state.value.speed.target - 1);
        }
      }
    };

    const updateDisplayValues = () => {
      ['altitude', 'speed', 'heading'].forEach(key => {
        const diff = state.value[key].target - state.value[key].current;
        state.value[key].current += diff * 0.1; // Smooth transition
        state.value[key].display = state.value[key].current; // Update display to match current
      });
    };

    const gameLoop = () => {
      handleGamepad();
      updateDisplayValues();
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
}</style>