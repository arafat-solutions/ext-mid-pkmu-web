<template>
  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6" style="margin-right: 5px;">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6" style="margin-right: 5px;">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>

    <div class="radar-container">
      <canvas ref="radarCanvas" :width="width" :height="height"></canvas>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      isPause: false,
      isCanClick: false,
      isLoading: false,
      width: 600,
      height: 500,
      scannerAngle: 0,
      detectedObject: 0,
      userClickCount: 0,
      objects: [],
      responseTimes: [],
      suitableObjectTimes: [],
      responseDurations: [],
      radarInterval: null,
      objectInterval: null,
      countdownInterval: null,
      result: {
        total_object: 0,
        corrected_object: 0,
        missed_object: 0,
        avg_response_time: 0,
      },
      config: {
        direction: null, //clockwise, counter_clockwise
        duration: null, //milisecond
        frequency: null, // very_often, often, sometimes, sheldom, very_seldom
        shapeSize: null, // very_big, big, medium, small, very_small
        shapes: [], //'circle', 'square', 'triangle'
        targetShape: null, //'circle', 'square', 'triangle'
        speed: null, // very_slow, slow, medium, fast, very_fast
        density: null //'very_easy', 'easy', 'medium', 'hard', 'very_hard'
      }
    };
  },
  mounted() {
    this.initConfig();
  },
  created() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    pause() {
      this.stopRadar();
      clearInterval(this.countdownInterval);
      this.isPause = true;
    },
    startAgain() {
      this.startCountdown();
      this.initRadar();
      this.isPause = false;
    },
    exit() {
      this.$router.push('module');
    },
    initConfig() {
      try {
        let config = JSON.parse(localStorage.getItem('scheduleData'));

        if (config) {
          const radarVigillance = config.tests.find(test => test.testUrl === 'radar-vigilance-test').config;

          this.config.duration = radarVigillance.duration * 60;
          this.config.batteryTestConfigId = radarVigillance.id;
          this.config.moduleId = config.moduleId;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          this.config.direction = radarVigillance.direction;
          this.config.shapeSize = radarVigillance.shapeSize;
          this.config.frequency = radarVigillance.frequency;
          this.config.shapes = this.setShapeConfig(radarVigillance.shapes);
          this.config.targetShape = radarVigillance.targetShape;
          this.config.speed = radarVigillance.speed;
          this.config.density = radarVigillance.density;

          this.isConfigLoaded = true;

          this.initRadar();
          this.startCountdown();
        }
      } catch (error) {
        console.log(error, 'error')
      }
    },
    initRadar() {
      this.radarInterval = setInterval(this.updateRadar, 100);
      this.objectInterval = setInterval(this.addShape, this.setFrequency());

      this.isCanClick = true
    },
    drawRadar() {
      const canvas = this.$refs.radarCanvas;
      const ctx = canvas.getContext("2d");
      const radius = Math.min(this.width, this.height) / 2;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;

      // Draw Radar
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw Scanner
      ctx.beginPath();
      ctx.moveTo(this.width / 2, this.height / 2);
      ctx.arc(this.width / 2, this.height / 2, radius, this.scannerAngle, this.scannerAngle + Math.PI / 6);
      ctx.closePath();
      ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
      ctx.fill();

      // Draw Grid
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, (radius / 4) * i, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw Object
      let objectsInScanner = 0;
      for (let obj of this.objects) {
        const distance = Math.hypot(obj.x - this.width / 2, obj.y - this.height / 2);
        const angle = Math.atan2(obj.y - this.height / 2, obj.x - this.width / 2);

        // Draw objects within scanned area only
        if (this.isInScannedArea(angle, distance, radius)) {
          if (objectsInScanner >= this.setDensity) {
            break;
          }

          ctx.beginPath();

          // Set Size Objcet
          if (obj.type === "circle" || obj.type === "square") {
            ctx.arc(obj.x, obj.y, this.setShapeSize(), 0, 2 * Math.PI);
          }

          if (obj.type === "triangle") {
            this.drawTriangle(ctx, obj.x, obj.y, this.setShapeSize('triangle'));
          }

          //Set Opacity Object
          ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';

          if (obj.type === "circle") {
            ctx.fill();

            //Check Detected Object
            if (!obj.detected) {
              obj.detected = true;
              this.detectTargetShape("circle")
            }
            obj.sweepCount = 0;
          } else if (obj.type === "square") {
            ctx.fillRect(obj.x - 5, obj.y - 5, this.setShapeSize('square'), this.setShapeSize('square'));

            //Check Detected Object
            if (!obj.detected) {
              obj.detected = true;
              this.detectTargetShape("square")
            }

            obj.sweepCount = 0;
          } else if (obj.type === "triangle") {
            ctx.fill();

            //Check Detected Object
            if (!obj.detected) {
              obj.detected = true;
              this.detectTargetShape("triangle")
            }
            obj.sweepCount = 0;
          }

          objectsInScanner++;
        } else {
          obj.sweepCount++;
        }
      }
    },
    updateRadar() {
      this.drawRadar();

      if (this.config.direction === 'clockwise') {
        this.scannerAngle += this.setSpeed();
      } else {
        this.scannerAngle -= this.setSpeed();
      }

      if (this.scannerAngle >= 2 * Math.PI) {
        this.scannerAngle -= 2 * Math.PI;
      } else if (this.scannerAngle < 0) {
        this.scannerAngle += 2 * Math.PI;
      }

      this.removeUndetectedObjects();
    },
    stopRadar() {
      clearInterval(this.radarInterval);
      this.radarInterval = null;

      clearInterval(this.objectInterval);
      this.objectInterval = null;

      this.isCanClick = false;
    },
    setShapeConfig(shapes){
      let result = [];

      if (shapes.circle) {
        result.push('circle');
      }
      if (shapes.rectangle) {
        result.push('rectangle');
      }
      if (shapes.square) {
        result.push('square');
      }

      return result;
    },
    setFrequency() {
      if (this.config.frequency === 'very_often') {
        return 200;
      }
      if (this.config.frequency === 'often') {
        return 300;
      }
      if (this.config.frequency === 'sometimes') {
        return 400;
      }
      if (this.config.frequency === 'sheldom') {
        return 500;
      }
      if (this.config.frequency === 'very_seldom') {
        return 600;
      }
    },
    setSpeed() {
      if (this.config.speed === 'very_slow') {
        return 0.01;
      }
      if (this.config.speed === 'slow') {
        return 0.03;
      }
      if (this.config.speed === 'medium') {
        return 0.05;
      }
      if (this.config.speed === 'fast') {
        return 0.07;
      }
      if (this.config.speed === 'very_fast') {
        return 0.1;
      }
    },
    setDensity() {
      if (this.config.density === 'very_easy') {
        return 3;
      }
      else if (this.config.density === 'easy') {
        return 4;
      }
      else if (this.config.density === 'medium') {
        return 5;
      }
      else if (this.config.density === 'hard') {
        return 7;
      }
      else if (this.config.density === 'very_hard') {
        return 10;
      }
    },
    setShapeSize(type = null) {
      if (type === "triangle") {
        if (this.config.shapeSize === 'very_small') {
          return 6;
        }
        if (this.config.shapeSize === 'small') {
          return 8;
        }
        if (this.config.shapeSize === 'medium') {
          return 12;
        }
        if (this.config.shapeSize === 'big') {
          return 16;
        }
        if (this.config.shapeSize === 'very_big') {
          return 20;
        }
      }

      if (type === "square") {
        if (this.config.shapeSize === 'very_small') {
          return 6;
        }
        if (this.config.shapeSize === 'small') {
          return 9;
        }
        if (this.config.shapeSize === 'medium') {
          return 11;
        }
        if (this.config.shapeSize === 'big') {
          return 14;
        }
        if (this.config.shapeSize === 'very_big') {
          return 16;
        }
      }

      if (this.config.shapeSize === 'very_small') {
        return 3;
      }
      if (this.config.shapeSize === 'small') {
        return 5;
      }
      if (this.config.shapeSize === 'medium') {
        return 7;
      }
      if (this.config.shapeSize === 'big') {
        return 9;
      }
      if (this.config.shapeSize === 'very_big') {
        return 11;
      }
    },
    detectTargetShape(type) {
      if (this.config.targetShape === type) {
        this.detectedObject++;
        this.suitableObjectTimes.push(Date.now());
      }
    },
    drawTriangle(ctx, x, y, size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath();
    },
    isInScannedArea(angle, distance, radius) {
      const scannerStartAngle = this.scannerAngle;
      const scannerEndAngle = this.scannerAngle + Math.PI / 6;
      const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
      return distance <= radius && normalizedAngle >= scannerStartAngle && normalizedAngle <= scannerEndAngle;
    },
    addShape() {
      const radius = Math.min(this.width, this.height) / 2;
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const x = this.width / 2 + distance * Math.cos(angle);
      const y = this.height / 2 + distance * Math.sin(angle);

      //Set Object Showed
      const type = this.config.shapes[Math.floor(Math.random() * this.config.shapes.length)];

      this.objects.push({ x, y, type, detected: false, sweepCount: 0 });

      //Remove old objects
      if (this.objects.length > 50) {
        this.objects.shift();
      }
    },
    removeUndetectedObjects() {
      const sweepLimit = 5; // Set the sweep limit after which objects are removed
      this.objects = this.objects.filter(obj => {
        if (obj.sweepCount > sweepLimit) {
          return false;
        }
        return true;
      });
    },
    handleKeydown(event) {
      if (event.code === "Space" && this.isCanClick) {
        this.userClickCount++;
        this.responseTimes.push(Date.now());
        this.calculateResponseTime();
      }
    },
    calculateResponseTime() {
      if (this.suitableObjectTimes.length > 0 && this.responseTimes.length > 0) {
        const suitableTime = this.suitableObjectTimes[this.suitableObjectTimes.length - 1];
        const responseTime = this.responseTimes.shift();
        const responseDuration = responseTime - suitableTime;

        if (responseDuration > 0) {
          this.responseDurations.push(responseDuration);
        }
        this.suitableObjectTimes = [];
      }
    },
    averageResponseTime() {
      if (this.responseDurations.length > 0) {
        const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);
        return (sum / this.responseDurations.length) / 1000;
      }
      return 0;
    },
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        if (this.config.duration > 0) {
          this.config.duration--;
        } else {
          clearInterval(this.countdownInterval);
          this.stopRadar();

          // Submit Answer
          setTimeout(() => {
            this.calculatedResult();
          }, 1000);

        }
      }, 1000);
    },
    calculatedResult() {
      this.result.total_object = this.detectedObject;

      // Handle user deliberate click
      if (this.userClickCount > this.detectedObject) {
        this.result.corrected_object = 0;
        this.result.missed_object = 100;
        this.result.avg_response_time = 0;
      } else {
        this.result.corrected_object = this.userClickCount;
        this.result.missed_object = this.detectedObject - this.userClickCount

        if (this.userClickCount > 0) {
          const resultTimeResonded = this.averageResponseTime()
          this.result.avg_response_time = resultTimeResonded.toFixed(2);
        } else {
          this.result.avg_response_time = 0;
        }
      }

      this.submitResult()
    },
    async submitResult() {
      try {
        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.config.sessionId,
          userId: this.config.userId,
          moduleId: this.config.moduleId,
          batteryTestConfigId: this.config.batteryTestConfigId,
          result: this.result,
        }

        const res = await fetch(`${API_URL}api/submission`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        )

        if (!res.ok) {
          throw new Error('Failed Submit Test');
        }
      } catch (error) {
        console.error(error), "error";
      } finally {
        this.isLoading = false;

        //Call Utils Remove Test from Local Storage

        this.$router.push('/module');
      }
    },
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.config.duration / 60).toString().padStart(2, '0');
      const seconds = (this.config.duration % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    },
  },
};
</script>

<style scoped>
  .main-view {
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    margin: 60px auto;
  }
  .timer-container-trial {
    position: absolute;
    right: 0;
    top: 0;
    background-color: #0349D0;
    padding: 0.75rem;
    color: #ffffff;
    font-weight: bold;
    border-bottom-left-radius: 15px;
  }
  .timer-container-trial button {
    color: #000000;
    font-weight: bold;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 5px;
    border-color: transparent;
    min-width: 100px;
    cursor: pointer;
  }
  .timer-container {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: #0349D0;
    padding: 1.5rem 5rem;
    color: #ffffff;
    font-weight: bold;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
  }
  .radar-container {
    display: flex;
    align-items: center;
  }
  canvas {
    margin-top: 15px !important;
    display: block;
    margin: 0 auto;
    background-color: black;
  }
  .loading-container {
    /* Add your loading indicator styles here */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    /* Black background with 80% opacity */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    /* Ensure it is above other content */
  }
  .spinner {
    border: 8px solid rgba(255, 255, 255, 0.3);
    /* Light border */
    border-top: 8px solid #ffffff;
    /* White border for the spinning part */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
  .text {
    color: #ffffff;
    margin-top: 20px;
    font-size: 1.2em;
  }
</style>
