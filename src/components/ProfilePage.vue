<template>
    <div class="profile">
      <h2>Profil Saya</h2>
      <form @submit.prevent="saveProfile">
        <div class="form-group">
          <label>Nama Peserta*</label>
          <input type="text" v-model="profile.name" required />
        </div>
        <div class="form-group">
          <label>Email*</label>
          <input type="email" v-model="profile.email" required />
        </div>
        <!-- Add other form fields as needed -->
        <div class="form-group">
          <button type="submit">Simpan</button>
        </div>
      </form>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ProfilePage',
    data() {
      return {
        profile: {
          name: 'Andi Wijaya',
          email: 'andiwijaya@gmail.com',
          // Add other fields as necessary
        }
      };
    },
    methods: {
      saveProfile() {
        // Handle profile save logic here
        console.log('Profile saved:', this.profile);
      }
    }
  };
  </script>
  
  <style scoped>
  .profile {
    padding: 20px;
  }
  
  h2 {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
  }
  
  .form-group input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }
  
  button {
    background-color: #6f42c1;
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #5a349e;
  }
  </style>
  