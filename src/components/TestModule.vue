<template>
  <div class="flex-1 overflow-auto">
    <div class="flex justify-center px-4">
      <!-- Centered content -->
      <div class="w-[125%]">
        <!-- Slide container -->
        <div class="relative">
          <!-- Image container without any padding or background -->
          <template v-if="selectedTestTitle !== 'Ujian anda telah selesai'">
            <div class="flex justify-center">
              <img :src="`${slidesPath}/${currentSlide + 1}.png`" alt="Slide" class="w-full"
                @error="handleImageError" />
            </div>

            <!-- Navigation Controls -->
            <div class="flex justify-between items-center mt-4 px-4">
              <button @click="previousSlide" :disabled="currentSlide === 0"
                class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full disabled:opacity-50">
                Sebelumnya
              </button>
              <span class="text-lg">{{ currentSlide + 1 }}</span>
              <button @click="nextSlide" v-if="currentSlide !== totalSlides - 1"
                class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full disabled:opacity-50">
                Selanjutnya
              </button>
              <router-link :to="url" class="block" v-if="currentSlide === totalSlides - 1">
                <div class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full disabled:opacity-50">
                  Mulai Latihan Test
                </div>
              </router-link>
            </div>
          </template>
          <template v-else>
            <div class="text-center py-8">
              <h2 class="text-xl font-bold mb-4">{{ selectedTestTitle }}</h2>
              <p class="text-gray-600">{{ selectedTestDescription }}</p>
            </div>
          </template>
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
      url: '',
      slidesPath: '/instructions_slides',
      currentSlide: 0,
      totalSlides: 10,
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
          this.handleTestCompleted();
          console.log('All tests are completed');
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
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
      this.selectedTestTitle = `Instruksi Test ${shortenedTestName}`;
      this.selectedTestDescription = test.description;
      this.url = test.testUrl;
      this.slidesPath = `/instructions_slides/${test.name}`;
      let totalSlides = 3
      if (test.name == "Multi Monitoring Test" || test.name == "Multitasking With Color") {
        totalSlides = 6
      } else if (test.name == "Multitasking Mix With Call Sign" || test.name == "Multitasking With Instrument") {
        totalSlides = 7
      } else if (test.name == "PMA Test") {
        totalSlides = 9
      } else if (test.name == 'Test For Operative Multitasking' || test.name == 'Time Sharing Test 2023') {
        totalSlides = 6
      }
      this.totalSlides = totalSlides;
    },
    handleTestCompleted() {
      this.selectedTestTitle = 'Ujian anda telah selesai';
      this.selectedTestDescription = 'Terimakasih atas partisipasinya, anda dapat meninggalkan ruangan';
      this.totalSlides = 0;
    },
    scanInstructionsSlides(slidesPath) {
      const slides = require.context(slidesPath, false, /\.(png|jpe?g|svg)$/);
      return slides.keys().length;
    },
    nextSlide() {
      if (this.currentSlide < this.totalSlides - 1) {
        this.currentSlide++;
      }
    },
    previousSlide() {
      if (this.currentSlide > 0) {
        this.currentSlide--;
      }
    },
    handleImageError() {
      console.error(`Failed to load slide ${this.currentSlide + 1}`);
    }
  }
};
</script>

<style scoped>
/* Reset any default margins/padding */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Ensure images don't have any default spacing */
img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* Disable button styles */
button:disabled {
  cursor: not-allowed;
}
</style>