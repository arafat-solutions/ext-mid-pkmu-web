<template>
    <div class="information-ordering">
      <div class="shape">
        <svg v-if="currentShape === 'star'" viewBox="0 0 24 24" width="100" height="100">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#FFD700"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="100" height="100">
          <polygon points="12 2 22 22 2 22" fill="#4CAF50"/>
        </svg>
      </div>
      <div class="options">
        <button v-for="option in shuffledOptions" :key="option.value" @click="selectOption(option)">
          {{ option.value }}
        </button>
      </div>
      <div v-if="showResult" class="result">
        {{ allCorrect ? "Correct ordering!" : "Incorrect ordering" }}
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue';
  
  export default {
    name: 'InformationOrdering',
    emits: ['update-score'],
    setup(props, { emit }) {
      const currentShape = ref('star');
      const options = ref([]);
      const selectedOptions = ref([]);
      const showResult = ref(false);
      const allCorrect = ref(false);
      const score = ref(0);
  
      const shuffledOptions = computed(() => {
        return [...options.value].sort(() => Math.random() - 0.5);
      });
  
      const generateOptions = () => {
        const values = [];
        while (values.length < 4) {
          const num = Math.floor(Math.random() * 40) - 20; // Random number between -20 and 20
          if (!values.includes(num)) {
            values.push(num);
          }
        }
        return values.map(value => ({ value, selected: false }));
      };
  
      const selectOption = (option) => {
        if (!option.selected) {
          option.selected = true;
          selectedOptions.value.push(option);
          if (selectedOptions.value.length === 4) {
            checkOrder();
          }
        }
      };
  
      const checkOrder = () => {
        const orderedValues = selectedOptions.value.map(o => o.value);
        const correctOrder = currentShape.value === 'star' 
          ? orderedValues.slice().sort((a, b) => a - b)
          : orderedValues.slice().sort((a, b) => b - a);
        
        allCorrect.value = JSON.stringify(orderedValues) === JSON.stringify(correctOrder);
        if (allCorrect.value) score.value++;
        emit('update-score', score.value);
        showResult.value = true;
  
        setTimeout(startNewRound, 2000);
      };
  
      const startNewRound = () => {
        currentShape.value = Math.random() < 0.5 ? 'star' : 'triangle';
        options.value = generateOptions();
        selectedOptions.value = [];
        showResult.value = false;
      };
  
      onMounted(startNewRound);
  
      return {
        currentShape,
        shuffledOptions,
        selectOption,
        showResult,
        allCorrect
      };
    }
  };
  </script>
  
  <style scoped>
  .information-ordering {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
  }
  
  .shape {
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