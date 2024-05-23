<template>
  <div class="flight-controls">
    <div class="left-scale-container">
      <div class="scale" id="altitude">
        <div class="label">ALTITUDE</div>
        <div class="current" :style="{ bottom: `${altitude}%` }"></div>
        <div class="target" :style="{ bottom: `${targetAltitude}%` }">
          <div class="arrow"></div>
        </div>
        <div class="scale-indicators">
          <div v-for="n in 10" :key="n" :class="indicatorClass(n)">{{ n * 1000 }}</div>
        </div>
      </div>
    </div>
    <div class="bottom-scale-container">
      <div class="scale horizontal" id="heading">
        <div class="label">HEADING</div>
        <div class="current" :style="{ left: `${heading}%` }"></div>
        <div class="target" :style="{ left: `${targetHeading}%` }">
          <div class="arrow"></div>
        </div>
        <div class="scale-indicators horizontal">
          <div v-for="n in 36" :key="n" :class="indicatorClass(n, 'horizontal')">{{ n * 10 }}</div>
        </div>
      </div>
    </div>
    <div class="right-scale-container">
      <div class="scale" id="speed">
        <div class="label">SPEED</div>
        <div class="current" :style="{ bottom: `${speed}%` }"></div>
        <div class="target" :style="{ bottom: `${targetSpeed}%` }">
          <div class="arrow"></div>
        </div>
        <div class="scale-indicators">
          <div v-for="n in 10" :key="n" :class="indicatorClass(n)">{{ n * 20 + 120 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PDFTracking',
  data() {
    return {
      altitude: 50,
      speed: 50,
      heading: 50,
      targetAltitude: 70,
      targetSpeed: 70,
      targetHeading: 70
    };
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  methods: {
    handleKeyPress(event) {
      switch (event.key) {
        case 'a':
        case 'A':
          this.heading = Math.max(0, this.heading - 1);
          break;
        case 'd':
        case 'D':
          this.heading = Math.min(100, this.heading + 1);
          break;
        case 'w':
        case 'W':
          this.altitude = Math.min(100, this.altitude + 1);
          break;
        case 's':
        case 'S':
          this.altitude = Math.max(0, this.altitude - 1);
          break;
        case 'ArrowUp':
          this.speed = Math.min(100, this.speed + 1);
          break;
        case 'ArrowDown':
          this.speed = Math.max(0, this.speed - 1);
          break;
      }
    },
    indicatorClass(value, orientation) {
      let percentage = value / 10;
      if (orientation === 'horizontal') {
        percentage = value / 36;
      }
      if (percentage <= 0.5) return 'green';
      if (percentage <= 0.7) return 'yellow';
      if (percentage <= 0.9) return 'orange';
      return 'red';
    }
  }
};
</script>

<style scoped>
.flight-controls {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100vh;
  position: relative;
  padding: 0 20px; /* Added padding to ensure full-width appearance */
  box-sizing: border-box;
}
.left-scale-container, .right-scale-container {
  width: 100px;
  height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bottom-scale-container {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  width: calc(100% - 40px); /* Adjust width to account for padding */
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.scale {
  position: relative;
  width: 50px;
  height: 100%;
  background-color: lightgrey;
  border: 1px solid black;
}
.horizontal.scale {
  width: 100%;
  height: 50px;
}
.label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
}
.current, .target {
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: blue;
}
.horizontal .current, .horizontal .target {
  height: 100%;
  width: 2px;
  background-color: blue;
}
.target {
  height: 10px;
  background-color: transparent;
}
.horizontal .target {
  width: 10px;
  height: 100%;
  background-color: transparent;
}
.target .arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 10px solid green;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.horizontal .target .arrow {
  border-bottom: 0;
  border-left: 10px solid green;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
.scale-indicators {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.horizontal .scale-indicators {
  flex-direction: row;
}
.scale-indicators div {
  width: 100%;
  text-align: center;
  font-size: 10px;
}
.scale-indicators div.red {
  color: red;
}
.scale-indicators div.orange {
  color: orange;
}
.scale-indicators div.yellow {
  color: yellow;
}
.scale-indicators div.green {
  color: green;
}
.full-width {
  width: calc(100% - 200px);
}
</style>
