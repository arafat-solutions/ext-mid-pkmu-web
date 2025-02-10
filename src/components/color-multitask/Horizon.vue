<template>
  <div class="centered-component">
    <canvas
      ref="horizonCanvas"
      :width="horizonWidth"
      :height="horizonHeight"
      class="no-pointer-events"
    >
    </canvas>
    <p v-if="!trainingCompleted">
      ⚠️ Perhatian! ⚠️<br /><b
        >Harap arahkan garis Corsair hingga berwarna hijau</b
      >
      untuk memastikan akurasi dan kestabilan. Jika garis belum berwarna hijau,
      sesuaikan kembali posisi hingga indikator berubah.
    </p>
  </div>
</template>

<script>
export default {
  name: "HorizonTest",
  props: {
    isTimesUp: Boolean,
    speed: String,
    isPause: Boolean,
    isActive: Boolean,
    trainingCompleted: Boolean,
  },
  data() {
    return {
      horizonWidth: 450,
      horizonHeight: 350,
      greenLineStartTime: null,
      greenLineDuration: 0,
      config: {
        x: 10,
        y: 5,
        skyColor: "#87CEEB",
        landColor: "#8B4513",
        whiteBorderHeight: 5,
        focusY: 300,
        focusX: 100,
        angle: 0,
        horizonOffsetY: 0,
        horizonOffsetX: 0,
      },
      currentTilt: 0,
      currentShiftX: 0,
      currentShiftY: 0,
      intervalRandomTilt: null,
      intervalRandomShift: null,
      gamepadIndex: null,
      gamepadCheckInterval: null,
      lastGamepadState: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
    };
  },
  mounted() {
    this.initHorizon();
  },
  unmounted() {
    this.stopAnimation();
    window.removeEventListener("gamepadconnected", this.onGamepadConnected);
    window.removeEventListener(
      "gamepaddisconnected",
      this.onGamepadDisconnected
    );
    clearInterval(this.gamepadCheckInterval);
  },
  watch: {
    isTimesUp() {
      this.$emit("getResult", {
        correctTime: this.greenLineDuration,
      });
    },
    isPause() {
      if (this.isPause) {
        this.stopAnimation();
      } else {
        this.startAnimation();
      }
    },
  },
  methods: {
    initHorizon() {
      this.initVisual();
      this.drawVisual();
      if (this.isActive) {
        this.startAnimation();
      }

      window.addEventListener("gamepadconnected", this.onGamepadConnected);
      window.addEventListener(
        "gamepaddisconnected",
        this.onGamepadDisconnected
      );
      this.startGamepadCheck();
    },

    startGamepadCheck() {
      this.gamepadCheckInterval = setInterval(() => {
        this.checkForGamepad();
      }, 1000);
    },

    checkForGamepad() {
      const gamepads = navigator.getGamepads();
      const joystick = Array.from(gamepads).find(
        (gamepad) =>
          gamepad && gamepad.id === "T.16000M (Vendor: 044f Product: b10a)"
      );

      if (joystick) {
        if (!this.gamepadIndex || this.gamepadIndex !== joystick.index) {
          this.onGamepadConnected({ gamepad: joystick });
        }
        this.reconnectAttempts = 0;
      } else if (this.gamepadIndex !== null) {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn(
            "Gamepad disconnected, attempting to re-enumerate devices"
          );
          this.gamepadIndex = null;
          this.reconnectAttempts = 0;
        }
      }
    },

    onGamepadConnected(event) {
      if (event.gamepad.id !== "T.16000M (Vendor: 044f Product: b10a)") return;

      this.gamepadIndex = event.gamepad.index;
      this.lastGamepadState = event.gamepad;
      this.reconnectAttempts = 0;
      this.checkGamepad();
    },

    onGamepadDisconnected(event) {
      if (this.gamepadIndex === event.gamepad.index) {
        // Don't immediately null the index, allow for reconnection attempts
        this.reconnectAttempts = 0;
      }
    },

    checkGamepad() {
      if (this.gamepadIndex === null) return;

      const gamepad = navigator.getGamepads()[this.gamepadIndex];
      if (gamepad) {
        this.handleGamepadInput(gamepad);
        this.lastGamepadState = gamepad;
        requestAnimationFrame(this.checkGamepad);
      } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Continue animation frame if still attempting reconnection
        requestAnimationFrame(this.checkGamepad);
      }
    },

    initVisual() {
      const canvas = this.$refs.horizonCanvas;
      canvas.width = this.horizonWidth;
      canvas.height = this.horizonHeight;
      this.ctx = canvas.getContext("2d");
    },
    drawVisual() {
      this.clearCanvas();
      this.drawHorizon();
    },
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.horizonWidth, this.horizonHeight);
    },
    drawHorizon() {
      const { ctx, config } = this;

      ctx.save();
      ctx.beginPath();
      ctx.rect(config.x, config.y, this.horizonWidth, this.horizonHeight);
      ctx.stroke();
      ctx.clip();

      const angleInRadians = (this.currentTilt * Math.PI) / 180;

      ctx.translate(
        config.x + this.horizonWidth / 2,
        config.y + this.horizonHeight / 2
      );
      ctx.translate(this.currentShiftX, this.currentShiftY);
      ctx.rotate(angleInRadians);
      ctx.translate(
        -config.x - this.horizonWidth / 2,
        -config.y - this.horizonHeight / 2
      );

      ctx.fillStyle = config.skyColor;
      ctx.fillRect(
        config.x - this.horizonWidth / 2,
        config.y - this.horizonHeight,
        this.horizonWidth * 2,
        this.horizonHeight * 4
      );

      ctx.fillStyle = "white";
      ctx.fillRect(
        config.x - this.horizonWidth / 2,
        config.y + this.horizonHeight / 2 - config.whiteBorderHeight,
        this.horizonWidth * 2,
        config.whiteBorderHeight + this.horizonHeight / 4
      );

      ctx.fillStyle = config.landColor;
      ctx.fillRect(
        config.x - this.horizonWidth / 2,
        config.y + this.horizonHeight / 2,
        this.horizonWidth * 2,
        this.horizonHeight * 4
      );

      this.drawIndicator();
      ctx.restore();

      this.drawFocusLine();
    },
    drawIndicator() {
      const { ctx, config } = this;
      const centerX = config.x + this.horizonWidth / 2;
      const centerY = config.y + this.horizonHeight / 2;
      const radius = 60;

      ctx.beginPath();
      ctx.arc(centerX, centerY - 10, radius, 0, Math.PI, true);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 10;
      ctx.setLineDash([2, 24]);
      ctx.stroke();

      this.drawTriangle({ x: centerX, y: centerY - 30, width: 20, height: 15 });
      this.drawSkew(centerX, centerY);
    },
    drawSkew(centerX, centerY) {
      const { ctx, config } = this;

      const drawSkewShape = () => {
        ctx.beginPath();
        ctx.moveTo(centerX - 15, centerY + 20);
        ctx.lineTo(config.x + 120, centerY + 40);
        ctx.lineTo(config.x + 130, centerY + 40);
        ctx.lineTo(centerX - 10, centerY + 20);
        ctx.closePath();
        ctx.fill();
        ctx.setLineDash([0, 0]);
      };

      drawSkewShape();

      ctx.save();
      ctx.translate(this.horizonWidth + 20, 0);
      ctx.scale(-1, 1);
      drawSkewShape();
      ctx.restore();
    },
    drawTriangle({ x, y, width, height }) {
      const { ctx } = this;
      ctx.fillStyle = "white";
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(0, -height / 2);
      ctx.lineTo(-width / 2, height / 2);
      ctx.lineTo(width / 2, height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawFocusLine() {
      const { ctx, config } = this;
      const { x, y, focusX, focusY } = config;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, this.horizonWidth, this.horizonHeight);
      ctx.clip();

      const centerX = x + this.horizonWidth / 2;
      const centerY = y + this.horizonHeight / 2;

      const circleX = centerX + this.currentShiftX;
      const circleY = centerY + this.currentShiftY;
      const radius = 15;

      const distanceToCircle = Math.sqrt(
        (focusX - circleX) ** 2 + (focusY - circleY) ** 2
      );
      const isInRadius = distanceToCircle <= radius;

      this.updateGreenTime(isInRadius);

      const lineColor = isInRadius ? "green" : "yellow";

      ctx.beginPath();
      ctx.arc(circleX, circleY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "transparent";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, focusY);
      ctx.lineTo(x + this.horizonWidth, focusY);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(focusX, y);
      ctx.lineTo(focusX, y + this.horizonHeight);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    },
    startAnimation() {
      this.intervalRandomTilt = setInterval(() => {
        this.randomTilt();
      }, this.setSpeed());

      this.intervalRandomShift = setInterval(() => {
        this.randomShift();
      }, this.setSpeed());
    },
    stopAnimation() {
      clearInterval(this.intervalRandomTilt);
      clearInterval(this.intervalRandomShift);
    },
    randomTilt() {
      const targetTilt = this.getRandom(-70, 70);
      this.animateValue(
        this.currentTilt,
        targetTilt,
        this.setSpeed(),
        (value) => {
          this.currentTilt = value;
          this.drawVisual();
        }
      );
    },
    randomShift() {
      const targetShiftX = this.getRandom(-70, 70);
      const targetShiftY = this.getRandom(-70, 70);
      this.animateValue(
        this.currentShiftX,
        targetShiftX,
        this.setSpeed(),
        (value) => {
          this.currentShiftX = value;
          this.drawVisual();
        }
      );

      this.animateValue(
        this.currentShiftY,
        targetShiftY,
        this.setSpeed(),
        (value) => {
          this.currentShiftY = value;
          this.drawVisual();
        }
      );
    },
    getRandom(min, max) {
      return Math.random() * (max - min) + min;
    },
    animateValue(start, end, duration, callback) {
      const startTime = performance.now();
      const step = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easedProgress = this.easeInOutCubic(progress);

        const value = start + (end - start) * easedProgress;
        callback(value);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    },
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    setSpeed() {
      if (this.speed === "very_slow") {
        return 6000;
      }
      if (this.speed === "slow") {
        return 5000;
      }
      if (this.speed === "medium") {
        return 4000;
      }
      if (this.speed === "fast") {
        return 3000;
      }
      if (this.speed === "very_fast") {
        return 2000;
      }
    },
    updateGreenTime(isGreen) {
      if (isGreen && !this.greenLineStartTime) {
        this.greenLineStartTime = Date.now();
      } else {
        if (isGreen && this.greenLineStartTime) {
          const currentTime = Date.now();
          this.greenLineDuration +=
            (currentTime - this.greenLineStartTime) / 1000;
          this.greenLineStartTime = null;
        }
      }
    },
    handleGamepadInput(gamepad) {
      const [leftStickX, leftStickY] = gamepad.axes;
      if (!this.$refs.horizonCanvas) {
        return;
      }
      const canvasWidth = this.$refs.horizonCanvas.width;
      const canvasHeight = this.$refs.horizonCanvas.height;

      const sensitivity = 0.5; // You can adjust this value to control how fast the focus line moves

      this.config.focusX += leftStickX * sensitivity;
      this.config.focusY += leftStickY * sensitivity;

      // Clamp the focusX and focusY to stay within the canvas bounds
      this.config.focusX = Math.max(
        0,
        Math.min(this.config.focusX, canvasWidth)
      );
      this.config.focusY = Math.max(
        0,
        Math.min(this.config.focusY, canvasHeight)
      );

      this.drawVisual();
    },
  },
};
</script>

<style scoped>
canvas {
  margin-bottom: 20px;
  margin-top: -20px;
  margin-right: 10px;
  margin-left: 70px;
}

.centered-component {
  margin: auto;
  max-width: 600px;
  width: 100%;
}
</style>
