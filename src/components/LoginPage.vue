<template>
  <div class="login-container">
    <div class="login-form">
      <div class="config-link">
        <router-link to="/config">
          <i class="fas fa-cog"></i> Konfigurasi Device
        </router-link>
      </div>
      <div class="header">
        <h2>Login</h2>
        <p>Silakan login menggunakan Email dan OTP yang sudah dikirimkan.</p>
      </div>
      <form @submit.prevent="login">
        <div class="input-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="Masukkan Email" required />
        </div>
        <div class="input-group">
          <label for="otp">OTP</label>
          <input type="text" id="otp" v-model="otp" placeholder="Masukkan OTP" required />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
    <div class="welcome-section">
      <img src="@/assets/logo.png" alt="Logo" />
      <h2>Selamat Datang</h2>
      <p>"Susthirabuddy Abhayagata"</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      otp: ''
    };
  },
  methods: {
    login() {
      // Mock login logic
      console.log('Email:', this.email);
      console.log('OTP:', this.otp);
      this.$router.push('/radar-vigilance');
    }
  }
};
</script>

<style scoped>
@import '~@fortawesome/fontawesome-free/css/all.css';

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.login-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.login-form {
  width: 55%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: auto;
  position: relative;
}

.config-link {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 14px;
}

.config-link a {
  color: #6c5ce7;
  text-decoration: none;
}

.header {
  text-align: left;
  margin-bottom: 20px;
  color: #555; /* Grey color for text */
}

.header h2 {
  color: #000; /* Ensure header is black */
}

.input-group {
  width: 100%;
  margin-bottom: 15px;
  text-align: left;
}

.input-group label {
  font-weight: bold; /* Bold text for labels */
  font-size: 16px; /* Larger text size for labels */
  color: #000; /* Ensure label is black */
}

input {
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 20px; /* More rounded input fields */
  color: #555; /* Grey color for input text */
  box-sizing: border-box; /* Ensure the input field fits the full width */
}

button {
  width: 100%;
  padding: 10px;
  background-color: #6c5ce7;
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background-color: #5b4ac4;
}

.welcome-section {
  width: 45%;
  background-color: #6c5ce7;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.welcome-section img {
  width: 100px;
  margin-bottom: 20px;
}

.welcome-section h2 {
  margin-bottom: 10px;
}
</style>
