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
        <p>Silakan login menggunakan Email dan Kode akses yang sudah dikirimkan.</p>
      </div>
      <form @submit.prevent="login">
        <div class="input-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="Masukkan Email" required />
        </div>
        <div class="input-group">
          <label for="code">Kode Akses</label>
          <input type="text" id="code" v-model="code" placeholder="Masukkan code" required />
        </div>
        <button type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Login</span>
        </button>
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
      code: '',
      loading: false
    };
  },
  methods: {
    async login() {
      this.loading = true;
      try {
        // Mock login logic
        console.log('Email:', this.email);
        console.log('OTP:', this.code);
        const res = await fetch("https://walrus-app-bfooa.ondigitalocean.app/api/scheduling/workstation-signin",
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              workstationId: 0,
              email: this.email,
              code: this.code
            })
          }
        )
        if (!res.ok) {
          throw new Error('Login failed');
        }
        const data = await res.json();
        console.log(data);

        // Save mock data to localStorage
        localStorage.setItem('scheduleData', JSON.stringify(data));

        // Redirect to test-module page
        this.$router.push('/module');
      } catch (error) {
        console.error(error);
        alert('Login gagal. Silakan coba lagi.');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
@import '~@fortawesome/fontawesome-free/css/all.css';

html,
body {
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
  color: #555;
}

.header h2 {
  color: #000;
}

.input-group {
  width: 100%;
  margin-bottom: 15px;
  text-align: left;
}

.input-group label {
  font-weight: bold;
  font-size: 16px;
  color: #000;
}

input {
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 20px;
  color: #555;
  box-sizing: border-box;
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
  display: flex;
  justify-content: center;
  align-items: center;
}

button:disabled {
  cursor: not-allowed;
}

button .spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

button:hover:not(:disabled) {
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
