<template>
  <div class="flex-1 p-8 overflow-auto">
    <div class="flex gap-8">
      <div class="w-2/3 bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold justify-center">{{ selectedTestTitle }}</h1>
          <button
            class="bg-transparent text-[#5C3ED6] border-2 border-[#5C3ED6] px-4 py-2 rounded-full text-sm hover:bg-[#5C3ED6] transition-colors">
            Tonton Tutorial
          </button>
        </div>
        <!-- inject html selectedTestDescription -->
        <div v-html="selectedTestDescription"></div>
      </div>

      <div class="w-1/3 bg-white p-6 h-fit shadow-lg rounded-xl">
        <div v-if="this.url">
          <router-link :to="this.url" class="block">
            <div class="bg-[#ade5bd] px-4 py-4 rounded-xl border-2 border-[#4ae46e] mt-10">
              <div class="flex items-center mb-4">
                <span class="text-[#4ae46e] mr-2 text-2xl">🔆</span>
                <h2 class="text-lg font-bold">Mulai Test</h2>
              </div>
              <p class="mb-4 text-[#207c43] font-extralight">Mulai Test Jika sudah siap.</p>
              <div class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full w-64">
                Start Test
              </div>
            </div>
          </router-link>
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
      selectedTestTitle: 'Ujian anda telah selesai',
      selectedTestDescription: 'Terimakasih atas partisipasinya, anda dapat meninggalkan ruangan',
      url: ''
    };
  },
  created() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
    if (scheduleData) {
      try {
        const firstIncompleteTest = scheduleData.tests.find(test => !test.completed);
        if (firstIncompleteTest) {
          console.log('Next test:', firstIncompleteTest);
          this.handleTestSelected(firstIncompleteTest);
        } else {
          console.log('All tests are completed');
          // Optionally, handle the case where all tests are completed
        }
      } catch (error) {
        console.error('Error parsing schedule data:', error);
      }
    }

  },
  beforeUnmount() {
    EventBus.$off('testSelected', this.handleTestSelected);
  },
  methods: {
    handleTestSelected(test) {
      const shortenedTestName = test.name
        .split(' ')             // Split the name by spaces into an array of words
        .map(word => word[0])    // Map each word to its first letter
        .join('')                // Join the letters to form the abbreviation
        .toUpperCase();
      this.selectedTestTitle = `Instruksi Test ${shortenedTestName}`;
      this.selectedTestDescription = test.description;
      this.url = test.testUrl;
    },
  },
};
</script>

<style scoped>
/* Add any additional styles here if needed */
</style>