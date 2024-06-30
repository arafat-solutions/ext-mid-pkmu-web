<template>
  <div class="speedometer-content">
    <div :ref="`speedometerContainer${index}`" v-for="(speedometer, index) in speedometers" class="speedometer-container">
      <vue-speedometer
        :segmentColors="segmentColors"
        :segments="customSegmentLabels.length"
        :value="speedometer.value"
        :minValue="0"
        :maxValue="customSegmentLabels.length"
        :customSegmentLabels="customSegmentLabels"
        :currentValueText="speedometer.label"
        :width="200"
        :height="200"
        :ringWidth="30"
        :paddingHorizontal="-20"
        :paddingVertical="-20"
        :needleHeightRatio="0.75"
        needleTransition="easePolyInOut"
      />
    </div>
  </div>
</template>

<script>
import VueSpeedometer from "vue-speedometer"

export default {
  name: 'GaugesMeter',
  components: {
    VueSpeedometer,
  },
  data() {
    return {
      speedometers: [
        {
          label: 'W',
          value: 0
        },
        {
          label: 'V',
          value: 0
        },
        {
          label: 'X',
          value: 0
        },
        {
          label: 'Y',
          value: 0
        },
        {
          label: 'Z',
          value: 0
        },
        {
          label: 'A',
          value: 0
        },
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
      frequency: 'high', // Set the initial frequency level
      frequencyLevels: {
        easy: 0.2, // 20% chance of changing
        normal: 0.5, // 50% chance of changing
        high: 0.9 // 90% chance of changing
      },
      intervalId: null
    };
  },
  mounted() {
    this.modifySVG();
    this.startUpdating();
  },
  beforeDestroy() {
    clearInterval(this.intervalId);
  },
  methods: {
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
              gElements[2].setAttribute('transform', 'translate(80, 90)');
            }
          }
        }
      });
    },
    getRandomValue() {
      return Math.random() * 7.5;
    },
    updateSpeedometers() {
      const frequencyConfig = this.frequencyLevels[this.frequency] || this.frequencyLevels.normal;

      this.speedometers = this.speedometers.map(speedometer => {
        let newValue = speedometer.value;
        if (Math.random() <= frequencyConfig) {
          if (speedometer.value >= 7) {
            // Ensure that the value can only increase when it is 7
            newValue = 7 + Math.random() * 2;
          } else {
            newValue = this.getRandomValue();
          }
        }
        return {
          ...speedometer,
          value: newValue > speedometer.value ? newValue : speedometer.value
        };
      });
    },
    startUpdating() {
      this.intervalId = setInterval(this.updateSpeedometers, 1000);
    }
  },
};
</script>

<style>
.speedometer-container {
  display: inline-block;
  margin-right: 30px;
  margin-bottom: 20px;
}

.speedometer {
  border: 2px solid black;
  border-radius: 50%;
  box-sizing: border-box;
}

.current-value {
  margin-top: 2rem;
}

.speedometer-content {
  padding-left: 50px;
}
</style>
