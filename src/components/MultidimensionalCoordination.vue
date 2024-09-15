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
      },
      gamepadIndex: null
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
    handleGamepadInput(gamepad) {
      const [leftStickX, leftStickY] = gamepad.axes;
      console.log(leftStickX, leftStickY);
      let movement = 0.5;
      if (leftStickY < -0.5) {
        this.airplane.y += movement;
      } else if (leftStickY > 0.5) {
        this.airplane.y -= movement;
      }

      if (leftStickX < -0.5) {
        this.airplane.x -= movement;
      } else if (leftStickX > 0.5) {
        this.airplane.x += movement;
      }
    },
    onGamepadConnected(event) {
      console.log('connected', event)
      if (event.gamepad.id !== 'T.16000M (Vendor: 044f Product: b10a)') {
        return;
      }
      this.gamepadIndex = event.gamepad.index;
      this.checkGamepad();
    },
    onGamepadDisconnected(event) {
      console.log('disconnected', event)
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
    // check gamepad
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();
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
  background-color: #87CEEB;
  /* Sky blue background */
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