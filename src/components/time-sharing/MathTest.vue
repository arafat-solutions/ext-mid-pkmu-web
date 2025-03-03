<template>
  <div class="math-test-container">
    <div class="instructions" v-if="!isTrainingMode">
      Tekan 'Spasi' untuk beralih tugas
    </div>
    <div v-if="showQuestion" class="question">{{ displayQuestion }}</div>
    <div v-else class="waiting">Menunggu pertanyaan selanjutnya...</div>
    <input v-model="userInput" class="input-box" readonly :disabled="!showQuestion" />
    <div class="virtual-keyboard">
      <button v-for="num in 10" :key="num" @click="appendNumber(num % 10)" :disabled="!showQuestion">
        {{ num % 10 }}
      </button>
      <button @click="clearInput" :disabled="!showQuestion">Hapus</button>
      <button @click="submitAnswer" :disabled="!showQuestion">Kirim</button>
    </div>
    <template v-if="isTrainingMode">
      <p v-if="answerIsRight === true" class="text-green-500 text-2xl">
        Benar!
      </p>
      <p v-else-if="answerIsRight === false" class="text-red-500 text-2xl">
        Salah!
      </p>
    </template>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";

export default {
  name: "MathTest",
  emits: ["switch-task", "question-result", "test-finished"],
  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
    isTrainingMode: {
      type: Boolean,
      default: false,
    },
    isCombined: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const userInput = ref("");
    const currentQuestion = ref("");
    const displayQuestion = ref("");
    const questionTimeShown = ref(null);
    const correctAnswer = ref(null);
    const showQuestion = ref(true);
    const answerIsRight = ref(null);
    const operations = ["+", "-", "*", "/"];
    let questionInterval = null; // Store the interval reference

    const config = {
      frequency: props.config.arithmetics.frequency,
      complexity: props.config.arithmetics.complexity,
      output: props.config.arithmetics.output,
    };

    const generateNumbers = (complexity) => {
      let num1, num2;
      switch (complexity) {
        case "very_slow":
          num1 = Math.floor(Math.random() * 5) + 1;
          num2 = Math.floor(Math.random() * 5) + 1;
          break;
        case "easy":
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
        case "medium":
          num1 = Math.floor(Math.random() * 20) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
        case "high":
          num1 = Math.floor(Math.random() * 50) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
        case "hard":
          num1 = Math.floor(Math.random() * 100) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
          break;
      }
      return [num1, num2];
    };

    const generateQuestion = () => {
      let operation,
        num1,
        num2,
        operationSpoken = "";

      do {
        operation = operations[Math.floor(Math.random() * operations.length)];
        [num1, num2] = generateNumbers(config.complexity);
        if (operation === "-" || operation === "/")
          [num1, num2] = [Math.max(num1, num2), Math.min(num1, num2)];
        if (operation === "/") num1 = num2 * Math.floor(num1 / num2);

        switch (operation) {
          case "+":
            correctAnswer.value = num1 + num2;
            operationSpoken = "tambah";
            break;
          case "-":
            correctAnswer.value = num1 - num2;
            operationSpoken = "kurang";
            break;
          case "*":
            correctAnswer.value = num1 * num2;
            operationSpoken = "kali";
            break;
          case "/":
            correctAnswer.value = num1 / num2;
            operationSpoken = "bagi";
            break;
        }
      } while (correctAnswer.value < 0 || correctAnswer.value % 1 !== 0);

      const question = `${num1} ${operationSpoken} ${num2}`;
      displayQuestion.value = `${num1} ${operation} ${num2}`;
      currentQuestion.value =
        config.output === "visual" || config.output === "sound_and_visual"
          ? question
          : "Dengarkan pertanyaan";
      showQuestion.value = true;
      questionTimeShown.value = Date.now();

      if (config.output === "sound" || config.output === "sound_and_visual")
        speakQuestion(question);
    };

    const speakQuestion = (question) => {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = "id-ID";
      speechSynthesis.speak(utterance);
    };

    const appendNumber = (num) => (userInput.value += num);
    const clearInput = () => (userInput.value = "");

    const submitAnswer = () => {
      const userAnswer = parseInt(userInput.value, 10);
      const responseTime = Date.now() - questionTimeShown.value;
      emit("question-result", {
        question: currentQuestion.value,
        userAnswer,
        correctAnswer: correctAnswer.value,
        isCorrect: userAnswer === correctAnswer.value,
        responseTime,
      });
      setAnswerIsRight(userAnswer);
      userInput.value = "";
      showQuestion.value = false;
    };

    const setAnswerIsRight = (userAnswer) => {
      answerIsRight.value = userAnswer === correctAnswer.value;
      setTimeout(() => {
        answerIsRight.value = null;
      }, 4000);
    };

    const handleKeydown = (event) => {
      if (event.key === " ") emit("switch-task");
    };

    onMounted(() => {
      window.addEventListener("keydown", handleKeydown);
      generateQuestion();
      questionInterval = setInterval(generateQuestion, 10000); // Set interval to generate a new question every 10 seconds
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleKeydown);
      clearInterval(questionInterval); // Clear the interval when component unmounts
      if (props.isTrainingMode && props.isCombined) emit("test-finished");
    });

    return {
      userInput,
      currentQuestion,
      displayQuestion,
      showQuestion,
      appendNumber,
      clearInput,
      submitAnswer,
      answerIsRight,
    };
  },
};
</script>

<style scoped>
.input-box {
  font-size: 24px;
  padding: 12px;
  width: 100%;
  max-width: 320px;
  text-align: left;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  min-height: 56px;
}

.virtual-keyboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  max-width: 320px;
}

.virtual-keyboard button {
  font-size: 20px;
  padding: 16px;
  background-color: #475569;
  color: white;
  border: none;
  border-radius: 6px;
  height: 56px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.math-test-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.virtual-keyboard button:hover {
  background-color: #2d3748;
}

.virtual-keyboard button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}
</style>
