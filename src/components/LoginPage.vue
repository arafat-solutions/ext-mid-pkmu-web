<template>
    <div class="login-page">
      <div class="login-container">
        <div class="login-left">
          <h1>Login</h1>
          <p>Silakan login menggunakan Email dan OTP yang sudah dikirimkan.</p>
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="email" placeholder="Masukkan Email" required />
            </div>
            <div class="form-group">
              <label for="otp">OTP</label>
              <input type="text" id="otp" v-model="otp" placeholder="Masukkan OTP" required />
            </div>
            <button type="submit" class="login-button">Login</button>
          </form>
        </div>
        <div class="login-right">
          <div class="welcome">
            <h2>Selamat Datang</h2>
            <p>Susithirabuddy Abhayagata</p>
          </div>
        </div>
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
      handleLogin() {
        // Handle login logic here
        console.log('Email:', this.email);
        console.log('OTP:', this.otp);
        this.$router.push('/radar-vigilance');
      }
    }
  };
  </script>
  
  <style scoped>
  .login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f9f9f9;
  }
  
  .login-container {
    display: flex;
    width: 80%;
    height: 70%;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);
    border-radius: 15px;
    overflow: hidden;
  }
  
  .login-left {
    flex: 1;
    padding: 40px;
    background-color: white;
  }
  
  .login-left h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .login-left p {
    margin-bottom: 40px;
    color: #666;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
  }
  
  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
  
  .login-button {
    width: 100%;
    padding: 10px;
    background-color: #6a1b9a;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .login-button:hover {
    background-color: #4a148c;
  }
  
  .login-right {
    flex: 1;
    background-color: #6a1b9a;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  
  .welcome h2 {
    font-size: 36px;
    margin-bottom: 20px;
  }
  
  .welcome p {
    font-size: 18px;
  }
  
  @media (max-width: 768px) {
    .login-container {
      flex-direction: column;
    }
  
    .login-left,
    .login-right {
      width: 100%;
      height: 50%;
    }
  }
  </style>
  