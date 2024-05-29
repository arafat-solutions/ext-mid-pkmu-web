<template>
  <div class="navigation">
    <div class="logo">
      <img src="@/assets/logo.png" alt="Logo" />
    </div>
    <div class="schedule">
      <p class="schedule-title">{{scheduleData.name}}</p>
      <p class="schedule-time">Waktu: {{scheduleData.startHour}}-{{scheduleData.endHour}}</p>
    </div>
    <ul class="menu">
      <li v-for="test in scheduleData.tests" :key="test.name">
        <div class="menu-item" :class="{ active: isActive(test.name) }" @click="selectTest(test.name)">
          {{test.name}}
          <span class="status selesai" v-if="isCompleted(test.name)">Selesai</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import EventBus from '@/eventBus';

export default {
  data() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
    return {
      scheduleData
    };
  },  
  name: 'NavigationPage',
  methods: {
    isActive(routeName) {
      return this.$route.name === routeName;
    },
    isCompleted(routeName) {
      // Replace with actual logic to determine if the test is completed
      return routeName === 'Baterai1'; // Example: only Baterai1 is completed
    },
    selectTest(test) {
      EventBus.$emit('testSelected', test);
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
