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
    <div class="instruction">
      {{ currentShape === 'star' ? 'Select the smallest then the largest number' : 'Select the largest then the smallest number' }}
    </div>
    <div class="options">
      <button 
        v-for="option in shuffledOptions" 
        :key="option.value" 
        @click="selectOption(option)"
        :class="{ selected: option.selected, disabled: selectedOptions.length === 2 && !option.selected }"
        :disabled="selectedOptions.length === 2 && !option.selected"
      >
        {{ option.value }}
      </button>
    </div>
    <div v-if="showResult" class="result">
      {{ allCorrect ? "Correct!" : "Incorrect" }}
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
      if (!option.selected && selectedOptions.value.length < 2) {
        option.selected = true;
        selectedOptions.value.push(option);
        if (selectedOptions.value.length === 2) {
          checkOrder();
        }
      }
    };

    const checkOrder = () => {
      const [first, second] = selectedOptions.value.map(o => o.value);
      const values = options.value.map(o => o.value);
      const min = Math.min(...values);
      const max = Math.max(...values);

      if (currentShape.value === 'star') {
        allCorrect.value = first === min && second === max;
      } else {
        allCorrect.value = first === max && second === min;
      }

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
      allCorrect,
      selectedOptions
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

.instruction {
  margin-bottom: 15px;
  font-weight: bold;
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

.options button.selected {
  background-color: #4CAF50;
  color: white;
}

.options button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result {
  font-size: 1.5em;
  margin-top: 20px;
}
</style>