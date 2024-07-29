<template>
  <div>
    <Heading id="heading" class="indicator-bg" :size="200" :heading="headingValue" />
    <div class="target" />
  </div>
</template>

<script>
import {Heading} from  'vue-flight-indicators';

export default {
  components: {
    Heading,
  },
  props: {
    isTimesUp: Boolean,
    isPause: Boolean,
    changeType: String,//inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
    changeValue: Number,
  },
  data: function () {
    return {
      headingValue: 0,
      signRandoms: ['+', '-'],
      defaultIntervalHeader: 500, //in ms
      target: 0,
    }
  },
  created() {
    window.addEventListener('keyup', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keyup', this.handleKeyPress);
  },
  computed: {
    rotationStyle() {
      return {
        transform: `rotate(${this.target}deg)`,
        transition: 'transform 1s ease-in-out',
      };
    },
  },
  mounted: function () {
    if (this.changeType !== 'inactive') {
      this.executeHeadingMovement();
    }
  },
  methods: {
    handleKeyPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowRight') {
        this.headingValue += this.changeValue;
      } else if (event.key === 'ArrowLeft') {
        this.headingValue -= this.changeValue;
      }
    },
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    executeHeadingMovement() {
      const sign = this.getRandomOperator();
      if (sign === '+') {
        this.target += this.changeValue;
      } else {
        this.target -= this.changeValue;
      }

      let intervalHeader = this.defaultIntervalHeader; //in ms
      if (this.changeType === 'adjust_for_irregular_updates') {
        intervalHeader = this.getRandomInterval(1000, 3000);
      }
      setTimeout(this.executeHeadingMovement, intervalHeader);
    },
    getRandomOperator() {
      const randomIndex = Math.floor(Math.random() * this.signRandoms.length);
      return this.signRandoms[randomIndex];
    },

  }
}
</script>

<style scoped>
#heading {
  position: absolute;
  left: 540px;
  top: 75px;
}

.circle-container {
  position: relative;
  width: 180px; /* 2 * radius */
  height: 180px; /* 2 * radius */
  border: 1px solid #ddd;
  border-radius: 50%;
  overflow: hidden;
}

.target {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 8px solid rgb(72, 200, 68);
  position: absolute;
  left: 640px;
  top: 105px;
  transform: translate(-50%, -50%);
}
</style>
