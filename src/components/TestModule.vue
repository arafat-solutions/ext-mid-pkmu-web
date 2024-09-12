<template>
  <div class="flex-1 p-8 overflow-auto">
    <div class="flex gap-8">
      <div class="w-2/3 bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">{{ selectedTestTitle }}</h1>
          <button
            class="bg-transparent text-[#5C3ED6] border-2 border-[#5C3ED6] px-4 py-2 rounded-full text-sm hover:bg-[#5C3ED6] transition-colors">
            Tonton Tutorial
          </button>
        </div>
        <!-- inject html selectedTestDescription -->
        <div v-html="selectedTestDescription"></div>
      </div>

      <div class="w-1/3 bg-white p-6 h-fit shadow-lg rounded-xl">
        <div class=" bg-[#E2DBFA] px-4 py-4 rounded-xl border-2 border-[#6E4AE4]">
          <div class="flex items-center mb-4">
            <span class="text-[#6E4AE4] mr-2 text-2xl">🔆</span>
            <h2 class="text-lg font-bold">Latihan Test</h2>
          </div>
          <p class="mb-4 text-[#6E4AE4] font-extralight">Kamu bisa mencoba test terlebih dahulu untuk latihan.</p>
          <div class="bg-[#E2DBFA] border-2 border-[#6E4AE4] text-[#6E4AE4] px-4 py-2 rounded-full w-64">
            <router-link :to="this.url" class="test-button">Start Test</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EventBus from '@/eventBus';

export default {
  name: 'RadarVigilanceMenu',
  data() {
    return {
      selectedTestTitle: '',
      selectedTestDescription: '',
      url: ''
    };
  },
  created() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
    const firstIncompleteTest = scheduleData.tests.find(test => !test.completed);
    if (firstIncompleteTest) {
      console.log('Next test:', firstIncompleteTest);
      this.handleTestSelected(firstIncompleteTest);
    } else {
      console.log('All tests are completed');
      // Optionally, handle the case where all tests are completed
    }
  },
  beforeUnmount() {
    EventBus.$off('testSelected', this.handleTestSelected);
  },
  methods: {
    handleTestSelected(test) {
      console.log(test);
      this.selectedTestTitle = 'Instruksi Test';
      this.selectedTestDescription = test.description;
      this.url = test.testUrl;
    },
  },
};
</script>

<style scoped>
/* Add any additional styles here if needed */
</style>