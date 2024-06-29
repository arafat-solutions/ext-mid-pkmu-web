<template>
  <div>
    <vue-speedometer
      :startColor="startColor"
      :endColor="endColor"
      :segments="9"
      :customSegmentLabels="customSegmentLabels"
    />
  </div>
</template>

<script>
import VueSpeedometer from "vue-speedometer/slim"

export default {
  name: 'GaugesMeter',
  components: {
    VueSpeedometer,
  },
  data() {
    return {
      startColor: '#33CC33',
      endColor: '#FF471A',
      segmentColors: [
        '#FFFFFF',
        '#FFFFFF',
        '#FFFFFF',
        '#FFFFFF',
        '#FFFFFF',
        '#FEFF29',
        '#FEFF29',
        '#F91A23',
        '#F91A23',
      ],
      customSegmentLabels: [
        {
          text: "1",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "2",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "3",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "4",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "5",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "6",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "7",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "8",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
        {
          text: "9",
          position: "OUTSIDE",
          fontSize: "14px",
          color: "#000000",
        },
      ]
    };
  },
};
</script>

<style scoped>
.speedo-segment:nth-child(9), /* 8th index in 0-based */
.speedo-segment:nth-child(10) /* 9th index in 0-based */ {
  fill: rgb(249, 26, 35) !important;
}
</style>
