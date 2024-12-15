<template>
  <div class="flex-1 p-8 overflow-auto">
    <div class="flex gap-8">
      <div class="w-2/3 bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <!-- <h1 class="text-2xl font-bold justify-center">{{ selectedTestTitle }}</h1> -->
        </div>
        
        <!-- PPTX Viewer -->
        <div class="mb-6 relative">
          <div class="aspect-[16/9] bg-gray-100 rounded-lg p-8">
            <img 
              :src="`${slidesPath}/${currentSlide + 1}.png`" 
              alt="Slide" 
              class="w-full h-full object-contain"
              @error="handleImageError"
            />
          </div>
          
          <!-- Navigation Controls -->
          <div class="flex justify-between mt-4">
            <button 
              @click="previousSlide" 
              :disabled="currentSlide === 0"
              class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full">
              Sebelumnya
            </button>
            <span class="flex items-center">{{ currentSlide + 1 }}</span>
            <button 
              @click="nextSlide" 
              :disabled="currentSlide === totalSlides - 1"
              class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-4 py-2 rounded-full">
              Selanjutnya
            </button>
          </div>
        </div>

        <!-- Additional instructions if needed -->
        <!-- <div v-html="selectedTestDescription"></div> -->
      </div>

      <div class="w-1/3 bg-white p-6 h-fit shadow-lg rounded-xl">
        <div v-if="url">
          <router-link :to="url" class="block">
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
      url: '',
      slidesPath: `/instructions_slides/`,
      currentSlide: 0,
      totalSlides: 10, // Set this to your actual number of slides
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
      this.slidesPath = `/instructions_slides/${test.name}/`;
      this.totalSlides = this.scanInstructionsSlides(this.slidesPath);
      
    },
    scanInstructionsSlides(slidesPath) {
      // scan dir slidespath
      // return number of slides
      const slides = require.context(slidesPath, false, /\.(png|jpe?g|svg)$/);
      console.log('Slides:', slides ); // not working
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
      // You could implement fallback behavior here
    }
  }
};
</script>

<style scoped>
.aspect-\[16\/9\] {
  aspect-ratio: 16/9;
}
</style>