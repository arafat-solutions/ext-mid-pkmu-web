<template>
    <div class="game-container">
      <div class="lights-container">
        <div
          v-for="(light, index) in lights"
          :key="index"
          :class="['light', { active: light }]"
        >
          {{ index + 1 }}
        </div>
      </div>
  
      <div class="question-container">
        <div class="question">{{ question }}</div>
        <input v-model="userAnswer" @keydown.enter="checkAnswer" class="answer-input" />
      </div>
  
      <div class="aim-container">
        <div class="target" :style="{ top: target1.y + 'px', left: target1.x + 'px' }"></div>
        <div class="aim" :style="{ top: aim1.y + 'px', left: aim1.x + 'px' }"></div>
      </div>
  
      <div class="aim-container large" @mousemove="handleMouseMoveInContainer">
        <div class="target" :style="{ top: target2.y + 'px', left: target2.x + 'px' }"></div>
        <div class="aim" :style="{ top: aim2.y + 'px', left: aim2.x + 'px' }"></div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'GamePage',
    data() {
      return {
        lights: [false, false, false, false],
        lightKeys: ['1', '2', '3', '4'],
        lightTimers: [null, null, null, null],
        target1: { x: 50, y: 100 },
        aim1: { x: 50, y: 50 },
        target2: { x: 150, y: 150 },
        aim2: { x: 150, y: 150 },
        question: '',
        answer: '',
        userAnswer: '',
        rotationInterval: 5000, // 5 seconds
        lightInterval: 2000, // 2 seconds interval before the next light
      };
    },
    methods: {
      randomLight() {
        const index = Math.floor(Math.random() * 4);
        this.lights[index] = true;
        this.lightTimers[index] = Date.now();
      },
      handleLightKeyPress(event) {
        const key = event.key.toLowerCase();
        const index = this.lightKeys.indexOf(key);
        if (index > -1 && this.lights[index]) {
          this.lights[index] = false;
          const reactionTime = Date.now() - this.lightTimers[index];
          console.log(`Reaction time for ${index + 1}: ${reactionTime}ms`);
          setTimeout(this.randomLight, this.lightInterval); // Interval before the next light
        }
      },
      moveTarget1() {
        const stepSize = 2; // Adjust step size for slower movement
        this.target1.x += Math.random() * stepSize - stepSize / 2;
        this.target1.y += Math.random() * stepSize - stepSize / 2;
  
        // Ensure the target stays within bounds
        const container = { x: 0, y: 0, w: 150, h: 300 };
        if (this.target1.x < container.x) this.target1.x = container.x;
        if (this.target1.x > container.x + container.w) this.target1.x = container.x + container.w;
        if (this.target1.y < container.y) this.target1.y = container.y;
        if (this.target1.y > container.y + container.h) this.target1.y = container.y + container.h;
      },
      handleAim1KeyPress(event) {
        const step = 5;
        if (event.key === 'w') this.aim1.y -= step;
        if (event.key === 'a') this.aim1.x -= step;
        if (event.key === 's') this.aim1.y += step;
        if (event.key === 'd') this.aim1.x += step;
      },
      handleMouseMove(event) {
        this.aim2.x = event.clientX - event.target.getBoundingClientRect().left;
        this.aim2.y = event.clientY - event.target.getBoundingClientRect().top;
      },
      handleMouseMoveInContainer(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        this.aim2.x = event.clientX - rect.left;
        this.aim2.y = event.clientY - rect.top;
      },
      generateQuestion() {
        const num1 = Math.floor(Math.random() * 50);
        const num2 = Math.floor(Math.random() * 50);
        this.question = `${num1} + ${num2} = ?`;
        this.answer = (num1 + num2).toString();
      },
      checkAnswer() {
        if (this.userAnswer === this.answer) {
          console.log('Correct answer!');
          this.generateQuestion();
          this.userAnswer = '';
        } else {
          console.log('Incorrect answer.');
        }
      }
    },
    mounted() {
      this.generateQuestion();
      setTimeout(this.randomLight, this.lightInterval);
      window.addEventListener('keydown', this.handleLightKeyPress);
      window.addEventListener('keydown', this.handleAim1KeyPress);
      setInterval(() => {
        this.moveTarget1();
      }, 100); // Move target every 100ms for slower movement
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.handleLightKeyPress);
      window.removeEventListener('keydown', this.handleAim1KeyPress);
    }
  };
  </script>
  
  <style>
  .game-container {
    display: grid;
    grid-template-areas:
      "lights question"
      "aim1 aim2";
    gap: 20px;
    padding: 20px;
    background-color: black;
    color: white;
  }
  .lights-container {
    display: grid;
    grid-template-columns: repeat(2, 30px);
    grid-template-rows: repeat(2, 30px);
    gap: 10px;
    grid-area: lights;
  }
  .light {
    width: 30px;
    height: 30px;
    background-color: grey;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .light.active {
    background-color: red;
  }
  .question-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-area: question;
  }
  .answer-input {
    font-size: 24px;
    text-align: center;
    margin-top: 10px;
  }
  .aim-container {
    width: 150px;
    height: 300px;
    border: 1px solid white;
    position: relative;
    grid-area: aim1;
  }
  .aim-container.large {
    width: 400px;
    height: 300px;
    grid-area: aim2;
  }
  .target {
    width: 20px;
    height: 20px;
    background-color: red;
    border-radius: 50%;
    position: absolute;
  }
  .aim {
    width: 20px;
    height: 20px;
    border: 2px solid white;
    border-radius: 50%;
    position: absolute;
  }
  </style>
  