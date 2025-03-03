<template>
  <div>
    <!-- Training Confirmation Modal -->
    <modal v-if="showTrainingModal" @close="startTraining">
      <div class="p-6 max-w-2xl w-full mx-auto bg-white rounded-lg">
        <h2
          class="text-2xl font-bold mb-4 text-gray-800"
          style="font-size: 24px"
        >
          Latihan
        </h2>

        <div class="mb-6">
          <p class="text-lg text-gray-700 mb-4" style="font-size: 20px">
            Pada latihan ini, Anda diminta untuk
            <b>MENCOCOKKAN SIMBOL TERSEMBUNYI</b> dalam pola abstrak dengan
            jawaban yang tersedia dengan <b>MENYENTUH LAYAR</b> pada jawaban
            yang tersedia.
          </p>
          <img src="devices/sr.png" />

          <!-- <h3 class="text-xl font-semibold mb-3 text-gray-800">Basic Instructions:</h3>
                    <ul class="space-y-2 list-disc pl-6 text-gray-700">
                        <li class="mb-2">
                            <strong>Langkah 1:</strong> Cermati bentuk yang ada di layar
                        </li>
                        <li class="mb-2">
                            <strong>Langkah 2:</strong> Pilih opsi yang sesuai dengan object yang muncul pada opsi yang
                            tersedia
                        </li>
                        <li class="mb-2">
                            <strong>Langkah 3:</strong> Jawab dengan cepat dan tepat
                        </li>
                    </ul> -->
        </div>

        <div class="flex justify-center items-center mt-8 pt-4">
          <button
            @click="startTraining"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Mulai Latihan
          </button>
        </div>
      </div>
    </modal>

    <!-- Test Confirmation Modal -->
    <modal v-if="showTestModal" @close="startTest">
      <div class="p-6 max-w-2xl w-full mx-auto bg-white rounded-lg">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">Mulai tes</h2>

        <div class="space-y-4 mb-6">
          <p class="text-lg text-gray-700">
            Kamu sudah menyelesaikan latihan. Sekarang, kamu akan memulai tes.
            <span class="font-semibold">
              Test ini akan berlangsung selama
              {{ currentConfig.timePerQuestion }} detik per soal.
            </span>
          </p>

          <div class="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p class="text-gray-700">Performa kamu akan diukur berdasarkan:</p>
            <ul class="mt-2 space-y-1 list-disc pl-6 text-gray-600">
              <li>Jumlah jawaban benar</li>
              <li>Jumlah jawaban salah</li>
              <li>Jumlah soal tidak terjawab</li>
              <li>Rata-rata waktu respon</li>
            </ul>
          </div>
        </div>

        <div class="flex justify-center mt-6">
          <button
            @click="startTest"
            class="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Mulai tes
          </button>
        </div>
      </div>
    </modal>

    <!-- Main game component -->
    <div
      v-if="gameState !== 'idle'"
      class="w-full h-full max-w-[1200px] mx-auto relative flex flex-col items-center justify-center max-h-[1000px]"
    >
      <canvas
        id="shapeCanvas"
        ref="shapeCanvas"
        width="500"
        height="300"
        class="border-[1px] border-black mt-[8%] mx-auto"
      ></canvas>

      <div class="w-[80%] flex items-center justify-between mx-auto mt-[40px]">
        <div
          class="button-container"
          v-for="(shape, index) in shapes.slice(0, 5)"
          :key="index"
        >
          <canvas
            :ref="(el) => (buttonCanvases[index] = el)"
            width="200"
            height="100"
          ></canvas>
          <button
            @click="checkAnswer(index)"
            class="answer-button"
            :class="{
              correct:
                gameState === 'training' &&
                feedbackState?.show &&
                ((feedbackState.selectedIndex === index &&
                  feedbackState.isCorrect) ||
                  (feedbackState.correctIndex === index &&
                    !feedbackState.isCorrect)),
              incorrect:
                gameState === 'training' &&
                feedbackState?.show &&
                feedbackState.selectedIndex === index &&
                !feedbackState.isCorrect,
              selected:
                gameState === 'test' &&
                feedbackState?.show &&
                feedbackState.selectedIndex === index,
            }"
          >
            {{ ["A", "B", "C", "D", "E"][index] }}
            <div
              v-if="feedbackState?.show"
              class="button-highlight"
              :class="{
                correct:
                  feedbackState.correctIndex === index &&
                  gameState === 'training',
                incorrect:
                  gameState === 'training' &&
                  feedbackState.selectedIndex === index &&
                  !feedbackState.isCorrect,
              }"
            ></div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loadingContainer">
      <div class="spinner"></div>
      <p class="loadingText">Your result is submitting...</p>
    </div>

    <div class="timer" v-if="gameState === 'test'">
      <p>Soal: {{ currentQuestion }} / {{ totalQuestion }}</p>
      <!-- <p v-if="gameState !== 'training'">Time left: {{ questionCountdown }}s</p> -->
    </div>
  </div>
  <button
    v-if="gameState === 'training'"
    @click="endTraining"
    class="finish-button"
  >
    Selesai Latihan
  </button>
