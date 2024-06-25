<template>
  <div class="radar-container">
    <canvas ref="radarCanvas" :width="width" :height="height"></canvas>
    <div class="counter">
      <p>
        {{ capitalizeFirstLetter(config.suitableObject) }} 
        terdeteksi: {{ detectedObject }}</p>
      <p>Klik pengguna: {{ userClickCount }}</p>
      <p>Waktu tersisa: {{ config.countdown }} detik</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      width: 600,
      height: 500,
      scannerAngle: 0,
      objects: [],
      circleCount: 0,
      detectedObject: 0,
      userClickCount: 0,
      radarInterval: null,
      objectInterval: null,
      countdownInterval: null,
      config: {
        result: null,
        countdown: 60,
        isClockwise: true,
        rotationSpeed: 0.05, // from 0.01 to 0.1
        objectSpawnInterval: 500,
        sizeObject: 'normal', //'very_small', 'small', 'normal', 'big', 'very_big'
        suitableObject: 'triangle', //'circle', 'square', 'triangle'
        objectShowed: ['circle', 'square', 'triangle'], //'circle', 'square', 'triangle'
        maxObjectsInScanner: 'normal' //'very_easy', 'easy', 'normal', 'hard', 'very_hard'
      }
    };
  },
  mounted() {
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
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        if (this.config.countdown > 0) {
          this.config.countdown--;
        } else {
          clearInterval(this.countdownInterval);
          this.stopRadar();

          this.result = `'Object Showed : ${this.detectedObject} and user clicked ${this.userClickCount}'`
          console.log(this.result, 'result')
        }
      }, 1000);
    },
    stopRadar() {
      clearInterval(this.radarInterval);
      this.radarInterval = null
      clearInterval(this.objectInterval);
      this.objectInterval = null
    },
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    initRadar() {
      const canvas = this.$refs.radarCanvas;
      this.ctx = canvas.getContext("2d");
    },
    startRadar() {
      this.radarInterval = setInterval(this.updateRadar, 100);
      this.objectInterval = setInterval(this.addObject, this.config.objectSpawnInterval);
    },
    updateRadar() {
      this.clearRadar();
      this.drawRadar();

      if (this.config.isClockwise) {
        this.scannerAngle += this.config.rotationSpeed;
      } else {
        this.scannerAngle -= this.config.rotationSpeed;
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
          if (objectsInScanner >= this.setMaxObjectsInScanner) {
            break;
          }

          ctx.beginPath();

          // Set Size Objcet
          if (obj.type === "circle" || obj.type === "square") {
            ctx.arc(obj.x, obj.y, this.sizeObject(), 0, 2 * Math.PI);
          } 
          
          else if (obj.type === "triangle") {
            this.drawTriangle(ctx, obj.x, obj.y, this.sizeObject('triangle'));
          }

          //Set Opacity Object
          ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';

          if (obj.type === "circle") {
            ctx.fill();
            
            //Check Detected Object
            if (!obj.detected) {
              obj.detected = true;              
              this.detectSuitableObject("circle")
            }
            obj.sweepCount = 0;
          } else if (obj.type === "square") {
            ctx.fillRect(obj.x - 5, obj.y - 5, this.sizeObject('square'), this.sizeObject('square'));
            
            //Check Detected Object
            if (!obj.detected) {
              obj.detected = true;
              this.detectSuitableObject("square")
            }

            obj.sweepCount = 0;
          } else if (obj.type === "triangle") {
            ctx.fill();

            //Check Detected Object
            if (!obj.detected) {
              obj.detected = true;
              this.detectSuitableObject("triangle")
            }
            obj.sweepCount = 0;
          }

          objectsInScanner++;
        } else {
          obj.sweepCount++;
        }
      }
    },
    setMaxObjectsInScanner() {
      if (this.config.maxObjectsInScanner) {
        if (this.config.maxObjectsInScanner === 'very_easy') {
          return 3;
        }
        else if (this.config.maxObjectsInScanner === 'easy') {
          return 4;
        }
        else if (this.config.maxObjectsInScanner === 'normal') {
          return 5;
        }
        else if (this.config.maxObjectsInScanner === 'hard') {
          return 7;
        }
        else if (this.config.maxObjectsInScanner === 'very_hard') {
          return 10;
        }
      }

      return 5;
    },
    detectSuitableObject(type) {
      if (this.config.suitableObject === type) {
        this.detectedObject++;
        console.log(`Detected object count increased: ${this.detectedObject}`);
      }
    },
    sizeObject(type = null) {
      if (this.config.sizeObject) {
        if (type === "triangle") {
          if (this.config.sizeObject === 'very_small') {
            return 6;
          }
          else if (this.config.sizeObject === 'small') {
            return 8;
          }
          else if (this.config.sizeObject === 'normal') {
            return 12;
          }
          else if (this.config.sizeObject === 'big') {
            return 16;
          }
          else if (this.config.sizeObject === 'very_big') {
            return 20;
          }
        }

        if (type === "square") {
          if (this.config.sizeObject === 'very_small') {
            return 6;
          }
          else if (this.config.sizeObject === 'small') {
            return 9;
          }
          else if (this.config.sizeObject === 'normal') {
            return 11;
          }
          else if (this.config.sizeObject === 'big') {
            return 14;
          }
          else if (this.config.sizeObject === 'very_big') {
            return 16;
          }
        }

        if (this.config.sizeObject === 'very_small') {
          return 3;
        }
        else if (this.config.sizeObject === 'small') {
          return 5;
        }
        else if (this.config.sizeObject === 'normal') {
          return 7;
        }
        else if (this.config.sizeObject === 'big') {
          return 9;
        }
        else if (this.config.sizeObject === 'very_big') {
          return 11;
        }
      }

      // Default Set 
      if (type === 'triangle') {
        return 18;
      } else if (type === 'square') {
        return 11;
      } else {
        return 8;
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
    addObject() {
      const radius = Math.min(this.width, this.height) / 2;
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const x = this.width / 2 + distance * Math.cos(angle);
      const y = this.height / 2 + distance * Math.sin(angle);
      
      //Set Object Showed
      const type = this.config.objectShowed[Math.floor(Math.random() * this.config.objectShowed.length)];

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
      if (event.code === "Space") {
        this.userClickCount++;
        console.log(`User clicks: ${this.userClickCount}`);
      }
    }
  }
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
</style>
