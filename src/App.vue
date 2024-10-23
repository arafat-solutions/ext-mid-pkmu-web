<template>
  <div id="app">
    <ScreenShare ref="screenShare" />
    <template v-if="isLoginPage">
      <LoginPage @login-success="handleLoginSuccess"/>
    </template>
    <template v-else>
      <div class="main-container">
        <div class="content">
          <TopNavigation v-if="showTopNavigation" />
          <router-view />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import ScreenShare from './components/ScreenShare.vue';
import LoginPage from './components/LoginPage.vue';
import TopNavigation from './components/TopNavigation.vue';

export default {
  name: 'App',
  components: {
    LoginPage,
    TopNavigation,
    ScreenShare
  },
  computed: {
    handleLoginSuccess() {
      console.log('Login successful');
      this.$refs.screenShare?.initializeScreenShare();
      return false;
    },
    isLoginPage() {
      return this.$route.name === 'Login';
    },
    showTopNavigation() {
      return (this.$route.name !== 'Login' && this.$route.name !== 'Config') && !this.$route.path.includes('test');
    }
  }
};
</script>

<style>
html,
body {
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
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

.content {
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .content {
    padding: 10px;
  }
}
</style>