</template>

<script>
import { ref, onMounted, nextTick, watch, onUnmounted } from "vue";
import {
  completeTrainingTestAndUpdateLocalStorage,
  removeTestByNameAndUpdateLocalStorage,
} from "@/utils/index";
import { useRouter } from "vue-router";
import Modal from "./shape-recognition/ModalConfirmation.vue";

export default {
  name: "ShapeRecognition",
  components: {
    Modal,
  },
  setup() {
    const router = useRouter();

    const shapeCanvas = ref(null);
    const buttonCanvases = ref([]);
    const correctShapeIndex = ref(0);
    const shapes = ref([]);
    const startTime = ref(null);
    const totalResponseTime = ref(0);
    const responseCount = ref(0);
    const questionCountdown = ref(0);
    const questionCountDownInterval = ref(null);
    const loading = ref(false);
    const currentQuestion = ref(1);
    const gameState = ref("idle"); // 'idle', 'training', 'test'
    const showTrainingModal = ref(true);
    const showTestModal = ref(false);
    const currentConfigIndex = ref(0);
    const currentConfig = ref({
      size: "",
      variation: 0,
      userId: "",
      sessionId: "",
      testId: "",
      timePerQuestion: 0,
      numberOfQuestion: 0,
    });

    const totalQuestion = ref(0);

    const config = ref({
      size: "",
      variation: 0,
      userId: "",
      sessionId: "",
      testId: "",
      timePerQuestion: 0,
      numberOfQuestion: 0,
    });

    const quizMetrics = ref({
      correctAnswer: 0,
      wrongAnswer: 0,
      unanswered: 0,
      avgResponseTime: 0, //in seconds
    });

    const STROKE_WIDTH = 2;
    const ANGLES = [0, Math.PI / 2, Math.PI, 2 * Math.PI];
    const refreshCount = ref(0);
    const userInputs = ref([]);

    const shapeGenerators = [
      generateOctagon,
      // generateStar,
      generateParallelogram,
      // generateLeftArrow,
      // generateH,
      // generatePlane,
      // generateReturnArrow,
      generateHexagon,
      // generateQuestionMark,
      generateChevronLeft,
      generateT,
      // generateHeart,
      // generateS,
      generateL,
      generateTriangle,
      //generateSquare,
      // generateCircle,
    ];

    function drawShape(ctx, shapeGenerator, canvasWidth, canvasHeight, angle) {
      ctx.save();
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.strokeStyle = "black";
      ctx.lineWidth = STROKE_WIDTH;
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      const scale = Math.min(canvasWidth, canvasHeight) * 0.7;
      ctx.scale(scale / 100, scale / 100);
      ctx.rotate(angle);
      ctx.beginPath();
      shapeGenerator(ctx);
      ctx.stroke();
      ctx.restore();
    }

    function drawInButtons(randomAngle) {
      buttonCanvases.value.forEach((canvas, index) => {
        if (canvas) {
          const ctx = canvas.getContext("2d");
          drawShape(
            ctx,
            shapes.value[index],
            canvas.width,
            canvas.height,
            randomAngle
          );
        }
      });
    }

    function drawInCenter(angle) {
      if (shapeCanvas.value) {
        const ctx = shapeCanvas.value.getContext("2d");
        ctx.clearRect(0, 0, shapeCanvas.value.width, shapeCanvas.value.height);

        // Only draw randomized shapes (including the correct one)
        drawRandomizedShapes(ctx, angle);
      }
    }

    function getScaleFactor(size) {
      switch (size) {
        case "very_small":
          return 0.5;
        case "small":
          return 0.75;
        case "normal":
          return 1;
        case "large":
          return 1.25;
        case "very_large":
          return 1.5;
        default:
          return 1;
      }
    }

    const feedbackState = ref({
      show: false,
      isCorrect: false,
      selectedIndex: null,
      correctIndex: null,
    });

    function checkAnswer(index) {
      if (feedbackState.value.show) return; // Prevent multiple answers

      const currentTime = Date.now();
      if (!startTime.value) {
        startTime.value = currentTime;
      }
      const elapsedTime = (currentTime - startTime.value) / 1000;
      totalResponseTime.value += elapsedTime;
      responseCount.value++;
      quizMetrics.value.avgResponseTime =
        totalResponseTime.value / responseCount.value;

      startTime.value = currentTime;

      // Show feedback
      feedbackState.value = {
        show: true,
        isCorrect: index === correctShapeIndex.value,
        selectedIndex: index,
        correctIndex: correctShapeIndex.value,
      };

      if (index === correctShapeIndex.value) {
        userInputs.value.push({
          type: "correct",
          responseTime: elapsedTime * 1000,
          timestamp: currentTime,
        });
        quizMetrics.value.correctAnswer++;
      } else {
        quizMetrics.value.wrongAnswer++;
        userInputs.value.push({
          type: "wrong",
          responseTime: elapsedTime * 1000,
          timestamp: currentTime,
        });
      }

      // Wait for the question timer before moving to next question
      setTimeout(() => {
        feedbackState.value.show = false;
        if (currentQuestion.value < currentConfig.value.numberOfQuestion) {
          currentQuestion.value++;
          drawQuestions();
        } else {
          if (gameState.value === "training") {
            endTraining();
          } else {
            submitResult();
          }
        }
      }, 1000);
    }

    function drawRandomizedShapes(ctx, randomAngle) {
      const canvasWidth = shapeCanvas.value.width;
      const canvasHeight = shapeCanvas.value.height;

      const scaleFactor = getScaleFactor(config.value.size);

      // Draw the correct shape first
      ctx.save();
      const correctX = Math.random() * (canvasWidth - 100) + 50;
      const correctY = Math.random() * (canvasHeight - 100) + 50;
      ctx.translate(correctX, correctY);
      ctx.rotate(randomAngle);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.lineWidth = STROKE_WIDTH;
      shapes.value[correctShapeIndex.value](ctx);
      ctx.stroke();
      ctx.restore();

      // draw random layer
      drawRandomLayer(ctx);
    }

    function settingDifficultyLayer(size) {
      switch (size) {
        case "very_small":
          return 0.2;
        case "small":
          return 0.4;
        case "normal":
          return 0.6;
        case "large":
          return 0.8;
        case "very_large":
          return 0.9;
        default:
          return 0.9;
      }
    }

    function drawGeometricPattern(ctx, canvasWidth, canvasHeight, size) {
      ctx.save();
      ctx.strokeStyle = "black";
      ctx.lineWidth = STROKE_WIDTH;

      // Adjust grid size based on difficulty
      const difficultyFactor = settingDifficultyLayer(size);
      const baseGridSize = 40;
      const gridSize = Math.floor(baseGridSize * (1 + (1 - difficultyFactor)));

      // Draw primary grid with adjusted density
      const lineSpacing = gridSize * difficultyFactor;

      // Draw vertical lines
      for (let x = 0; x <= canvasWidth; x += lineSpacing) {
        if (Math.random() > 1 - difficultyFactor) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasHeight);
          ctx.stroke();
        }
      }

      // Draw horizontal lines
      for (let y = 0; y <= canvasHeight; y += lineSpacing) {
        if (Math.random() > 1 - difficultyFactor) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasWidth, y);
          ctx.stroke();
        }
      }

      // Add diagonal lines with adjusted density
      for (let x = 0; x < canvasWidth; x += lineSpacing) {
        for (let y = 0; y < canvasHeight; y += lineSpacing) {
          if (Math.random() > 1 - difficultyFactor) {
            ctx.beginPath();
            if (Math.random() > 0.5) {
              ctx.moveTo(x, y);
              ctx.lineTo(x + lineSpacing, y + lineSpacing);
            } else {
              ctx.moveTo(x + lineSpacing, y);
              ctx.lineTo(x, y + lineSpacing);
            }
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }

    function drawRandomLayer(ctx) {
      const canvasWidth = shapeCanvas.value.width;
      const canvasHeight = shapeCanvas.value.height;

      ctx.save();
      drawGeometricPattern(ctx, canvasWidth, canvasHeight, config.value.size);
      ctx.restore();
    }

    function generateTriangle(ctx) {
      ctx.moveTo(0, -50);
      ctx.lineTo(43.3, 25);
      ctx.lineTo(-43.3, 25);
      ctx.closePath();
    }

    //function generateSquare(ctx) {
    //  ctx.rect(-35, -35, 70, 70);
    //}

    function generateOctagon(ctx) {
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = 40 * Math.cos(angle);
        const y = 40 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function generateParallelogram(ctx) {
      ctx.beginPath();
      ctx.moveTo(-40, -20);
      ctx.lineTo(20, -20);
      ctx.lineTo(40, 20);
      ctx.lineTo(-20, 20);
      ctx.closePath();
    }

    function generateHexagon(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = 35 * Math.cos(angle);
        const y = 35 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function generateChevronLeft(ctx) {
      ctx.save();
      ctx.scale(0.8, 0.8);

      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(-40, -50);
      ctx.lineTo(-40, -20);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-40, 20);
      ctx.lineTo(-40, 50);
      ctx.closePath();

      ctx.restore();
    }

    function generateL(ctx) {
      ctx.save();
      ctx.scale(0.8, 0.8);

      ctx.beginPath();
      ctx.moveTo(-40, 40);
      ctx.lineTo(20, 40);
      ctx.lineTo(20, 10);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-10, -40);
      ctx.lineTo(-40, -40);
      ctx.closePath();

      ctx.restore();
    }

    function generateT(ctx) {
      ctx.save();
      ctx.scale(0.6, 0.8);

      ctx.beginPath();
      ctx.moveTo(-60, 40);
      ctx.lineTo(60, 40);
      ctx.lineTo(60, 10);
      ctx.lineTo(20, 10);
      ctx.lineTo(20, -20);
      ctx.lineTo(-20, -20);
      ctx.lineTo(-20, 10);
      ctx.lineTo(-60, 10);
      ctx.closePath();

      ctx.restore();
    }

    function drawQuestions() {
      shapes.value = [...shapeGenerators]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      correctShapeIndex.value = Math.floor(Math.random() * shapes.value.length);

      const randomAngle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

      drawInButtons(randomAngle);
      drawInCenter(randomAngle);

      startQuestionCountdown();
    }

    function initConfig() {
      const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
      const configShapeRecognition = scheduleData.tests.find(
        (t) => t.testUrl === "shape-recognition-test"
      );

      totalQuestion.value = 99999;
      if (gameState.value !== "training") {
        totalQuestion.value = configShapeRecognition.configs
          .map((c) => c.duration ?? 10)
          .reduce((a, b) => Number(a) + Number(b), 0);
      }

      config.value = {
        userId: scheduleData.userId,
        sessionId: scheduleData.sessionId,
        testId: configShapeRecognition.id,
        size: configShapeRecognition.configs[currentConfigIndex.value].size,
        variation:
          configShapeRecognition.configs[currentConfigIndex.value].variation,
        timePerQuestion:
          configShapeRecognition.configs[currentConfigIndex.value]
            .time_per_question,
        numberOfQuestion:
          gameState.value === "training"
            ? 9999
            : configShapeRecognition.configs[currentConfigIndex.value]
                .duration ?? 10,
      };

      currentConfig.value = {
        ...configShapeRecognition.configs[currentConfigIndex.value],
        numberOfQuestion:
          gameState.value === "training"
            ? 9999
            : configShapeRecognition.configs
                .map((c) => c.duration ?? 10)
                .reduce((a, b) => Number(a) + Number(b), 0),
        timePerQuestion:
          configShapeRecognition.configs[currentConfigIndex.value]
            .time_per_question,
      };
      quizMetrics.value.unanswered = currentConfig.value.numberOfQuestion;
    }

    async function submitResult() {
      try {
        loading.value = true;
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: config.value.sessionId,
          userId: config.value.userId,
          batteryTestId: config.value.testId,
          result: {
            ...quizMetrics.value,
            graph_data: userInputs.value,
          },
          refreshCount: refreshCount.value,
        };
        const response = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        removeTestByNameAndUpdateLocalStorage("Shape Recognition");
        localStorage.removeItem("refreshCountShapeRecognition");
        router.push("/module");
      } catch (error) {
        console.log("error submit shape recognition:", error);
      } finally {
        loading.value = false;
      }
    }

    function startQuestionCountdown() {
      if (questionCountDownInterval.value) {
        clearInterval(questionCountDownInterval.value);
      }

      questionCountdown.value = currentConfig.value.timePerQuestion;
      questionCountDownInterval.value = setInterval(() => {
        if (questionCountdown.value > 0) {
          questionCountdown.value--;
        } else {
          clearInterval(questionCountDownInterval.value);
          quizMetrics.value.unanswered++;
          userInputs.value.push({
            type: "missed",
            responseTime: currentConfig.value.timePerQuestion * 1000,
            timestamp: Date.now(),
          });
          if (currentQuestion.value < currentConfig.value.numberOfQuestion) {
            currentQuestion.value++;
            drawQuestions();
          } else {
            if (gameState.value === "training") {
              endTraining();
            } else {
              // configs length should be always 3, mudah, sedang, sulit
              if (currentConfigIndex.value === 2) {
                submitResult();
              } else {
                currentConfigIndex.value++;
                initConfig();
                drawQuestions();
              }
            }
          }
        }
      }, 1000);
    }

    function handleBeforeUnload() {
      localStorage.setItem(
        "refreshCountShapeRecognition",
        refreshCount.value.toString()
      );
    }

    function startTraining() {
      showTrainingModal.value = false;
      gameState.value = "training";
      initConfig();
      nextTick(() => {
        drawQuestions();
      });
    }

    function endTraining() {
      gameState.value = "idle";
      showTestModal.value = true;
      completeTrainingTestAndUpdateLocalStorage("Shape Recognition");
      resetGameState();
    }

    function startTest() {
      showTestModal.value = false;
      gameState.value = "test";
      initConfig();
      nextTick(() => {
        drawQuestions();
      });
    }

    function resetGameState() {
      currentQuestion.value = 1;
      quizMetrics.value = {
        correctAnswer: 0,
        wrongAnswer: 0,
        unanswered: 0,
        avgResponseTime: 0,
      };
      userInputs.value = [];
    }

    onMounted(() => {
      refreshCount.value = parseInt(
        localStorage.getItem("refreshCountShapeRecognition") || "0"
      );
      refreshCount.value++;
      localStorage.setItem(
        "refreshCountShapeRecognition",
        refreshCount.value.toString()
      );
      window.addEventListener("beforeunload", handleBeforeUnload);
      const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
      const configShapeRecognition = scheduleData.tests.find(
        (t) => t.testUrl === "shape-recognition-test"
      );
      if (configShapeRecognition.trainingCompleted) {
        showTrainingModal.value = false;
        showTestModal.value = true;
      }
      nextTick(() => {
        initConfig();
      });
    });

    onUnmounted(() => {
      clearInterval(questionCountDownInterval.value);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    });

    watch(
      buttonCanvases,
      () => {
        if (gameState.value !== "idle") {
          drawQuestions();
        }
      },
      { deep: true }
    );

    return {
      shapes,
      shapeCanvas,
      buttonCanvases,
      checkAnswer,
      drawQuestions,
      quizMetrics,
      config,
      questionCountdown,
      loading,
      currentQuestion,
      gameState,
      showTrainingModal,
      showTestModal,
      startTraining,
      startTest,
      currentConfig,
      feedbackState,
      totalQuestion,
      endTraining,
    };
  },
};
</script>

