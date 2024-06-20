<template>
    <div class="main-view">
      <div class="row">
        <div class="col-lg-5">
          <Horizon />
          <ArithmeticTask />
        </div>
        <div class="col-lg-2">
          <WarningLights />
        </div>
        <div class="col-lg-5">
          <Gauges />
        </div>
      </div>
    </div>
  </template>

  <script>
  import Horizon from './HorizonView.vue';
  import WarningLights from './WarningLights.vue';
  import Gauges from './GaugesMeter.vue';
  import ArithmeticTask from './ArithmeticTask';

  export default {
    name: 'MainView',
    components: {
      Horizon,
      WarningLights,
      Gauges,
      ArithmeticTask
    }
  };
  </script>

  <style scoped>
  .main-view {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
  }
  </style>
