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
      };
    },
    props: {
      speed: String,
    },
    mounted() {
      setInterval(this.randomLight, this.getInterval());
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
      randomLight() {
        this.lights.forEach(light => (light.color = 'off'));
        const index = Math.floor(Math.random() * this.lights.length);
        const color = Math.random() > 0.5 ? 'red' : 'yellow';
        this.lights[index].color = color;
        this.result.questionTimes.push(new Date);
        this.result.colors.push(color);

        const indexCheck = this.result.questionTimes.length - 1;
        if (
          indexCheck > 0 &&
          typeof this.result.answerTimes[indexCheck] !== 'undefined'
        ) {
          // Check if light is red and user not push R,S,T,U
          if (this.result.colors[indexCheck] === 'red') {
            this.result.missed++;
          }
          this.result.answerTimes.push(null);
        }
      },
      turnOffLight(index) {
        this.result.answerTimes.push(new Date);
        if (this.lights[index].color === 'red') {
          this.result.correct++;
        } else {
          this.result.wrong++;
        }
        this.lights[index].color = 'off';
        console.log(JSON.stringify(this.result));
      },
      handleKeyPress(event) {
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
