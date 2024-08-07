<template>
  <div class="simulation-container">
    <div class="timer" v-if="timeRemaining > 0">{{ formattedTime }}</div>
    <div class="canvas-wrapper">
      <canvas ref="canvas" width="1000" height="600" @mousemove="handleMouseMove"></canvas>
      <div class="input-container">
        <input ref="input" v-model="userAnswer" @keyup.enter="checkAnswer" placeholder="Type your answer here" />
      </div>
    </div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>Simulation Results</h2>
        <p>Average Response Time: {{ averageResponseTime.toFixed(2) }} ms</p>
        <p>Mispresses: {{ mispresses }}</p>
        <p>Correct Presses: {{ correctPresses }}</p>
        <p>Correct Answers: {{ correctAnswers }}</p>
        <p>Incorrect Answers: {{ incorrectAnswers }}</p>
        <p>WASD Segment Aimed Time: {{ wasdAimedTime.toFixed(2) }} seconds</p>
        <p>Arrow Segment Aimed Time: {{ arrowAimedTime.toFixed(2) }} seconds</p>
        <button @click="closeModal">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeKey: null,
      question: '',
      userAnswer: '',
      correctAnswers: 0,
      incorrectAnswers: 0,
      responseTimes: [],
      mispresses: 0,
      correctPresses: 0,
      startTime: 0,
      isActive: false,
      aimWasd: { x: 100, y: 450 },
      aimArrow: { x: 700, y: 450 },
      targetWasd: { x: 100, y: 450 },
      targetArrow: { x: 700, y: 450 },
      currentAnswer: 0,
      targetSpeed: 1,
      wasdAimedTime: 0,
      arrowAimedTime: 0,
      wasdAimedStartTime: 0,
      arrowAimedStartTime: 0,
      wasdAimed: false,
      arrowAimed: false,
      duration: 0,
      timeRemaining: 0,
      showModal: false,
      config: {
        sessionId: '',
        userId: '',
        batteryTestConfigId: '',
      },
      gamepadIndex: null,
    };
  },
  computed: {
    averageResponseTime() {
      return this.responseTimes.length ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0;
    },
    formattedTime() {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
  },
  methods: {
    generateRandomKey() {
      const keys = ['F1', 'F2', 'F3', 'F4'];
      this.activeKey = keys[Math.floor(Math.random() * keys.length)];
      this.isActive = true;
      this.startTime = performance.now();
      this.draw();
    },
    handleKeyPress(event) {
      if (['F1', 'F2', 'F3', 'F4'].includes(event.key)) {
        if (event.key === this.activeKey) {
          this.correctPresses++;
          this.responseTimes.push(performance.now() - this.startTime);
          this.activeKey = null;
        } else {
          this.mispresses++;
        }
        this.isActive = false;
      }
      this.draw();
    },
    checkAnswer() {
      if (parseInt(this.userAnswer) === this.currentAnswer) {
        this.correctAnswers++;
      } else {
        this.incorrectAnswers++;
      }
      this.userAnswer = '';
      this.generateNewQuestion();
      this.draw();
    },
    generateNewQuestion() {
      const num1 = Math.floor(Math.random() * 100);
      const num2 = Math.floor(Math.random() * 100);
      this.question = `${num1} + ${num2} = ?`;
      this.currentAnswer = num1 + num2;
    },
    draw() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas background color
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw segment outlines and background
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'grey';

      // Active Lights Segment (Square)
      ctx.fillRect(5, 5, 200, 200);
      ctx.strokeRect(5, 5, 200, 200);

      // Arithmetic Question Segment (aligned with Active Lights Segment)
      ctx.fillRect(210, 5, 785, 200);
      ctx.strokeRect(210, 5, 785, 200);

      // Aim WASD Segment
      ctx.fillRect(5, 210, 200, 385);
      ctx.strokeRect(5, 210, 200, 385);

      // Aim Arrow Segment
      ctx.fillRect(210, 210, 785, 385);
      ctx.strokeRect(210, 210, 785, 385);

      // Draw active lights
      const keys = ['F1', 'F2', 'F3', 'F4'];
      keys.forEach((key, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        ctx.fillStyle = this.activeKey === key ? 'red' : 'grey';
        ctx.fillRect(10 + col * 100, 10 + row * 100, 80, 80);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(key, 35 + col * 100, 55 + row * 100);
      });

      // Draw question box and align input field
      ctx.fillStyle = 'white';
      ctx.font = '30px Arial';
      ctx.fillText(this.question, 320, 90); // Center the question text vertically
      ctx.strokeRect(320, 110, 300, 40);

      const inputElement = this.$refs.input;
      if (inputElement) {
        inputElement.style.top = '150px'; // Adjust top position to align with question box
        inputElement.style.left = '530px'; // Adjust left position to align with question box
      }

      // Draw aim indicators and targets
      // WASD Segment
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.targetWasd.x - 10, this.targetWasd.y - 10);
      ctx.lineTo(this.targetWasd.x + 10, this.targetWasd.y + 10);
      ctx.moveTo(this.targetWasd.x + 10, this.targetWasd.y - 10);
      ctx.lineTo(this.targetWasd.x - 10, this.targetWasd.y + 10);
      ctx.stroke();
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.aimWasd.x, this.aimWasd.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.aimWasd.x - 10, this.aimWasd.y);
      ctx.lineTo(this.aimWasd.x + 10, this.aimWasd.y);
      ctx.moveTo(this.aimWasd.x, this.aimWasd.y - 10);
      ctx.lineTo(this.aimWasd.x, this.aimWasd.y + 10);
      ctx.stroke();

      // Arrow Segment
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.targetArrow.x - 10, this.targetArrow.y - 10);
      ctx.lineTo(this.targetArrow.x + 10, this.targetArrow.y + 10);
      ctx.moveTo(this.targetArrow.x + 10, this.targetArrow.y - 10);
      ctx.lineTo(this.targetArrow.x - 10, this.targetArrow.y + 10);
      ctx.stroke();
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.aimArrow.x, this.aimArrow.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.aimArrow.x - 10, this.aimArrow.y);
      ctx.lineTo(this.aimArrow.x + 10, this.aimArrow.y);
      ctx.moveTo(this.aimArrow.x, this.aimArrow.y - 10);
      ctx.lineTo(this.aimArrow.x, this.aimArrow.y + 10);
      ctx.stroke();

      // Check if scopes are aimed at targets
      this.checkAimedAtTarget();
    },
    updateAim(aim, key) {
      if (key === 'W') aim.y -= 5;
      if (key === 'S') aim.y += 5;
      if (key === 'A') aim.x -= 5;
      if (key === 'D') aim.x += 5;
      if (key === 'ArrowUp') aim.y -= 5;
      if (key === 'ArrowDown') aim.y += 5;
      if (key === 'ArrowLeft') aim.x -= 5;
      if (key === 'ArrowRight') aim.x += 5;
    },
    handleWasdKeyPress(event) {
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        this.updateAim(this.aimWasd, event.key.toUpperCase());
        this.draw();
      }
    },
    handleArrowKeyPress(event) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.updateAim(this.aimArrow, event.key);
        this.draw();
      }
    },
    handleMouseMove(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      this.aimArrow.x = event.clientX - rect.left;
      this.aimArrow.y = event.clientY - rect.top;
      this.draw();
    },
    moveTargets() {
      this.targetWasd.x += (Math.random() - 0.5) * this.targetSpeed * 2;
      this.targetWasd.y += (Math.random() - 0.5) * this.targetSpeed * 2;
      this.targetArrow.x += (Math.random() - 0.5) * this.targetSpeed * 2;
      this.targetArrow.y += (Math.random() - 0.5) * this.targetSpeed * 2;
      // Keep targets within bounds
      this.targetWasd.x = Math.max(15, Math.min(190, this.targetWasd.x));
      this.targetWasd.y = Math.max(220, Math.min(580, this.targetWasd.y));
      this.targetArrow.x = Math.max(220, Math.min(970, this.targetArrow.x));
      this.targetArrow.y = Math.max(220, Math.min(580, this.targetArrow.y));
      this.draw();
    },
    checkAimedAtTarget() {
      const wasdDistance = Math.sqrt(Math.pow(this.aimWasd.x - this.targetWasd.x, 2) + Math.pow(this.aimWasd.y - this.targetWasd.y, 2));
      const arrowDistance = Math.sqrt(Math.pow(this.aimArrow.x - this.targetArrow.x, 2) + Math.pow(this.aimArrow.y - this.targetArrow.y, 2));

      if (wasdDistance < 15) {
        if (!this.wasdAimed) {
          this.wasdAimed = true;
          this.wasdAimedStartTime = performance.now();
        }
      } else {
        if (this.wasdAimed) {
          this.wasdAimed = false;
          this.wasdAimedTime += (performance.now() - this.wasdAimedStartTime) / 1000;
        }
      }

      if (arrowDistance < 15) {
        if (!this.arrowAimed) {
          this.arrowAimed = true;
          this.arrowAimedStartTime = performance.now();
        }
      } else {
        if (this.arrowAimed) {
          this.arrowAimed = false;
          this.arrowAimedTime += (performance.now() - this.arrowAimedStartTime) / 1000;
        }
      }

      if (this.wasdAimed) {
        this.wasdAimedTime += (performance.now() - this.wasdAimedStartTime) / 1000;
        this.wasdAimedStartTime = performance.now();
      }

      if (this.arrowAimed) {
        this.arrowAimedTime += (performance.now() - this.arrowAimedStartTime) / 1000;
        this.arrowAimedStartTime = performance.now();
      }
    },
    startSimulation() {
      this.generateNewQuestion();
      this.randomKeyInterval = setInterval(this.generateRandomKey, 3000);
      this.moveTargetsInterval = setInterval(this.moveTargets, 50);
      this.drawInterval = setInterval(this.draw, 50);
      this.startTimer();
    },
    startTimer() {
      this.timeRemaining = this.duration;
      this.timerInterval = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
        } else {
          clearInterval(this.timerInterval);
          this.endSimulation();
        }
      }, 1000);
    },
    async endSimulation() {
      clearInterval(this.randomKeyInterval);
      clearInterval(this.moveTargetsInterval);
      clearInterval(this.drawInterval);

      const result = {
        averageResponseTime: this.averageResponseTime.toFixed(2),
        alertLights: {
          wrongResponse: this.mispresses,
          correctResponse: this.correctPresses,
        },
        arithmetics: {
          totalQuestions: this.correctAnswers + this.incorrectAnswers,
          correctAnswers: this.correctAnswers,
          incorrectAnswers: this.incorrectAnswers,
        },
        primary: {
          leftAim: this.wasdAimedTime.toFixed(2),
          rightAim: this.arrowAimedTime.toFixed(2),
        }
      }

      console.log(this.config)
      console.log(result)
      // const API_URL = process.env.VUE_APP_API_URL;
      // const payload = {
      //   testSessionId: this.config.sessionId,
      //   userId: this.config.userId,
      //   batteryTestConfigId: this.config.batteryTestConfigId,
      //   result: result,
      // }

      // const res = await fetch(`${API_URL}api/submission`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify(payload)
      //   }
      // )

      // if (!res.ok) {
      //   throw new Error('Failed Submit Test');
      // }

      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      // Add any additional logic for closing the modal
    },
    handleGamepadInput(gamepad) {
      const [leftStickX, leftStickY] = gamepad.axes;
      console.log(leftStickX, leftStickY);
      let movement = 0.5;
      if (leftStickY < -0.5) {
        this.aimWasd.y -= movement;
        this.draw();
      } else if (leftStickY > 0.5) {
        this.aimWasd.y += movement;
        this.draw();
      }

      if (leftStickX < -0.5) {
        this.aimWasd.x -= movement;
        this.draw();
      } else if (leftStickX > 0.5) {
        this.aimWasd.x += movement;
        this.draw();
      }
    },
    onGamepadConnected(event) {
      this.gamepadIndex = event.gamepad.index;
      this.checkGamepad();
    },
    onGamepadDisconnected(event) {
      if (this.gamepadIndex === event.gamepad.index) {
        this.gamepadIndex = null;
      }
    },
    checkGamepad() {
      if (this.gamepadIndex !== null) {
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (gamepad) {
          this.handleGamepadInput(gamepad);
        }
      }
      requestAnimationFrame(this.checkGamepad);
    },
  },
  mounted() {
    // check gamepad
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();

    window.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('keydown', this.handleWasdKeyPress);
    window.addEventListener('keydown', this.handleArrowKeyPress);
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
    const tests = scheduleData.tests;
    const config = tests?.find((test) => {
      return test.name === 'Test For Operative Multitasking';
    });
    this.config = scheduleData;
    this.config.batteryTestConfigId = config?.config?.id;
    this.targetSpeed = config?.config?.speed;
    this.duration = config?.config?.duration * 60;

    console.log(this.config, 'config', this.targetSpeed, 'speed', this.duration, 'duration');
    this.startSimulation();
  },
  beforeUnmount() {
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();

    window.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener('keydown', this.handleWasdKeyPress);
    window.removeEventListener('keydown', this.handleArrowKeyPress);
  },
};
</script>

<style scoped>
.simulation-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.timer {
  position: absolute;
  top: 0;
  background-color: blue;
  color: white;
  padding: 10px;
  font-size: 24px;
  text-align: center;
  width: 10%;
}

.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 1000px;
  height: 600px;
}

canvas {
  border: 1px solid #333;
}

.recorded-data {
  margin-top: 20px;
  color: black;
  text-align: center;
}

.input-container {
  position: absolute;
  top: 150px;
  left: 530px;
}

input {
  width: 300px;
  height: 40px;
  font-size: 20px;
  text-align: center;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
}
</style>
