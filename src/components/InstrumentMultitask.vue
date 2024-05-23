<template>
    <div class="main-view">
      <div class="horizon-container">
        <Horizon />
      </div>
      <div class="side-panel">
        <WarningLights />
        <Gauges />
      </div>
    </div>
  </template>
  
  <script>
  import Horizon from './HorizonView.vue';
  import WarningLights from './WarningLights.vue';
  import Gauges from './GaugesMeter.vue';
  
  export default {
    name: 'MainView',
    components: {
      Horizon,
      WarningLights,
      Gauges
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
  .horizon-container {
    flex: 1;
  }
  .side-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  </style>
  