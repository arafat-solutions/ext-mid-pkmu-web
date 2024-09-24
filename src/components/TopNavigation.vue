<template>
  <div class="top-nav-bar divide-y-4 border-spacing-1">
    <div class="user-info">
      <div class="avatar">AW</div>
      <div class="user-details">
        <span class="user-name">{{ user }}</span>
        <span class="user-role">Peserta</span>
      </div>
      <div class="dropdown">
        <button class="dropbtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="dropdown-content">
          <a href="/profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profil Saya
          </a>
          <a @click="logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Log Out
          </a>
        </div>
      </div>
    </div>
    <button class="start-test-button">Mulai Test</button>
  </div>
</template>

<script>
export default {
  name: "TopNavigation",
  data() {
    return {
      user: null
    };
  },
  methods: {
    logout() {
      console.log('logout');
      localStorage.removeItem('scheduleData');
      console.log(localStorage.getItem('scheduleData'));
      this.$router.push('');
    },
    onMounted() {
      this.user = JSON.parse(localStorage.getItem('scheduleData')).userId;
      console.log(this.user);
    }
  }
};
</script>

<style scoped>
.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #E6E0FF;
  color: #6E4AE4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 0.75rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 0.5rem;
}

.user-name {
  font-weight: bold;
  color: #333;
}

.user-role {
  font-size: 0.8rem;
  color: #666;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropbtn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.dropdown-content {
  display: none;
  position: absolute;
  right: 0;
  background-color: #ffffff;
  min-width: 180px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border-radius: 8px;
  overflow: hidden;
}

.dropdown-content a {
  color: #333;
  padding: 12px 16px;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.dropdown-content a:hover {
  background-color: #f8f8f8;
}

.dropdown-content svg {
  margin-right: 8px;
}

.dropdown:hover .dropdown-content {
  display: block;
}

.start-test-button {
  background-color: #6E4AE4;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.start-test-button:hover {
  background-color: #5C3ED6;
}
</style>