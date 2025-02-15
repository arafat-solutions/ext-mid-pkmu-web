<template>
  <div class="math-test-container">
    <div class="instructions" v-if="!isTrainingMode">Press 'Space bar' to switch tasks</div>
    <div v-if="showQuestion" class="question">{{ currentQuestion }}</div>
    <div v-else class="waiting">Waiting for next question...</div>
    <input v-model="userInput" class="input-box" readonly :disabled="!showQuestion" />
    <div class="virtual-keyboard">
      <button v-for="num in 10" :key="num" @click="appendNumber(num % 10)" :disabled="!showQuestion">{{ num % 10
        }}</button>
      <button @click="clearInput" :disabled="!showQuestion">Hapus</button>
      <button @click="submitAnswer" :disabled="!showQuestion">Kirim</button>
    </div>
    <p v-if="answerIsRight === true" class="text-green-500 text-2xl">Benar!</p>
    <p v-else-if="answerIsRight === false" class="text-red-500 text-2xl">Salah!</p>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';

export default {
  name: 'MathTest',
  emits: ['switch-task', 'question-result', 'test-finished'],
  props: {
    config: {
      type: Object,
      default: () => ({})
    },
    isTrainingMode: {
      type: Boolean,
      default: false
    },
    isCombined: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const userInput = ref('');
    const currentQuestion = ref('');
    const questionTimeShown = ref(null);
    const correctAnswer = ref(null);
    const showQuestion = ref(true);
    const operations = ['+', '-', '*', '/'];
    const config = {
      frequency: props.config.arithmetics.frequency, // medium
      complexity: props.config.arithmetics.complexity, // medium
      output: props.config.arithmetics.output, // auditory_and_visual
    };
    const answerIsRight = ref(null)

    const getIntervalTime = () => {
      switch (config.frequency) {
        case 'very_seldom': return 20000; // 20 seconds
        case 'seldom': return 15000; // 15 seconds
        case 'medium': return 10000; // 10 seconds
        case 'often': return 5000; // 5 seconds
        case 'very_often': return 2000; // 2 seconds
        default: return 10000; // Default to 10 seconds
      }
    };

    const generateNumbers = (complexity) => {
      let num1, num2;
      switch (complexity) {
        case 'very_slow':
          num1 = Math.floor(Math.random() * 5) + 1;
          num2 = Math.floor(Math.random() * 5) + 1;
          break;
        case 'easy':
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
        case 'medium':
          num1 = Math.floor(Math.random() * 20) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
        case 'high':
          num1 = Math.floor(Math.random() * 50) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
        case 'hard':
          num1 = Math.floor(Math.random() * 100) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
      }
      return [num1, num2];
    };

    const generateQuestion = () => {
      let operation, num1, num2;
      let operationSpoken = ''

      do {
        operation = operations[Math.floor(Math.random() * operations.length)];
        [num1, num2] = generateNumbers(config.complexity);

        // Ensure num1 is always greater than or equal to num2 for subtraction and division
        if (operation === '-' || operation === '/') {
          [num1, num2] = [Math.max(num1, num2), Math.min(num1, num2)];
        }

        // For division, ensure the result is a whole number
        if (operation === '/') {
          num1 = num2 * Math.floor(num1 / num2);
        }

        // Calculate the result
        switch (operation) {
          case '+':
            correctAnswer.value = num1 + num2;
            operationSpoken = 'tambah';
            break;
          case '-':
            correctAnswer.value = num1 - num2;
            operationSpoken = 'kurang';
            break;
          case '*':
            correctAnswer.value = num1 * num2;
            operationSpoken = 'kali';
            break;
          case '/':
            correctAnswer.value = num1 / num2;
            operationSpoken = 'bagi';
            break;
        }
      } while (correctAnswer.value < 0 || correctAnswer.value % 1 !== 0);

      const question = `${num1} ${operationSpoken} ${num2}`;
      currentQuestion.value = question;

      if (config.output === 'sound' || config.output === 'sound_and_visual') {
        speakQuestion(question);
      }

      if (config.output === 'visual' || config.output === 'sound_and_visual') {
        currentQuestion.value = question;
      } else {
        currentQuestion.value = 'Dengarkan pertanyaan';
      }

      showQuestion.value = true;
      questionTimeShown.value = Date.now();
    };

    const speakQuestion = (question) => {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = 'id-ID';
      speechSynthesis.speak(utterance);
    };

    const appendNumber = (num) => {
      userInput.value += num;
    };

    const clearInput = () => {
      userInput.value = '';
    };

    const submitAnswer = () => {
      const userAnswer = parseInt(userInput.value, 10);
      const responseTime = Date.now() - questionTimeShown.value;
      const result = {
        question: currentQuestion.value,
        userAnswer,
        correctAnswer: correctAnswer.value,
        isCorrect: userAnswer === correctAnswer.value,
        responseTime
      };
      setAnswerIsRight(userAnswer)
      questionTimeShown.value = null;
      emit('question-result', result);
      userInput.value = '';
      showQuestion.value = false;

      // Set interval for next question
      setTimeout(() => {
        generateQuestion();
      }, getIntervalTime());
    };

    const setAnswerIsRight = (userAnswer) => {
      answerIsRight.value = userAnswer === correctAnswer.value
      setTimeout(() => { answerIsRight.value = null }, 4000)
    }

    const handleKeydown = (event) => {
      if (event.key === ' ' ) {
        emit('switch-task');
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown);
      generateQuestion();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown);
      if (props.isTrainingMode && props.isCombined) {
        emit('test-finished');
      }
    });

    return {
      userInput,
      currentQuestion,
      showQuestion,
      appendNumber,
      clearInput,
      submitAnswer,
      answerIsRight
    };
  }
};
</script>

<style scoped>
.math-test-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* background-color: red; */
  padding-top: 3rem
}

.instructions,
.question,
.waiting {
  margin-bottom: 20px;
}

.input-box {
  font-size: 24px;
  padding: 10px;
  margin-bottom: 20px;
  width: 200px;
  text-align: right;
}

.virtual-keyboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.virtual-keyboard button {
  font-size: 20px;
  padding: 10px;
  width: 60px;
  height: 60px;
}
</style>