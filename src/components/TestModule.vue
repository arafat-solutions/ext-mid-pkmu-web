<template>
  <div class="flex-1 overflow-auto">
    <div class="flex justify-center px-6">
      <!-- Centered content -->
      <div class="w-[135%]">
        <!-- Slide container -->
        <div class="relative">
          <!-- Image container without any padding or background -->
          <template v-if="selectedTestTitle !== 'Test anda telah selesai'">
            <div class="flex justify-center">
              <div class="w-full p-6 bg-white rounded-lg shadow">
                <p
                  class="text-3xl text-left"
                  v-html="selectedTestDescription[currentSlide]"
                ></p>
              </div>
            </div>

            <!-- Navigation Controls -->
            <div class="flex justify-between items-center mt-16 px-6">
              <button
                @click="previousSlide"
                :disabled="currentSlide === 0"
                v-if="currentSlide > 0"
                class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-5 py-2.5 rounded-full disabled:opacity-50 text-lg"
              >
                Sebelumnya
              </button>
              <div v-else></div>
              <span class="text-xl"
                >{{ currentSlide + 1 }} / {{ totalSlides }}</span
              >
              <button
                @click="nextSlide"
                v-if="currentSlide !== totalSlides - 1"
                class="bg-[#ade5bd] border-2 border-[#4ae46e] text-[#207c43] px-5 py-2.5 rounded-full disabled:opacity-50 text-lg"
              >
                Selanjutnya
              </button>
              <router-link
                :to="url"
                class="block"
                v-if="currentSlide === totalSlides - 1"
              >
                <div
                  class="bg-[#f5d442] border-2 border-[#f5d442] text-[#000000] px-5 py-2.5 rounded-full disabled:opacity-50 text-lg"
                >
                  Mulai Latihan Test
                </div>
              </router-link>
            </div>
          </template>
          <template v-else>
            <div class="text-center py-10">
              <h2 class="text-2xl font-bold mb-5">{{ selectedTestTitle }}</h2>
              <p class="text-gray-600 text-lg">{{ selectedTestDescription }}</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EventBus from "@/eventBus";
import { patchWorkstation } from "@/utils/fetch";

export default {
  name: "TestModule",
  data() {
    return {
      selectedTestTitle: "Test anda telah selesai",
      realName: "",
      selectedTestDescription:
        "Terimakasih atas partisipasinya, anda dapat meninggalkan ruangan",
      url: "",
      slidesPath: "/instructions_slides",
      currentSlide: 0,
      totalSlides: 1,
    };
  },
  created() {
    const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
    if (scheduleData) {
      try {
        const firstIncompleteTest = scheduleData.tests.find(
          (test) => !test.completed
        );
        if (firstIncompleteTest) {
          console.log("Next test:", firstIncompleteTest);
          this.handleTestSelected(firstIncompleteTest);
        } else {
          this.handleTestCompleted();
          console.log("All tests are completed");
        }
      } catch (error) {
        console.error("Error parsing schedule data:", error);
      }
    }
  },
  beforeUnmount() {
    EventBus.$off("testSelected", this.handleTestSelected);
  },
  methods: {
    handleTestSelected(test) {
      const shortenedTestName = test.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
      this.selectedTestTitle = `Instruksi Test ${shortenedTestName}`;
      this.realName = test.name;
      this.url = test.testUrl;
      this.slidesPath = `/instructions_slides/${test.name}`;

      this.selectedTestDescription = test.description.split("=====");
      this.totalSlides = this.selectedTestDescription.length;

      const updatePayload = {
        status: "IN_INSTRUCTION",
        name: this.realName,
      };

      patchWorkstation(updatePayload);
    },
    handleTestCompleted() {
      this.selectedTestTitle = "Test anda telah selesai";
      this.realName = "";
      this.selectedTestDescription =
        "Terimakasih atas partisipasinya, anda dapat meninggalkan ruangan";
      this.totalSlides = 0;
      const updatePayload = {
        status: "FINISHED",
        name: "FINISHED",
      };

      patchWorkstation(updatePayload);
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
    },
  },
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
