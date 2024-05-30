<template>
    <div class="simulator-container">
      <div class="landing-strip"></div>
      <img src="@/assets/airplane-icon.png" alt="Airplane" :style="airplaneStyle" class="airplane" />
    </div>
  </template>
  
  <script>
  export default {
    name: 'FlightSimulator',
    data() {
      return {
        airplane: {
          x: 100,
          y: 150,
          angle: 0,
          roll: 0
        }
      };
    },
    computed: {
      airplaneStyle() {
        return {
          transform: `translate(${this.airplane.x}px, ${this.airplane.y}px) rotate(${this.airplane.angle}deg) rotateX(${this.airplane.roll}deg)`,
        };
      }
    },
    methods: {
      handleKeydown(event) {
        switch (event.key) {
          case 'a':
          case 'A':
            this.airplane.angle -= 5;
            break;
          case 'd':
          case 'D':
            this.airplane.angle += 5;
            break;
          case 'w':
          case 'W':
            this.airplane.y -= 5;
            break;
          case 's':
          case 'S':
            this.airplane.y += 5;
            break;
          case 'ArrowLeft':
            this.airplane.x -= 5;
            break;
          case 'ArrowRight':
            this.airplane.x += 5;
            break;
          default:
            break;
        }
      }
    },
    mounted() {
      window.addEventListener('keydown', this.handleKeydown);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.handleKeydown);
    }
  };
  </script>
  
  <style>
  .simulator-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 70vh;
    width: 70vw;
    background-color: #87CEEB; /* Sky blue background */
    position: relative;
    overflow: hidden;
    border: 2px solid black;
    margin: auto;
  }
  
  .landing-strip {
    position: absolute;
    bottom: 20px;
    width: 30px;
    height: 30px;
    background-color: yellow;
    border-radius: 50%;
  }
  
  .airplane {
    position: absolute;
    width: 60px;
    height: 60px;
    transition: transform 0.1s;
  }
  </style>
  