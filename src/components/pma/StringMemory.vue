<template>
    <div class="string-memorization">
      <div v-if="showString" class="string-display">{{ currentString }}</div>
      <div v-else-if="showOptions" class="options">
        <button v-for="option in options" :key="option" @click="selectOption(option)">{{ option }}</button>
      </div>
      <div v-else class="result">
        {{ correct ? "Correct!" : "Incorrect" }}
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  
  export default {
    name: 'StringMemorization',
    emits: ['update-score'],
    setup(props, { emit }) {
      const showString = ref(true);
      const showOptions = ref(false);
      const currentString = ref('');
      const options = ref([]);
      const correct = ref(false);
      const score = ref(0);
  
      const generateString = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array(8).fill().map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
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
          const correctOption = currentString.value.substr(Math.floor(Math.random() * 5), 4);
          options.value = generateOptions(correctOption);
          showOptions.value = true;
        }, 5000); // Show string for 5 seconds
      };
  
      const selectOption = (option) => {
        showOptions.value = false;
        correct.value = currentString.value.includes(option);
        if (correct.value) score.value++;
        emit('update-score', score.value);
        setTimeout(startTest, 2000); // Start next round after 2 seconds
      };
  
      onMounted(startTest);
  
      return {
        showString,
        showOptions,
        currentString,
        options,
        correct,
        selectOption
      };
    }
  };
  </script>
  
  <style scoped>
  .string-memorization {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
  }
  
  .string-display {
    font-size: 2em;
    margin-bottom: 20px;
  }
  
  .options {
    display: flex;
    gap: 10px;
  }
  
  .options button {
    padding: 10px 20px;
    font-size: 1em;
    cursor: pointer;
  }
  
  .result {
    font-size: 1.5em;
    margin-top: 20px;
  }
  </style>