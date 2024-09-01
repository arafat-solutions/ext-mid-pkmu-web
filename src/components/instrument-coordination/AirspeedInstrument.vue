<template>
  <div>
    <Airspeed id="airspeed" class="indicator-bg" :size="200" :airspeed="airspeed" />
    <button id="button-plus" class="btn-plus-minus" @click="btnPlus">+</button>
    <div id="airspeed-indicator" :style="indicatorStyle"></div>
    <button id="button-minus" class="btn-plus-minus" @click="btnMinus">-</button>
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
        this.$emit('getResult', this.redDuration);
      }
    },
    isPause(newValue) {
      if (!newValue) {
        this.executeAirspeedMovement();
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
    indicatorStyle() {
      const percentage = this.airspeed > 0 ? Math.round(this.airspeed / 160 * 100) : 0;
      return {
        background: `linear-gradient(to top, blue ${percentage}%, transparent ${percentage}%)`,
      };
    }
  },
  data: function () {
    return {
      airspeed: 0,
      intervalMovement: 1000,
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

      if ((event.key.toLowerCase() === 'q' || event.key === 'Shift') && this.airspeed <= 160) {
        this.airspeed += 5;
        this.checkRedDuration();
      } else if ((event.key.toLowerCase() === 'a' || event.key === 'Ctrl') && this.airspeed >= 1) {
        this.airspeed -= 5;
        this.checkRedDuration();
      }
    },
    btnPlus() {
      this.airspeed += 5;
      this.checkRedDuration();
    },
    btnMinus() {
      this.airspeed -= 5;
      this.checkRedDuration();
    },
    async executeAirspeedMovement() {
      if (this.isPause || this.isTimesUp) {
        return;
      }

      for(let i=1;i<=this.changeValue;i++) {
        if (this.airspeed < 160) {
          this.airspeed += Math.random();
        }
        this.checkRedDuration();
        await this.delay(this.intervalMovement/this.changeValue);
      }

      return this.executeAirspeedMovement();
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
