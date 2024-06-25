<template>
    <div class="lights">
      <div v-for="(light, index) in lights" :key="index" :class="['light', light.color]" @click="turnOffLight(index)">
        {{ light.label }}
      </div>
    </div>
  </template>

  <script>
  export default {
    name: 'AlertLights',
    data() {
      return {
        lights: [
          { label: 'R', color: 'off' },
          { label: 'S', color: 'off' },
          { label: 'T', color: 'off' },
          { label: 'U', color: 'off' }
        ],
        result: {
          correct: 0,
          wrong: 0,
          missed: 0,
          colors: [],
          answerTimes: [],
          questionTimes: [],
        },
        intervalId: null,
      };
    },
    props: {
      speed: String,
      isTimesUp: Boolean,
      frequency: String,
    },
    mounted() {
      this.intervalId = setInterval(this.randomLight, this.getInterval());
      window.addEventListener('keydown', this.handleKeyPress);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.handleKeyPress);
    },
    methods: {
      getInterval() {
        // Adjust ranges based on difficulty level
        switch (this.speed) {
          case 'very_slow':
            return 5000;
          case 'slow':
            return 4000;
          case 'medium':
            return 3000;
          case 'fast':
            return 2000;
          case 'very_fast':
            return 1000;
          default:
            return 3000;
        }
      },
      getFrequency() {
        // Adjust ranges based on difficulty level
        switch (this.frequency) {
          case 'very_rarely':
            return 0.9;
          case 'rarely':
            return 0.7;
          case 'medium':
            return 0.5;
          case 'often':
            return 0.3;
          case 'very_often':
            return 0.1;
          default:
            return 0.5;
        }
      },
      randomLight() {
        if (this.isTimesUp) {
          this.checkMissed(true);
          console.log(JSON.stringify(this.result));
          clearInterval(this.intervalId);
          return;
        }

        this.lights.forEach(light => (light.color = 'off'));
        const index = Math.floor(Math.random() * this.lights.length);
        const frequency = this.getFrequency();
        const color = Math.random() > frequency ? 'red' : 'yellow';
        this.lights[index].color = color;
        this.result.questionTimes.push(new Date);
        this.result.colors.push(color);
        this.checkMissed();
      },
      checkMissed(isLast = false) {
        let indexCheck;
        if (isLast) {
          indexCheck = this.result.questionTimes.length - 1;
        } else {
          indexCheck = this.result.questionTimes.length - 2;
        }
        if (
          typeof this.result.answerTimes[indexCheck] === 'undefined'
        ) {
          // Check if light is red and user not push R,S,T,U
          if (this.result.colors[indexCheck] === 'red') {
            this.result.missed++;
          }
          this.result.answerTimes.push(null);
        }
      },
      turnOffLight(index) {
        this.lights[index].color = 'off';
        this.result.answerTimes.push(new Date);
        if (this.lights[index].color === 'red') {
          this.result.correct++;
        } else {
          this.result.wrong++;
        }
      },
      handleKeyPress(event) {
        if (event.key !== 'r' && event.key !== 's' && event.key !== 't' && event.key !== 'u') {
          return;
        }
        const keyMap = { KeyR: 0, KeyS: 1, KeyT: 2, KeyU: 3 };
        if (keyMap[event.code] !== undefined) {
          this.turnOffLight(keyMap[event.code]);
        }
      }
    }
  };
  </script>

  <style scoped>
  .lights {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .light {
    width: 75px;
    height: 75px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: gray;
    color: #000000;
    font-weight: bold;
  }
  .light.red {
    background-color: red;
  }
  .light.yellow {
    background-color: yellow;
  }
  </style>
