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
          value: 1
        },
        {
          label: 'V',
          value: 1
        },
        {
          label: 'X',
          value: 1
        },
        {
          label: 'Y',
          value: 1
        },
        {
          label: 'Z',
          value: 1
        },
        {
          label: 'A',
          value: 1
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
      ]
    };
  },
  mounted() {
    this.modifySVG();
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