<style scoped>
.settings {
  position: fixed;
  width: 15%;
  height: 100vh;
  background-color: #f0f0f0;
  top: 0;
  left: 0;
  padding: 20px;
  box-sizing: border-box;
}

.settings button {
  width: 100%;
  padding: 10px;
  margin-top: 20px;
  cursor: pointer;
}

.timer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  font-size: 24px;
  font-weight: bold;
  width: 300px;
  height: 60px;
  background-color: #6757dc;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.timer p {
  margin: 0;
  padding: 0;
}

.timer :nth-child(1) {
  font-size: 12px;
}

.timer :nth-child(2) {
  font-size: 24px;
  margin-top: 4px;
}

.button-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.answer-button {
  position: relative;
  cursor: pointer;
  margin-top: 10px;
  height: 30px;
  width: 60px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.answer-button.correct {
  background-color: #4caf50;
  border-color: #45a049;
  color: white;
}

.answer-button.incorrect {
  background-color: #f44336;
  border-color: #da190b;
  color: white;
}

.button-highlight {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid transparent;
  border-radius: 6px;
  pointer-events: none;
}

.button-highlight.correct {
  /*border-color: #4caf50;*/
}

.button-highlight.incorrect {
  /*border-color: #f44336;*/
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 80px;
  height: 80px;
  border: 12px solid #5b4ac4;
  border-top-color: #cecece;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loadingContainer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loadingContainer p {
  margin-top: 50px;
  font-size: 24px;
}

.selected {
  background-color: #5b4ac4;
  color: white;
}
</style>
