<template>
  <div class="battery-test-detail">
    <div class="info-box">
      <h1>{{ selectedTestTitle }}</h1>
      <p>{{ selectedTestDescription }}</p>
    </div>
    <div class="test-list-box">
      <h2>Available Tests</h2>
      <ul>
        <li v-for="test in tests" :key="test.id" class="test-item">
          <div class="test-content">
            <p>{{ test.name }}</p>
            <router-link :to="test.link" class="test-button">Start Test</router-link>
          </div>
        </li>
      </ul>
    </div>
  </div>
  <!-- <div class="parent-container">
    <button @click="showModal">Show Modal</button>
    <ModalComponent :visible="isModalVisible" title="Apakah Anda yakin untuk Log Out?"
      message="Apakah Anda yakin untuk Log Out?" @confirm="handleConfirm" @cancel="handleCancel" />
  </div> -->
</template>

<script>
import EventBus from '@/eventBus';

export default {
  name: 'RadarVigilanceMenu',

  data() {
    return {
      isModalVisible: false,
      selectedTestDescription: '',
      selectedTestTitle: '',
      tests: [
        { id: 1, name: 'Test 1', link: '/battery-test-1' },
        { id: 2, name: 'Test 2', link: '/battery-test-1' },
        { id: 3, name: 'Test 3', link: '/battery-test-1' }
        // Add more tests here if needed
      ]
    };
  },
  created() {
    EventBus.$on('testSelected', this.handleTestSelected);
  },
  beforeUnmount() {
    EventBus.$off('testSelected', this.handleTestSelected);
  },
  methods: {
    handleTestSelected(test) {
      console.log(test);
      this.selectedTestTitle = test.name;
      this.selectedTestDescription = test.description;
    },
  },
};
</script>

<style scoped>
.battery-test-detail {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.info-box,
.test-list-box {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  flex: 1;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.info-box h1,
.test-list-box h2 {
  margin-top: 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

.test-item {
  background-color: #f3e5f5;
  border-radius: 12px;
  margin: 10px 0;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.test-button {
  background-color: #6f42c1;
  color: white;
  padding: 10px 20px;
  border-radius: 24px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
}

.test-button:hover {
  background-color: #5e37a6;
}
</style>
