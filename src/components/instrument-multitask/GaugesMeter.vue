<template>
  <div class="speedometer-content">
    <div 
      :ref="`speedometerContainer${index}`" 
      v-for="(speedometer, index) in speedometers" 
      class="speedometer-container" 
      :key="index"
      @click="handleGaugeClick(speedometer.label)"
    >
      <vue-speedometer
        :segmentColors="segmentColors"
        :segments="customSegmentLabels.length"
        :value="speedometer.value"
        :minValue="0"
        :maxValue="customSegmentLabels.length"
        :customSegmentLabels="customSegmentLabels"
        :currentValueText="speedometer.label + '&nbsp;&nbsp;&nbsp;&nbsp;'"
        :width="200"
        :height="200"
        :ringWidth="30"
        :paddingHorizontal="-20"
        :paddingVertical="-20"
        :needleHeightRatio="0.75"
        :needleTransitionDuration="1500"
        needleTransition="easeCubicInOut"
      />
    </div>
  </div>
</template>

<script>
import VueSpeedometer from "vue-speedometer";

export default {
  name: 'GaugesMeter',
  components: {
    VueSpeedometer,
  },
  props: {
    isTimesUp: Boolean,
    frequency: String,
    isPause: Boolean,
    isActive: Boolean,
  },
  data() {
    return {
      lastPress: null,
      speedometers: [
        { label: 'W', value: 0, displayValue: 0, speed: 0.5 },
        { label: 'V', value: 0, displayValue: 0, speed: 0.7 },
        { label: 'X', value: 0, displayValue: 0, speed: 0.3 },
        { label: 'Y', value: 0, displayValue: 0, speed: 0.6 },
        { label: 'Z', value: 0, displayValue: 0, speed: 0.4 },
        { label: 'A', value: 0, displayValue: 0, speed: 0.8 },
      ],
      startColor: '#33CC33',
      endColor: '#FF471A',
      segmentColors: [
        '#33CC33',
        '#50D230',
        '#71D82D',
        '#96DE2A',
        '#BEE427',
        '#EAE924',
        '#EFC521',
        '#F91A23',
        '#F91A23',
      ],
      customSegmentLabels: [
        {
          text: 1,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 2,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 3,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 4,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 5,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 6,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 7,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 8,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: 9,
          position: "INSIDE",
          fontSize: "14px",
          color: "#000000",
        },
      ],
      frequencyLevels: {
        low: 0.5, // 20% chance of changing
        normal: 0.7, // 50% chance of changing
        high: 0.9 // 90% chance of changing
      },
      intervalId: null,
      result: {
        wrong: 0,
        occurance: 0,
        differenceTimes: [],
        needPressTimes: [],
      }
    };
  },
  mounted() {
    this.modifySVG();
    if (this.isActive) {
      this.startUpdating();
      this.startContinuousMovement();
    }
    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
    clearInterval(this.continuousMovementInterval);
    window.removeEventListener('keydown', this.handleKeyPress);
  },
  computed: {
    resultCorrect() {
      return this.result.differenceTimes.length;
    },
    totalNeedPress() {
      return this.resultCorrect + this.result.needPressTimes.length;
    },
    correctResponse() {
      if (this.totalNeedPress < 1) {
        return 0;
      }

      return Number((this.resultCorrect / this.totalNeedPress * 100).toFixed(2));
    },
    responseTime() {
      if (this.result.differenceTimes.length < 1) {
        return 0;
      }
      let sum = this.result.differenceTimes.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, 0);

      for (const needPressTime of this.result.needPressTimes) {
        sum += this.getTimeDifferenceInSeconds(Date.now(), needPressTime.time);
      }

      return Number((sum / this.totalNeedPress).toFixed(2));
    },
  },
  watch: {
    isTimesUp() {
      this.$emit('getResult', {
        correctResponse: this.correctResponse,
        responseTime: this.responseTime,
        correct: this.result.resultCorrect,
        occurance: this.result.occurance,
      });
    },
    isPause(newValue) {
      if (newValue) {
        clearInterval(this.intervalId);
      } else {
        this.startUpdating();
      }
    }
  },
  methods: {
    startContinuousMovement() {
      this.continuousMovementInterval = setInterval(() => {
        this.speedometers.forEach(speedometer => {
          if (speedometer.displayValue < speedometer.value) {
            speedometer.displayValue = Math.min(speedometer.displayValue + speedometer.speed, speedometer.value);
          } else if (speedometer.displayValue > speedometer.value) {
            speedometer.displayValue = Math.max(speedometer.displayValue - speedometer.speed, speedometer.value);
          }
        });
      }, 50);
    },
    // For change position label W,V,X,Y,Z,A
    modifySVG() {
      // Find the target 'g' element and modify it
      this.speedometers.forEach((speedometer, index) => {
        const refName = `speedometerContainer${index}`;
        const container = this.$refs[refName][0];  // Access the ref DOM element
        if (container) {
          const svgElement = container.querySelector('svg');
          if (svgElement) {
            const gElements = svgElement.getElementsByTagName('g');
            if (gElements.length > 2) {
              gElements[2].setAttribute('transform', 'translate(105, 115)');
            }
          }
        }
      });
    },
    updateSpeedometers() {
      const frequencyConfig = this.frequencyLevels[this.frequency] || this.frequencyLevels.normal;

      this.speedometers = this.speedometers.map(speedometer => {
        let newValue = speedometer.value;
        if (Math.random() > frequencyConfig) {
          return {
            ...speedometer,
            value: newValue
          };
        }

        if (this.lastPress === speedometer.label) {
          this.lastPress = null;
          return {
            ...speedometer,
            value: newValue
          };
        }

        if (speedometer.value >= 7) {
          // Record time need action
          this.recordNeedPressTimes(speedometer.label)
        }

        // Determine if the gauge should move up or down
        const shouldMoveDown = Math.random() < 0.2; // 20% chance to move down

        if (shouldMoveDown) {
          newValue = speedometer.value - Math.random();
          // Ensure newValue doesn't go below 0
          if (newValue < 0) {
            newValue = 0;
          }
        } else {
          newValue = speedometer.value + Math.random();
          // Ensure newValue doesn't exceed 9
          if (newValue > 9) {
            newValue = 9;
          }
        }

        return {
          ...speedometer,
          value: newValue
        };
      });
    },
    startUpdating() {
      this.intervalId = setInterval(this.updateSpeedometers, 1000);
    },
    recordNeedPressTimes(label) {
      // Check if the label already exists
      let labelExists = this.result.needPressTimes.some(item => item.label === label);

      if (labelExists) {
        return;
      }

      this.result.occurance++;

      this.result.needPressTimes.push({
        'label': label,
        'time': Date.now(),
      });
    },
    handleGaugeClick(label) {
      if (this.isPause || !this.isActive) {
        return;
      }
      this.handleInput(label);
    },

    handleKeyPress(event) {
      if (event.key !== 'w' && event.key !== 'v' && event.key !== 'x' && event.key !== 'y' && event.key !== 'z' && event.key !== 'a') {
        return;
      }

      if (this.isPause || !this.isActive) {
        return;
      }
      const keyPress = event.key.toUpperCase();
      this.handleInput(keyPress);
    },

    handleInput(input) {
      // Find the index of the item with the given label
      const indexNeedPress = this.result.needPressTimes.findIndex(item => item.label === input);
      if (indexNeedPress === -1) {
        this.result.wrong++;
        return;
      }

      // Calculate diff
      const now = Date.now();
      const diff = this.getTimeDifferenceInSeconds(now, this.result.needPressTimes[indexNeedPress].time);
      this.result.differenceTimes.push(diff);

      // Remove Need Press Times
      this.result.needPressTimes.splice(indexNeedPress, 1);

      // Update existing speedometer
      const indexSpeedometer = this.speedometers.findIndex(speedometer => speedometer.label === input);

      if (indexSpeedometer === -1) {
        return;
      }
      this.speedometers[indexSpeedometer].value = 0;
      this.lastPress = input;
    },
    getTimeDifferenceInSeconds(dateTime1, dateTime2) {
      let differenceInMilliseconds = Math.abs(dateTime2 - dateTime1);
      return differenceInMilliseconds / 1000;
    }
  },
};
</script>
<style scoped>
.speedometer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px;
}

.speedometer-container {
  margin: 5px;
  cursor: pointer; /* Add cursor style to indicate clickability */
}


.speedometer {
  border: 1px solid black;
  border-radius: 50%;
  box-sizing: border-box;
}

.current-value {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 10px; /* Adjust the value to move the text closer or further from the bottom */
  text-align: center;
}

.speedometer-content {
  padding-left: 75px;
}
</style>