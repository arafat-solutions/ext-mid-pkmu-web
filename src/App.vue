<template>
  <div id="app">
    <!-- <Radar /> -->
    <CallSign />
  </div>
</template>

<script>
// import Radar from './components/RadarVigillance.vue';
import CallSign from './components/CallSignMultitask.vue';

export default {
  name: 'App',
  components: {
    // Radar,
    CallSign
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
