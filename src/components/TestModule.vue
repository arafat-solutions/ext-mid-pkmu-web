<template>
  <div class="flex-1 overflow-auto min-h-screen">
    <div class="flex gap-8 px-4 py-4">
      <!-- Left side - Slide viewer -->
      <div class="w-2/3">
        <!-- Slide container with minimum height -->
        <div class="relative min-h-[800px] flex flex-col">
          <!-- Image container with flex-grow to take available space -->
          <div class="flex-grow flex justify-center items-start mb-8">
            <img 
              :src="`${slidesPath}/${currentSlide + 1}.png`" 
              alt="Slide" 
              class="w-full h-auto"
              @error="handleImageError"
            />
          </div>
          
          <!-- Navigation Controls - positioned at bottom -->
          <div class="flex justify-between items-center mt-auto px-4">
            <button 
              @click="previousSlide" 
              :disabled="currentSlide === 0"
              class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full disabled:opacity-50">
              Sebelumnya
            </button>
            <span class="text-lg">{{ currentSlide + 1 }}</span>
            <button 
              @click="nextSlide" 
              :disabled="currentSlide === totalSlides - 1"
              class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full disabled:opacity-50">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      <!-- Right side - Start Test Button -->
      <div class="w-1/3">
        <div v-if="url" class="sticky top-4">
          <router-link :to="url" class="block">
            <div class="bg-[#ade5bd] px-4 py-4 rounded-xl border-2 border-[#4ae46e]">
              <div class="flex items-center mb-4">
                <span class="text-[#4ae46e] mr-2 text-2xl">🔆</span>
                <h2 class="text-lg font-bold">Mulai Test</h2>
              </div>
              <p class="mb-4 text-[#207c43] font-extralight">Mulai Test Jika sudah siap.</p>
              <div class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full text-center">
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
      this.totalSlides = this.scanInstructionsSlides(this.slidesPath);
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

/* Add some space for the content */
.flex-1 {
  min-height: 100vh;
}

/* Disable button styles */
button:disabled {
  cursor: not-allowed;
}
</style>