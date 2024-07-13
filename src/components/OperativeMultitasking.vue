<template>
  <div class="simulation-container">
    <canvas ref="canvas" width="1000" height="600"></canvas>
    <div class="recorded-data">
      <p>Response Times: {{ responseTimes.join(', ') }}</p>
      <p>Correct Answers: {{ correctAnswers }}</p>
      <p>Incorrect Answers: {{ incorrectAnswers }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeKey: null,
      question: '36 + 38 = ?',
      userAnswer: '',
      correctAnswers: 0,
      incorrectAnswers: 0,
      responseTimes: [],
      startTime: 0,
      isActive: false,
      aimWasd: { x: 100, y: 450 },
      aimArrow: { x: 700, y: 450 },
      targetWasd: { x: 100, y: 450 },
      targetArrow: { x: 700, y: 450 },
    };
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
          this.responseTimes.push(performance.now() - this.startTime);
          this.activeKey = null;
        } else {
          this.incorrectAnswers++;
        }
        this.isActive = false;
        this.draw();
      }
    },
    checkAnswer() {
      const correctAnswer = 36 + 38;
      if (parseInt(this.userAnswer) === correctAnswer) {
        this.correctAnswers++;
      } else {
        this.incorrectAnswers++;
      }
      this.userAnswer = '';
      this.generateNewQuestion();
      this.draw();
    },
    generateNewQuestion() {
      // Implement logic to generate a new arithmetic question
    },
    draw() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw segment outlines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;

      // Active Lights Segment
      ctx.strokeRect(5, 55, 200, 290);

      // Arithmetic Question Segment
      ctx.strokeRect(210, 5, 785, 140);

      // Aim WASD Segment
      ctx.strokeRect(5, 305, 200, 290);

      // Aim Arrow Segment
      ctx.strokeRect(210, 305, 785, 290);

      // Draw active lights
      const keys = ['F1', 'F2', 'F3', 'F4'];
      keys.forEach((key, index) => {
        ctx.fillStyle = this.activeKey === key ? 'red' : 'grey';
        ctx.fillRect(10, 10 + index * 70, 60, 60);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(key, 30, 50 + index * 70);
      });

      // Draw question box
      ctx.fillStyle = 'white';
      ctx.font = '30px Arial';
      ctx.fillText(this.question, 220, 60);
      ctx.strokeRect(220, 80, 300, 40);

      // Draw aim indicators and targets
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(this.targetWasd.x, this.targetWasd.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.aimWasd.x, this.aimWasd.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(this.targetArrow.x, this.targetArrow.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.aimArrow.x, this.aimArrow.y, 5, 0, Math.PI * 2);
      ctx.fill();
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
    startSimulation() {
      setInterval(this.generateRandomKey, 3000);
      this.draw();
    },
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('keydown', this.handleWasdKeyPress);
    window.addEventListener('keydown', this.handleArrowKeyPress);
    this.startSimulation();
  },
  beforeUnmount() {
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
canvas {
  border: 1px solid #333;
  background-color: #222;
}
.recorded-data {
  margin-top: 20px;
  color: white;
}
</style>
