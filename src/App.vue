<template>
  <div id="app">
    <Navigation v-if="showNavigation" />
    <router-view />
  </div>
</template>

<script>
import Navigation from './components/NavigationSection.vue';

export default {
  name: 'App',
  components: {
    Navigation
  },
  computed: {
    showNavigation() {
      return this.$route.name !== 'Login';
    }
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
  height: 100vh;
  display: flex;
  flex-direction: row;
}
</style>
