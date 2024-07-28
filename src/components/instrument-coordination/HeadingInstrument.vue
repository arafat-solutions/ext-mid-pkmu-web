<template>
  <div>
    <Heading id="heading" class="indicator-bg" :size="200" :heading="headingValue"/>
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
    }
  },
  mounted: function () {
    if (this.changeType !== 'inactive') {
      this.executeIntervalHeader();
    }
  },
  methods: {
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    executeIntervalHeader() {
        let intervalHeader = 100; //in ms
        if (this.changeType === 'adjust_for_irregular_updates') {
          intervalHeader = getRandomInterval(1000, 3000);
        }
        setTimeout(executeIntervalHeader, intervalHeader);
    }
  }
}
</script>

<style scoped>

#heading {
  position: absolute;
  left: 540px;
  top: 75px;
}
</style>
