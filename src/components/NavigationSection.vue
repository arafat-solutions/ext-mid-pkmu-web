<template>
  <div class="navigation bg-gradient-to-r from-[#6E4AE4] to-[#755AC9] h-screen w-1/5 flex flex-col text-white">
    <div class="logo p-4 justify-left">
      <img src="@/assets/logo.png" alt="Logo" class="w-16 h-16 mx-auto" />
    </div>
    <div class="schedule text-left px-10 mb-6">
      <p class="schedule-title text-xl font-bold">{{ scheduleData.name }}</p>
      <p class="schedule-time text-xl font-semibold">Waktu: {{ scheduleData.startHour }}-{{ scheduleData.endHour }}</p>
    </div>
    <ul class="menu flex-grow overflow-auto px-2">
      <li v-for="(test, index) in scheduleData.tests" :key="test.name">
        <div
          class="menu-item h-16 py-2 px-4 mx-8 my-4 rounded-lg cursor-pointer transition-colors duration-200 flex justify-left items-center"
          :class="{
            'bg-white text-[#6E4AE4] font-semibold border-l-4 border-[#6E4AE4]': isActive(test.name),
            'bg-[#755AC9] text-white font-semibold border-l-4 border-white': !isActive(test.name),
            'cursor-not-allowed opacity-50': isCompleted(test.name)  // Add styles for completed items
          }"
          @click="isCompleted(test.name) ? null : selectTest(test)" 
        >
          Baterai Test {{ index + 1 }}
          <span v-if="isCompleted(test.name)"
            class="status selesai text-xs bg-green-500 text-white px-2 py-1 rounded-full ml-2">
            Selesai
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>


<script>
import EventBus from '@/eventBus';

export default {
  name: 'NavigationPage',
  data() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
    return {
      scheduleData,
      activeTest: null
    };
  },
  methods: {
    isActive(testName) {
      return this.activeTest === testName;
    },
    isCompleted(testName) {
      // Find the test from scheduleData to check its completion status
      const test = this.scheduleData.tests.find(test => test.name === testName);
      return test ? test.completed === true : false;
    },
    selectTest(test) {
      console.log('selecting:', test.name);
      this.activeTest = test.name;
      EventBus.$emit('testSelected', test);
    }
  }
};
</script>

