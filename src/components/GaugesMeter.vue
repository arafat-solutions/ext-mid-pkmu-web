<template>
  <div class="gauges">
    <div v-for="(gauge, index) in gauges" :key="index" class="gauge-container">
      <div class="gauge">
        <div class="letter">{{ gauge.label }}</div>
        <div class="needle" :style="{ transform: `rotate(${gauge.angle}deg)` }"></div>
        <div class="background"></div>
        <div class="numbers">
          <span v-for="n in 9" :key="n">{{ n }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GaugesMeter',
  data() {
    return {
      gauges: [
        { label: 'W', angle: -45 },
        { label: 'V', angle: -45 },
        { label: 'X', angle: -45 },
        { label: 'Y', angle: -45 },
        { label: 'Z', angle: -45 },
        { label: 'A', angle: -45 }
      ]
    };
  },
  mounted() {
    setInterval(this.randomGaugeMovement, 1000);
    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  methods: {
    randomGaugeMovement() {
      this.gauges.forEach(gauge => {
        if (gauge.angle < 45) {
          gauge.angle += Math.random() * 5;
        }
      });
    },
    handleKeyPress(event) {
      const keyMap = { KeyW: 0, KeyV: 1, KeyX: 2, KeyY: 3, KeyZ: 4, KeyA: 5 };
      if (keyMap[event.code] !== undefined) {
        const gauge = this.gauges[keyMap[event.code]];
        if (gauge.angle > -45) {
          gauge.angle -= 10;
        }
      }
    }
  }
};
</script>

<style scoped>
.gauges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.gauge-container {
  position: relative;
  width: 80px;
  height: 80px;
}
.gauge {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: grey;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.letter {
  position: absolute;
  top: 10px;
  font-size: 14px;
  color: black;
}
.needle {
  width: 2px;
  height: 35%;
  background-color: black;
  transform-origin: bottom center;
  transition: transform 0.5s;
}
.background {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: 50%;
  background-image: linear-gradient(to right, white 0 55%, yellow 55% 75%, red 75% 100%);
  clip-path: polygon(50% 50%, 100% 0, 100% 100%);
}
.numbers {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px;
  box-sizing: border-box;
}
.numbers span {
  font-size: 10px;
  color: black;
}
</style>
