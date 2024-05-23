<template>
    <div class="lights">
      <div v-for="(light, index) in lights" :key="index" :class="['light', light.color]" @click="turnOffLight(index)">
        {{ light.label }}
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'WarningLights',
    data() {
      return {
        lights: [
          { label: 'R', color: 'off' },
          { label: 'S', color: 'off' },
          { label: 'T', color: 'off' },
          { label: 'U', color: 'off' }
        ]
      };
    },
    mounted() {
      setInterval(this.randomLight, 2000);
      window.addEventListener('keydown', this.handleKeyPress);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.handleKeyPress);
    },
    methods: {
      randomLight() {
        this.lights.forEach(light => (light.color = 'off'));
        const index = Math.floor(Math.random() * this.lights.length);
        const color = Math.random() > 0.5 ? 'red' : 'yellow';
        this.lights[index].color = color;
      },
      turnOffLight(index) {
        if (this.lights[index].color === 'red') {
          this.lights[index].color = 'off';
        }
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
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: gray;
    color: white;
    font-weight: bold;
  }
  .light.red {
    background-color: red;
  }
  .light.yellow {
    background-color: yellow;
  }
  </style>
  