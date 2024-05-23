<template>
  <div id="app">
    <Navigation v-if="showNavigation" />
    <div :class="['main-content', { 'full-width': !showNavigation }]">
      <router-view />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Navigation from './components/NavigationSection.vue';

export default {
  name: 'App',
  components: {
    Navigation
  },
  setup() {
    const route = useRoute();

    const showNavigation = computed(() => {
      return route.path !== '/';
    });

    return {
      showNavigation
    };
  }
};
</script>

<style>
#app {
  display: flex;
}

.main-content {
  flex-grow: 1;
  padding: 20px;
}

.main-content.full-width {
  width: 100%;
  padding: 20px;
}
</style>
