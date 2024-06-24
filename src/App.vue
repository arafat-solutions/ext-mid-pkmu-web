<template>
  <div id="app">
    <template v-if="isLoginPage">
      <LoginPage />
    </template>
    <template v-else>
      <div class="main-container">
        <Navigation v-if="showNavigation" class="navigation" />
        <div :class="{'content': showNavigation, 'full-content': !showNavigation}">
          <TopNavigation v-if="showNavigation" />
          <router-view />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import Navigation from './components/NavigationSection.vue';
import LoginPage from './components/LoginPage.vue';
import TopNavigation from './components/TopNavigation.vue';

export default {
  name: 'App',
  components: {
    Navigation,
    LoginPage,
    TopNavigation
  },
  computed: {
    isLoginPage() {
      return this.$route.name === 'Login';
    },
    showNavigation() {
      return (this.$route.name !== 'Login' && this.$route.name !== 'Config') && !this.$route.path.includes('test');
    }
  }
};
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.main-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

.navigation {
  width: 20%;
  background-color: #6f42c1;
}

.content {
  width: 80%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.full-content {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }

  .navigation {
    width: 100%;
  }

  .content,
  .full-content {
    width: 100%;
  }
}
</style>
