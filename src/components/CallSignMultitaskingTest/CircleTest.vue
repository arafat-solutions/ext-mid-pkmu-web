<template>
  <div class="circle-test">
    <canvas ref="circleCanvas"></canvas>
    <div
      v-if="notification.show && isTraining"
      :class="['notification', notification.type]"
    >
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
const COLORS = {
  DEFAULT: "#b75010",
  YELLOW: "yellow",
  RED: "red",
  DISABLED: "gray",
};

const SPEED_INTERVALS = {
  slow: 5000,
  medium: 4000,
  fast: 3000,
};

const FREQUENCY_INTERVALS = {
  seldom: 5000,
  medium: 4000,
  often: 3000,
};

export default {
  name: "CircleTest",
  props: {
    alertLightsData: {
      type: Object,
      required: true,
    },
    isTraining: Boolean,
    updateResults: Function,
    updateResultLightAvgTime: Function,
  },
  data() {
    return {
      circleConfig: [],
      activeIndex: -1,
      timerInterval: null,
      alternateChange: false,
      setInterval: 0,
      redStartTime: null,
      correctResponseTimes: [],
      notification: {
        message: "",
        type: "", // 'success' or 'error'
        show: false,
      },
    };
  },
  mounted() {
    this.initializeTest();
    window.addEventListener("keydown", this.handleKeyPress);
    this.$refs.circleCanvas.addEventListener("click", this.handleClick);
  },
  beforeUnmount() {
    this.stopChangingLight();
    window.removeEventListener("keydown", this.handleKeyPress);
    this.$refs.circleCanvas.removeEventListener("click", this.handleClick);
  },
  methods: {
    initializeTest() {
      this.calculateInterval();
      this.initCircleConfig();
      this.initCanvas();
      this.drawVisual();
      if (this.alertLightsData?.play) {
        this.startChangingLight();
      }
    },
    restartChangingLight() {
      clearInterval(this.timerInterval);
      this.startChangingLight();
    },
    calculateInterval() {
      this.setInterval =
        SPEED_INTERVALS[this.alertLightsData?.speed] +
        FREQUENCY_INTERVALS[this.alertLightsData?.frequency];
    },
    initCircleConfig() {
      const letters = ["T", "Y", "U", "I"];
      this.circleConfig = letters.map((letter, index) => ({
        x: 50 + index * 90,
        y: 100,
        radius: 40,
        fillColor: COLORS.DEFAULT,
        letter,
      }));
    },
    initCanvas() {
      const canvas = this.$refs.circleCanvas;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      this.ctx = canvas.getContext("2d");
    },
    drawVisual() {
      this.clearCanvas();
      this.circleConfig.forEach(this.drawCircle);
    },
    clearCanvas() {
      const { width, height } = this.$refs.circleCanvas;
      this.ctx.clearRect(0, 0, width, height);
    },
    drawCircle({ x, y, radius, fillColor, letter }) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "black";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, x, y);
    },
    getRandomColor() {
      if (Math.random() < 0.6) {
        this.updateResults("alert_lights", { total_warning_count: 1 });
        return COLORS.YELLOW;
      } else {
        this.updateResults("alert_lights", { total_alert_count: 1 });
        return COLORS.RED;
      }
    },
    changeActiveCircleColor() {
      if (this.activeIndex !== -1) {
        this.circleConfig[this.activeIndex].fillColor = COLORS.DEFAULT;
      }
      this.activeIndex = this.getRandomIndex();
      const newColor = this.getRandomColor();
      this.circleConfig[this.activeIndex].fillColor = newColor;

      if (newColor === COLORS.RED) {
        this.redStartTime = performance.now();
      } else {
        this.redStartTime = null;
      }
    },
    getRandomIndex() {
      return Math.floor(Math.random() * this.circleConfig.length);
    },
    startChangingLight() {
      this.timerInterval = setInterval(() => {
        if (this.alternateChange) {
          if (this.activeIndex !== -1) {
            this.circleConfig[this.activeIndex].fillColor = COLORS.DEFAULT;
            this.activeIndex = -1;
          }
        } else {
          this.changeActiveCircleColor();
        }
        this.drawVisual();
        this.alternateChange = !this.alternateChange;
      }, this.setInterval);
    },
    stopChangingLight() {
      clearInterval(this.timerInterval);
    },
    handleKeyPress(event) {
      console.log(event);
      const key = event.key.toLowerCase();
      const letters = ["t", "y", "u", "i"];

      if (letters.includes(key)) {
        const index = letters.indexOf(key);
        this.handleResponse(index);
      }
    },
    handleClick(event) {
      console.log(event);
      const rect = this.$refs.circleCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      for (let i = 0; i < this.circleConfig.length; i++) {
        const circle = this.circleConfig[i];
        const distance = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
        if (distance <= circle.radius) {
          this.handleResponse(i);
          break;
        }
      }
    },
    handleResponse(index) {
      const fillColor = this.circleConfig[index].fillColor;

      if (index === this.activeIndex) {
        if (fillColor === COLORS.RED) {
          this.updateResults("alert_lights", { correct_response: 1 });
          this.showNotification("Benar!", "success");
          if (this.redStartTime !== null) {
            const responseTime = performance.now() - this.redStartTime;
            this.correctResponseTimes.push(responseTime);
            this.updateAverageResponseTime();
          }
        } else if (fillColor === COLORS.YELLOW) {
          this.updateResults("alert_lights", { wrong_response: 1 });
          this.showNotification("Salah!", "error");
        }

        // Turn off the light immediately
        this.circleConfig[index].fillColor = COLORS.DEFAULT;
        this.activeIndex = -1;
        this.drawVisual();

        // Reset the alternation and restart the timer
        this.alternateChange = false;
        this.restartChangingLight();
      } else {
        if (this.activeIndex !== -1) {
          this.updateResults("alert_lights", { wrong_response: 1 });
        }
      }
    },
    updateAverageResponseTime() {
      const avgTime = this.getAverageResponseTime();
      this.updateResultLightAvgTime(avgTime);
    },
    getAverageResponseTime() {
      if (this.correctResponseTimes.length === 0) {
        return 0;
      }
      const sum = this.correctResponseTimes.reduce((a, b) => a + b, 0);
      const avg = sum / this.correctResponseTimes.length / 1000;
      return Number(avg.toFixed(2));
    },

    showNotification(message, type = "success") {
      this.notification = {
        message,
        type,
        show: true,
      };
      setTimeout(() => {
        this.notification.show = false;
      }, 1500);
    },
  },
};
</script>

<style scoped>
canvas {
  border: none;
}
.notification {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  z-index: 1000;
}
.notification.success {
  background-color: green;
}
.notification.error {
  background-color: red;
}
</style>
