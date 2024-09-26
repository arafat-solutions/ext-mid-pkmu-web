<template>
  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div :class="isTrial ? 'timer-container-trial' : 'timer-container'">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6" style="margin-right: 5px;">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6" style="margin-right: 5px;">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>

    <div class="radar-container">
      <div class="row">
        <div class="col-12">
          <canvas ref="radarCanvas" :width="width" :height="height"></canvas>
        </div>
        <div class="col-12">
          <p class="m-3">
            Tekan "Trigger Pada Joystick" jika bentuk
            <strong> {{ config.targetShape }} </strong>
            muncul di radar.
          </p>
          <p class="feedback-text" :style="{ color: feedbackColor }">{{ feedbackText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'

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
      userCorrectClickCount: 0,
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
        false_positives: 0,
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
      },
      gamepad: null,
      gamepadPolling: null,
      isTargetVisible: false,  // New property to track if target is currently visible
      falsePositives: 0,
      triggerState: false,
      lastTriggerReleaseTime: 0,
      minTimeBetweenPresses: 100, // milliseconds
      missedTargets: 0,
      feedbackText: "",
      feedbackColor: "",
      userInputs: [],
      currentVisibleObjects: [], // Track all currently visible objects
      lastShapeAppearanceTime: null,
      objectPool: [],
      lastUpdateTime: 0,
    };
  },
  mounted() {
    window.addEventListener("gamepadconnected", this.handleGamepadConnected);
    window.addEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
    this.checkForGamepads();
    this.startGamepadPolling();
    let reloadCount = parseInt(localStorage.getItem('reloadCountRadarVigilance') || '0')
    reloadCount++
    localStorage.setItem('reloadCountRadarVigilance', reloadCount.toString())
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('reloadCountRadarVigilance', reloadCount.toString())
    })

    this.initConfig();

  },
  created() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("gamepadconnected", this.handleGamepadConnected);
    window.removeEventListener("gamepaddisconnected", this.handleGamepadDisconnected);
    this.stopGamepadPolling();
    window.removeEventListener("keydown", this.handleKeydown);

    // Existing code...
    clearInterval(this.radarInterval);
    clearInterval(this.objectInterval);
    clearInterval(this.countdownInterval);
  },
  methods: {
    handleGamepadConnected(event) {
      console.log("A gamepad connected:", event.gamepad);
      if (event.gamepad.id == 'T.16000M (Vendor: 044f Product: b10a)')
        this.gamepad = event.gamepad;
    },
    handleGamepadDisconnected(event) {
      console.log("A gamepad disconnected:", event.gamepad);
      this.gamepad = null;
    },
    checkForGamepads() {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          console.log("Gamepad detected on load:", gamepads[i]);
          this.gamepad = gamepads[i];
          break;
        }
      }
    },
    startGamepadPolling() {
      this.gamepadPolling = setInterval(this.pollGamepad, 100); // Poll every 100ms
    },
    stopGamepadPolling() {
      clearInterval(this.gamepadPolling);
    },
    pollGamepad() {
      if (this.gamepad) {
        const gamepad = navigator.getGamepads()[this.gamepad.index];

        if (gamepad) {
          const triggerPressed = gamepad.buttons[0].pressed;
          const currentTime = Date.now();

          // Detect button press
          if (triggerPressed && !this.triggerState) {
            if (currentTime - this.lastTriggerReleaseTime > this.minTimeBetweenPresses) {
              console.log("Trigger button pressed on gamepad:", gamepad);
              this.handleTriggerPress();
            }
            this.triggerState = true;
          }
          // Detect button release
          else if (!triggerPressed && this.triggerState) {
            this.triggerState = false;
            this.lastTriggerReleaseTime = currentTime;
          }
        }
      }
    },
    detectShape(obj) {
      if (!obj.detected) {
        obj.detected = true;
        obj.appearanceTime = Date.now();
        this.currentVisibleObjects.push(obj);

        if (obj.type === this.config.targetShape) {
          this.detectedObject++;
          // Set a timeout to check if the user missed the target
          obj.missedTimeout = setTimeout(() => {
            if (this.currentVisibleObjects.includes(obj)) {
              this.handleMissedTarget(obj);
            }
          }, 2000);  // Adjust this value based on how long you want to give the user to respond
        }
      }
    },

    handleMissedTarget(obj) {
      const index = this.currentVisibleObjects.indexOf(obj);
      if (index > -1) {
        this.currentVisibleObjects.splice(index, 1);
        if (obj.type === this.config.targetShape) {
          this.missedTargets++;
          this.feedbackText = "Missed target";
          this.feedbackColor = "red";

          // Add to userInputs for graph data
          this.userInputs.push({
            type: 'missed',
            responseTime: null,
            timestamp: Date.now(),
            shapeType: obj.type
          });

          console.log(`Missed target. Total missed: ${this.missedTargets}`); // Debugging line

          this.$nextTick(() => {
            setTimeout(() => this.clearFeedback(), 1000);
          });
        }
      }
    },

    handleTriggerPress() {
      if (this.isCanClick) {
        const currentTime = Date.now();
        const targetObject = this.currentVisibleObjects.find(obj => obj.type === this.config.targetShape);

        if (targetObject) {
          // Correct trigger press
          this.userClickCount++;
          this.userCorrectClickCount++;
          const responseTime = currentTime - targetObject.appearanceTime;
          this.responseTimes.push(responseTime);
          this.feedbackText = `Correct! ${responseTime} ms`;
          this.feedbackColor = "green";
          this.userInputs.push({
            type: 'correct',
            responseTime: responseTime,
            timestamp: currentTime,
            shapeType: targetObject.type
          });
          const index = this.currentVisibleObjects.indexOf(targetObject);
          if (index > -1) {
            this.currentVisibleObjects.splice(index, 1);
          }
          // Clear the missed target timeout
          if (targetObject.missedTimeout) {
            clearTimeout(targetObject.missedTimeout);
          }
        } else {
          // Incorrect trigger press
          this.falsePositives++;
          let responseTime = null;
          let shapeType = null;
          if (this.currentVisibleObjects.length > 0) {
            const lastVisibleObject = this.currentVisibleObjects[this.currentVisibleObjects.length - 1];
            responseTime = currentTime - lastVisibleObject.appearanceTime;
            shapeType = lastVisibleObject.type;
          }
          this.feedbackText = responseTime ? `Wrong input, ${responseTime} ms` : "Wrong input";
          this.feedbackColor = "red";
          this.userInputs.push({
            type: 'incorrect',
            responseTime: responseTime,
            timestamp: currentTime,
            shapeType: shapeType
          });
        }
        // Ensure feedback is always displayed
        this.$nextTick(() => {
          setTimeout(() => this.clearFeedback(), 1000);
        });
      }
    },

    clearFeedback() {
      this.feedbackText = "";
      this.feedbackColor = "";
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
      if (confirm("Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang.")) {
        this.$router.push('module');
      }
    },
    initConfig() {
      let config = JSON.parse(localStorage.getItem('scheduleData'));

      if (config) {
        try {
          const radarVigillance = config.tests.find(test => test.testUrl === 'radar-vigilance-test').config;

          this.config.duration = radarVigillance.duration * 60;
          this.config.batteryTestConfigId = radarVigillance.id;
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
        } catch (e) {
          console.error('Error parsing schedule data:', e);
        } finally {
          this.initRadar();
          this.startCountdown();
        }
      } else {
        console.warn('No schedule data found in localStorage.');
      }
    },

    initRadar() {
      this.isCanClick = true;
      this.lastUpdateTime = 0;
      this.animationFrameId = requestAnimationFrame(this.updateRadar);
      this.objectInterval = setInterval(this.addShape, this.setFrequency());
    },


    updateRadar(currentTime) {
      if (!this.lastUpdateTime) {
        this.lastUpdateTime = currentTime;
      }

      const deltaTime = currentTime - this.lastUpdateTime;

      if (deltaTime >= 16) { // Aim for 60 FPS (1000ms / 60 ≈ 16ms)
        this.drawRadar();

        const speed = this.setSpeed() * deltaTime / 16; // Adjust speed based on time passed
        if (this.config.direction === 'clockwise') {
          this.scannerAngle += speed;
        } else {
          this.scannerAngle -= speed;
        }

        // Normalize the angle
        this.scannerAngle = (this.scannerAngle + 2 * Math.PI) % (2 * Math.PI);

        this.removeUndetectedObjects();
        this.updateVisibleObjects();

        this.lastUpdateTime = currentTime;
      }

      this.animationFrameId = requestAnimationFrame(this.updateRadar);
    },
    drawRadar() {
      const canvas = this.$refs.radarCanvas;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      const radius = Math.min(this.width, this.height) / 2;

      // Clear the canvas
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;

      // Draw Radar Circle
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

      // Draw and Track Objects
      let objectsInScanner = 0;
      this.currentVisibleObjects = []; // Reset visible objects

      for (let obj of this.objects) {
        const distance = Math.hypot(obj.x - this.width / 2, obj.y - this.height / 2);
        const angle = Math.atan2(obj.y - this.height / 2, obj.x - this.width / 2);

        // Draw objects within scanned area only
        if (this.isInScannedArea(angle, distance, radius)) {
          if (objectsInScanner >= this.setDensity()) {
            break;
          }

          ctx.beginPath();

          // Set Size Object
          if (obj.type === "circle") {
            ctx.arc(obj.x, obj.y, this.setShapeSize(), 0, 2 * Math.PI);
          } else if (obj.type === "square") {
            const size = this.setShapeSize('square');
            ctx.rect(obj.x - size / 2, obj.y - size / 2, size, size);
          } else if (obj.type === "triangle") {
            this.drawTriangle(ctx, obj.x, obj.y, this.setShapeSize('triangle'));
          }

          //Set Opacity Object
          ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
          ctx.fill();

          // Detect and track object
          if (!obj.detected) {
            obj.detected = true;
            obj.appearanceTime = Date.now();
            if (obj.type === this.config.targetShape) {
              this.detectedObject++;
              // Set a timeout to check if the user missed the target
              setTimeout(() => {
                if (this.currentVisibleObjects.includes(obj)) {
                  this.handleMissedTarget(obj);
                }
              }, 2000); // Adjust this value based on how long you want to give the user to respond
            }
          }

          this.currentVisibleObjects.push(obj);
          objectsInScanner++;
        } else {
          obj.sweepCount++;
        }
      }

      // Update isTargetCurrentlyVisible based on currentVisibleObjects
      this.isTargetCurrentlyVisible = this.currentVisibleObjects.some(obj => obj.type === this.config.targetShape);

      // Remove objects that are no longer visible
      this.objects = this.objects.filter(obj => {
        if (obj.sweepCount > 5) { // Adjust this value as needed
          return false;
        }
        return true;
      });
    },

    updateVisibleObjects() {
      const radius = Math.min(this.width, this.height) / 2;
      this.currentVisibleObjects = this.currentVisibleObjects.filter(obj =>
        this.isInScannedArea(
          Math.atan2(obj.y - this.height / 2, obj.x - this.width / 2),
          Math.hypot(obj.x - this.width / 2, obj.y - this.height / 2),
          radius
        )
      );
    },
    stopRadar() {
      cancelAnimationFrame(this.animationFrameId);
      clearInterval(this.objectInterval);
      this.isCanClick = false;
    },
    setShapeConfig(shapes) {
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
      switch (this.config.frequency) {
        case 'very_often':
          return 50;  // Every 50ms
        case 'often':
          return 100; // Every 100ms
        case 'sometimes':
          return 200; // Every 200ms
        case 'seldom':
          return 300; // Every 300ms
        case 'very_seldom':
          return 400; // Every 400ms
        default:
          return 200; // Default to 'sometimes'
      }
    },
    setSpeed() {
      const baseSpeed = 0.02; // This was the original 'very_slow' speed
      const speedMultiplier = {
        'very_slow': 0.2,
        'slow': 0.5,
        'medium': 0.7,
        'fast': 0.9,
        'very_fast': 1.2
      };

      return baseSpeed * (speedMultiplier[this.config.speed] || 1);
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
      const normalizedScannerEndAngle = scannerEndAngle > 2 * Math.PI ? scannerEndAngle - 2 * Math.PI : scannerEndAngle;
      const withinRadius = distance <= radius;
      const withinAngle = (
        (scannerStartAngle <= normalizedAngle && normalizedAngle <= normalizedScannerEndAngle) ||
        (scannerEndAngle > 2 * Math.PI && (normalizedAngle >= scannerStartAngle || normalizedAngle <= (scannerEndAngle - 2 * Math.PI)))
      );

      return withinRadius && withinAngle;
    },
    createObject(type, x, y) {
      if (this.objectPool.length > 0) {
        const obj = this.objectPool.pop();
        obj.type = type;
        obj.x = x;
        obj.y = y;
        obj.detected = false;
        obj.sweepCount = 0;
        return obj;
      }
      return { type, x, y, detected: false, sweepCount: 0 };
    },

    removeObject(obj) {
      const index = this.objects.indexOf(obj);
      if (index > -1) {
        this.objects.splice(index, 1);
        this.objectPool.push(obj);
      }
    },
    addShape() {
      const radius = Math.min(this.width, this.height) / 2;
      const minDistance = 50;
      let angle, distance, x, y;

      do {
        angle = Math.random() * 2 * Math.PI;
        distance = minDistance + Math.random() * (radius - minDistance);

        x = this.width / 2 + distance * Math.cos(angle);
        y = this.height / 2 + distance * Math.sin(angle);
      } while (
        this.isInScannedArea(angle, distance, radius) ||
        distance < minDistance + 20
      );

      // Increase probability of target shape
      const targetProbability = 0.7; // 60% chance of target shape
      const randomValue = Math.random();

      let type;
      if (randomValue < targetProbability) {
        type = this.config.targetShape;
      } else {
        // If not target, randomly choose from other shapes
        const otherShapes = this.config.shapes.filter(shape => shape !== this.config.targetShape);
        type = otherShapes[Math.floor(Math.random() * otherShapes.length)];
      }

      const newObj = this.createObject(type, x, y);
      this.objects.push(newObj);

      if (this.objects.length > 100) {
        this.removeObject(this.objects[0]);
      }
    },
    removeUndetectedObjects() {
      const sweepLimit = 5;
      this.objects = this.objects.filter(obj => {
        if (obj.sweepCount > sweepLimit) {
          this.removeObject(obj);
          return false;
        }
        return true;
      });
    },
    handleKeydown(event) {
      console.log(event.code);
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
          //Remove Object when Duration Under 5 second
          if (this.config.duration === 5) {
            clearInterval(this.objectInterval);
            this.objectInterval = null;
            this.objects = []
          }
          this.config.duration--;
        } else {
          clearInterval(this.countdownInterval);
          this.stopRadar();

          // Submit Answer
          this.calculatedResult();
        }
      }, 1000);
    },
    calculatedResult() {
      this.result.total_object = this.detectedObject;
      this.result.corrected_object = this.userCorrectClickCount;
      this.result.missed_object = this.missedTargets;
      this.result.false_positives = this.falsePositives;

      if (this.userCorrectClickCount > 0) {
        const resultTimeResponded = this.averageResponseTime()
        this.result.avg_response_time = resultTimeResponded.toFixed(2);
      } else {
        this.result.avg_response_time = 0;
      }

      // Include graph data in the result
      this.result.graph_data = this.userInputs;

      console.log(this.result, 'submit result');
      this.submitResult();
    },
    async submitResult() {
      try {
        if (this.isTrial) {
          this.$router.push('/module');
          return;
        }

        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.config.sessionId,
          userId: this.config.userId,
          batteryTestConfigId: this.config.batteryTestConfigId,
          refreshCount: parseInt(localStorage.getItem('reloadCountRadarVigilance')),
          result: this.result,
        }

        const res = await fetch(`${API_URL}/api/submission`,
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

        removeTestByNameAndUpdateLocalStorage('Radar Vigilance Test');
        localStorage.removeItem('reloadCountRadarVigilance');
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
