<template>
  <div id="app">
    <Navigation v-if="showNavigation" class="navigation" />
    <div class="content">
      <router-view />
    </div>
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

.navigation {
  width: 20%;
  background-color: #6f42c1;
}

.content {
  width: 80%;
  padding: 20px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  #app {
    flex-direction: column;
  }

  .navigation {
    width: 100%;
  }

  .content {
    width: 100%;
  }
}
</style>
