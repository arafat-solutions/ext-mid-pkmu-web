<template>
  <div>
    <Airspeed id="airspeed" class="indicator-bg" :size="200" :airspeed="airspeed" />
    <button id="button-plus" class="btn-plus-minus">+</button>
    <div id="airspeed-indicator"></div>
    <button id="button-minus" class="btn-plus-minus">-</button>
  </div>
</template>

<script>
import {Airspeed} from  'vue-flight-indicators';

export default {
  components: {
    Airspeed,
  },
  props: {
    isTimesUp: Boolean,
    isPause: Boolean,
    isActive: Boolean,
    speed: Number, // 0-100
  },
  created() {
    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  mounted() {
    if (this.isActive) {
      this.executeAirspeedMovement();
    }
  },
  watch: {
    isTimesUp(newValue) {
      if (newValue) {
        this.checkRedDuration();
        window.removeEventListener('keydown', this.handleKeyPress);
        console.log('airspeed', this.redDuration);
      }
    },
  },
  computed: {
    changeValue() {
      // Map speed (0-100) to (1-30)
      let value = (this.speed / 100) * 29 + 1;

      // Ensure the value is a whole number (optional)
      value = Math.round(value);

      return value;
    },
  },
  data: function () {
    return {
      airspeed: 0,
      intervalMovement: 5000,
      signRandoms: ['+', '-'],
      redStartTime: null,
      redDuration: 0,
      limitRedAirSpeed: 140,
    }
  },
  methods: {
    handleKeyPress(event) {
      if (this.isPause || this.isTimesUp || !this.isActive === 'inactive') {
        return;
      }

      if ((event.key === 'q' || event.key === 'Shift') && this.airspeed <= 160) {
        this.airspeed++;
        this.checkRedDuration();
      } else if (event.key === 'a' || event.key === 'Ctrl' && this.airspeed >= 1) {
        this.airspeed--;
        this.checkRedDuration();
      }
    },
    async executeAirspeedMovement() {
      if (this.isPause || this.isTimesUp) {
        return;
      }

      const sign = this.getRandomOperator();
      for(let i=1;i<=this.changeValue;i++) {
        if (sign === '+' || this.airspeed <= 160) {
          this.airspeed++;
        } else if (sign === '-' || this.airspeed >= 1) {
          this.airspeed--;
        }
        this.checkRedDuration();
        await this.delay(this.intervalMovement/this.changeValue);
      }

      return this.executeAirspeedMovement();
    },
    getRandomOperator() {
      const weights = [0.9, 0.1];
      const cumulativeWeights = weights.map((sum => value => sum += value)(0));
      const random = Math.random();
      const randomIndex = cumulativeWeights.findIndex(cumulativeWeight => random < cumulativeWeight);

      return this.signRandoms[randomIndex];
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    checkRedDuration() {
      if (this.isPause) {
        return;
      }

      if (!this.isActive) {
        this.redStartTime = null;
        this.redDuration = 0;

        return;
      }

      if (this.airspeed > this.limitRedAirSpeed && !this.redStartTime) {
        this.redStartTime = new Date;
      } else if (
        ((this.airspeed <= this.limitRedAirSpeed) && this.redStartTime)
        || (this.redStartTime && this.isTimesUp)
      ) {
        const currentTime = Date.now();
        this.redDuration += (currentTime - this.redStartTime) / 1000;
        this.redStartTime = null;
      }
    }
  }
}
</script>

<style scoped>
#airspeed {
  position: absolute;
  left: 300px;
  top: 200px;
}

#button-plus {
  position: absolute;
  left: 250px;
  top: 200px;
}

#button-minus {
  position: absolute;
  left: 250px;
  top: 350px;
}

#airspeed-indicator {
  position: absolute;
  left: 250px;
  top: 235px;
  width: 33px;
  height: 113px;
  border: 1px solid #9e9e9e;
  background: linear-gradient(to top, blue 50%, transparent 50%);
}

.btn-plus-minus {
  min-width: 35px;
  min-height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #9e9e9e; /* Grey color */
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 22px;
  font-weight: bold;
  color: white;
}

.btn-plus-minus:hover {
  background-color: #757575; /* Darker grey on hover */
}
</style>
