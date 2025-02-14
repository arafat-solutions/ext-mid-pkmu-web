<template>
  <div class="string-memorization">
    <div v-if="showString" class="string-display">{{ currentString }}</div>
    <div v-else-if="showOptions" class="options">
      <button
        v-for="option in options"
        :key="option"
        @click="selectOption(option)"
        class="option-button"
      >
        {{ option }}
      </button>
    </div>
    <div v-else class="result">
      <P v-if="!isActualTest">{{
        correct
          ? "Benar, jawaban yang anda pilih ADA pada soal"
          : "Salah, jawaban yang anda pilih TIDAK ADA pada soal atau anda kehabisan waktu untuk menjawab"
      }}</P>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";

export default {
  name: "StringMemorization",
  props: {
    isActualTest: Boolean,
  },
  emits: ["update-score"],
  setup(props, { emit }) {
    const showString = ref(true);
    const showOptions = ref(false);
    const currentString = ref("");
    const options = ref([]);
    const correct = ref(false);
    const score = ref(0);
    let timeoutId = null;

    const generateString = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return Array(8)
        .fill()
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
    };

    const generateOptions = (correctOption) => {
      const allOptions = [correctOption];
      while (allOptions.length < 4) {
        const newOption = generateString().substr(0, 4);
        if (!allOptions.includes(newOption)) {
          allOptions.push(newOption);
        }
      }
      return allOptions.sort(() => Math.random() - 0.5);
    };

    const startTest = () => {
      currentString.value = generateString();
      showString.value = true;
      setTimeout(() => {
        showString.value = false;
        const correctOption = currentString.value.substr(
          Math.floor(Math.random() * 5),
          4
        );
        options.value = generateOptions(correctOption);
        showOptions.value = true;

        // Start a 10-second timer to trigger the next question if no option is selected
        timeoutId = setTimeout(() => {
          // Automatically trigger next question if no option is selected within 10 seconds
          showOptions.value = false;
          correct.value = false;
          nextQuestion();
        }, 10000); // 10 seconds
      }, 5000); // Show string for 5 seconds
    };

    const selectOption = (option) => {
      clearTimeout(timeoutId); // Clear the timeout if an option is selected
      showOptions.value = false;
      correct.value = currentString.value.includes(option);
      if (correct.value) score.value++;
      emit("update-score", score.value);
      setTimeout(startTest, 2000); // Start next round after 2 seconds
    };

    const nextQuestion = () => {
      correct.value = false;
      showOptions.value = false; // Hide the options
      setTimeout(startTest, 2000); // Start the next round after a brief delay
    };

    onMounted(startTest);

    return {
      showString,
      showOptions,
      currentString,
      options,
      correct,
      selectOption,
    };
  },
};
</script>

<style scoped>
.string-memorization {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.string-display {
  font-size: 2em;
  margin-bottom: 20px;
  text-align: center;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
}

.options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.option-button {
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  background-color: #ffffff;
  color: #333333;
  border: 2px solid #4caf50;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.option-button:hover {
  background-color: #4caf50;
  color: white;
}

.result {
  font-size: 1.5em;
  margin-top: 20px;
  font-weight: bold;
}
</style>
