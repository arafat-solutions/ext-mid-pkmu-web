<template>
  <div class="navigation">
    <div class="logo">
      <img src="@/assets/logo.png" alt="Logo" />
    </div>
    <div class="schedule">
      <p class="schedule-title">Jadwal ABC</p>
      <p class="schedule-time">Waktu: 09:00-12.00</p>
    </div>
    <ul class="menu">
      <li>
        <router-link :to="{ name: 'Radar Vigilance Menu' }" class="menu-item" :class="{ active: isActive('Baterai1') }">
          Baterai Tes 1
          <span class="status selesai" v-if="isCompleted('Baterai1')">Selesai</span>
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'Callsign Multitask Menu' }" class="menu-item" :class="{ active: isActive('Baterai2') }">
          Baterai Tes 2
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'Instrument Multitasking Menu' }" class="menu-item" :class="{ active: isActive('Baterai3') }">
          Baterai Tes 3
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'PFD Tracking Menu' }" class="menu-item" :class="{ active: isActive('Baterai4') }">
          Baterai Tes 4
        </router-link>
      </li>
      <li>
        <router-link :to="{ name: 'Spatial Orientation Menu' }" class="menu-item" :class="{ active: isActive('Baterai5') }">
          Baterai Tes 5
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'NavigationPage',
  methods: {
    isActive(routeName) {
      return this.$route.name === routeName;
    },
    isCompleted(routeName) {
      // Replace with actual logic to determine if the test is completed
      return routeName === 'Baterai1'; // Example: only Baterai1 is completed
    }
  }
};
</script>

<style scoped>
.navigation {
  background-color: #6f42c1;
  color: white;
  padding: 0 20px; /* Remove padding from top, left, and bottom */
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20%;
  box-sizing: border-box;
}

.logo {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.logo img {
  width: 100px;
}

.schedule {
  text-align: center;
  margin-bottom: 20px;
}

.schedule-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 5px;
}

.schedule-time {
  font-size: 0.9em;
}

.menu {
  list-style: none;
  padding: 0;
  width: 100%;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #834acb;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  text-decoration: none;
  color: white;
  font-weight: bold;
  transition: background-color 0.3s;
}

.menu-item:hover {
  background-color: #6f42c1;
}

.menu-item.active {
  background-color: #ffffff;
  color: #6f42c1;
}

.menu-item.active .status {
  background-color: #34c759;
  color: white;
}

.status {
  background-color: #6f42c1;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 0.8em;
}

.status.selesai {
  background-color: #34c759;
}
</style>
