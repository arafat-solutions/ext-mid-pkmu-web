<template>
  <div class="timer" style="height: 30px; margin-bottom: 10px;">
    <strong style="padding: 5px;"> Waktu : {{ minutes }}:{{ seconds }} </strong>
  </div>

  <div v-if="isLoading" class="loading-container">
    <div class="spinner"></div>
    <div class="text">submitting a result</div>
  </div>

  <div class="radar-container">
    <canvas ref="radarCanvas" :width="width" :height="height"></canvas>
    <div class="counter">
      <p> Target : 
        <strong>
          {{ config.targetShape ? capitalizeFirstLetter(config.targetShape) : '.....' }}
        </strong>
      </p>
      <!-- <p> {{ config.targetShape ? capitalizeFirstLetter(config.targetShape) : '........' }} terdeteksi: {{ detectedObject }} </p>
      <p> Klik pengguna: {{ userClickCount }} </p> -->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isCanClick: false,
      isLoading: false,
      timer: {
        minutes: 0,
        second: 0
      },
      width: 600,
      height: 500,
      scannerAngle: 0,
      objects: [],
      detectedObject: 0,
      userClickCount: 0,
      responseTimes: [],
      suitableObjectTimes: [],
      responseDurations: [],
      radarInterval: null,
      objectInterval: null,
      countdownInterval: null,
      result: {
        totalObject: 0,
        correctedObject: 0,
        missedObject: 0,
        timeResponded: 0,
      },
      config: {
        direction: null, //clockwise, counter_clockwise
        duration: 0, //second
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
    this.initRadar();
    this.startRadar();
    this.startCountdown();
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeUnmount() {
    clearInterval(this.countdownInterval);
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    initConfig() {
      this.result = {
        totalObject: 0,
        correctedObject: 0,
        missedObject: 0,
        timeResponded: 0,
      };

      let config = JSON.parse(localStorage.getItem('scheduleData'));

      for (let i = 0; i < config.tests.length; i++) {
        if (config.tests[i].testUrl === 'radar-vigilance-test') {
          this.config.duration = config.tests[i].config.duration * 60;
          this.config.direction = config.tests[i].config.direction;
          this.config.shapeSize = config.tests[i].config.shapeSize;
          this.config.frequency = config.tests[i].config.frequency;
          this.config.shapes = this.checkShapeConfig(config.tests[i].config.shapes);
          this.config.targetShape = config.tests[i].config.targetShape;
          this.config.speed = config.tests[i].config.speed;

          // this.config.density = config.tests[i].density;
          this.config.density = 'medium'

          this.config.batteryTestConfigId = config.tests[i].config.id;
          this.config.moduleId = config.moduleId;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          break;
        }
      }
    },
    checkShapeConfig(shapes){
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
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    initRadar() {
      const canvas = this.$refs.radarCanvas;
      this.ctx = canvas.getContext("2d");

      this.isCanClick = true
    },
    startRadar() {
      this.radarInterval = setInterval(this.updateRadar, 100);
      this.objectInterval = setInterval(this.addShape, this.setFrequency());
    },
    drawRadar() {
      const ctx = this.ctx;
      const radius = Math.min(this.width, this.height) / 2;
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
      this.clearRadar();
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
    clearRadar() {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.width, this.height);
    },
    stopRadar() {
      clearInterval(this.radarInterval);
      this.radarInterval = null;

      clearInterval(this.objectInterval);
      this.objectInterval = null;

      this.isCanClick = false;
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
          this.calculatedResult();
        }
      }, 1000);
    },
    calculatedResult() {
      this.result.totalObject = this.detectedObject;

      // Handle user deliberate click
      if (this.userClickCount > this.detectedObject) {
        this.result.correctedObject = 0;
        this.result.missedObject = 100;
        this.result.timeResponded = 0;
      } else {
        const correctedObject = (this.userClickCount / this.detectedObject) * 100;
        this.result.correctedObject = correctedObject.toFixed(2);

        const missedObject = (this.detectedObject - this.userClickCount) / this.detectedObject * 100
        this.result.missedObject = missedObject.toFixed(2);

        if (this.userClickCount > 0) {
          const resultTimeResonded = this.averageResponseTime()
          this.result.timeResponded = resultTimeResonded.toFixed(2);
        } else {
          this.result.timeResponded = 0;
        }
      }

      console.log(this.result, 'lalala')

      // this.submitResult()
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
        this.$router.push('/module');
      }
    }
  },
  computed: {
    minutes() {
      return Math.floor(this.config.duration / 60).toString().padStart(2, '0');
    },
    seconds() {
      return (this.config.duration % 60).toString().padStart(2, '0');
    }
  },
};
</script>

<style scoped>
.radar-container {
  display: flex;
  align-items: center;
}
canvas {
  display: block;
  margin: 0 auto;
  background-color: black;
}
.counter {
  margin-left: 20px;
  color: black;
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
