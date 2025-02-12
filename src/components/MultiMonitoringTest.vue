<template>
  <div class="relative h-full">
    <ModalConfirmSound
      :visible="isModalVisible"
      :title="getModalTitle()"
      :message="getModalMessage()"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
    <div class="bg-black h-full w-full flex justify-center items-center">
      <canvas
        ref="canvas"
        class="border border-white"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
    </div>
    <div
      class="absolute top-0 left-0 w-full flex justify-center"
      v-if="!isTraining"
    >
      <div
        class="bg-[#6757dc] text-white w-[300px] h-[60px] rounded-b-2xl flex justify-center items-center space-x-2"
      >
        <p>Waktu: {{ formatTime(config.duration) }}</p>
      </div>
    </div>

    <!-- target message -->
    <div
      v-if="targetMessage"
      class="absolute bottom-10 w-full flex justify-center"
    >
      <div
        class="text-xl flex justify-center items-center space-x-2"
        style="color: green"
      >
        <p class="flex items-center">
          <span class="mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M11 5.07A7.005 7.005 0 0 0 5.07 11H7v2H5.07A7 7 0 0 0 11 18.93V17h2v1.93A7 7 0 0 0 18.93 13H17v-2h1.93A7 7 0 0 0 13 5.07V7h-2zM3.055 11A9.004 9.004 0 0 1 11 3.055V1h2v2.055A9.004 9.004 0 0 1 20.945 11H23v2h-2.055A9.004 9.004 0 0 1 13 20.945V23h-2v-2.055A9.004 9.004 0 0 1 3.055 13H1v-2zM15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0"
              />
            </svg>
          </span>
          {{ targetMessage }}
        </p>
      </div>
    </div>

    <!-- acoustic message -->
    <div
      v-if="acousticMessage"
      class="absolute bottom-3 w-full flex justify-center"
    >
      <div
        class="text-xl flex justify-center items-center space-x-2"
        :style="{ color: acousticMessageColor }"
      >
        <p class="flex items-center">
          <span class="mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M5 7h2v10H5zm-4 3h2v4H1zm8-8h2v18H9zm4 2h2v18h-2zm4 3h2v10h-2zm4 3h2v4h-2z"
              />
            </svg>
          </span>
          {{ acousticMessage }}
        </p>
      </div>
    </div>
    <button v-if="isTraining" @click="endTrainingSession" class="finish-button">
      Selesai Latihan
    </button>
    <div
      v-if="loading"
      class="w-screen h-screen bg-white absolute top-0 left-0 z-30 flex justify-center items-center flex-col"
    >
      <div
        class="w-20 h-20 border-[12px] border-[#5b4ac4] border-t-[#cecece] rounded-full animate-spin"
      ></div>
      <p class="mt-12 text-2xl">Your result is submitting...</p>
    </div>
    <div
      class="absolute left-0 top-0 h-full w-48 bg-gray-950 text-left text-white pt-20 pl-2"
    >
      <p>Waktu Benar: {{ metrics.tracking_task.correctTime.toFixed(2) }} s</p>
      <p>Button:</p>
      <p>Benar: {{ metrics.button_task.correct_answer }}</p>
      <p>Acoustic:</p>
      <p>Benar: {{ metrics.acoustic_task.correct_answer }}</p>
      <p>Salah: {{ metrics.acoustic_task.incorrect_answer }}</p>
      <p>total: {{ metrics.acoustic_task.total_question }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import ModalConfirmSound from "./common/ModalConfirmSound.vue";
import {
  completeTrainingTestAndUpdateLocalStorage,
  removeTestByNameAndUpdateLocalStorage,
} from "@/utils/index";

const loading = ref(false);
const canvasWidth = ref(700);
const canvasHeight = ref(500);
const router = useRouter();
const isModalVisible = ref(true);
const canvas = ref(null);
const ctx = ref(null);
const testInterval = ref(null);
const rectangleInterval = ref(null);
const soundInterval = ref(null);
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const isSoundSame = ref(false);
const gameObjects = ref({
  circle: { x: 250, y: 150, radius: 10 },
  aim: { x: 0, y: 0, size: 30, color: "red" },
  rectangles: [],
});
const refreshCount = ref(0);
const userInputs = ref([]);
const isTraining = ref(true);
const currentTrainingTask = ref("tracking");
const trainingTasks = ["tracking", "button", "acoustic", "combined"];
const trainingDuration = 99999; // 60 seconds for each training session
const acousticMessage = ref("");
const acousticMessageColor = ref("");
const targetMessage = ref("");
const timeoutCreateRectangle = ref(undefined);
const isTimeoutCreateRectangleRunning = ref(true);

const config = ref({
  speed: "normal",
  speedChange: "",
  directionChange: "",
  duration: 0,
  rectangleVisibility: {
    showDuration: 5,
    hideDuration: 8,
  },
  playInterval: 10000,
  userId: "",
  sessionId: "",
  testId: "",
});

const DEFAULT_METRICS = {
  tracking_task: {
    correctTime: 0,
    lastCheckTime: 0,
  },
  acoustic_task: {
    correct_answer: 0,
    total_question: 0,
    incorrect_answer: 0,
  },
  button_task: {
    correct_answer: 0,
    total_question: 0,
  },
};

const metrics = ref(DEFAULT_METRICS);

const gameState = ref({
  direction: { x: 1, y: 1 },
  currentSpeed: 3,
  baseSpeed: 3,
  rectanglesVisible: true,
  lastRectangleTime: 0,
  userAnswered: false,
  lastFrameTime: 0,
  acousticAnswerAllowed: false,
  lastAcousticPlayTime: 0,
  lastPlayedFrequency: 0,
});

const speedMap = {
  very_slow: 1,
  slow: 1.2,
  medium: 1.6,
  fast: 2,
  very_fast: 2.5,
};

const gamepadIndex = ref(null);

function getModalTitle() {
  if (isTraining.value) {
    return `Mulai Latihan ${
      currentTrainingTask.value.charAt(0).toUpperCase() +
      currentTrainingTask.value.slice(1)
    } `;
  }
  return "Mulai Test";
}

function getModalMessage() {
  if (isTraining.value) {
    switch (currentTrainingTask.value) {
      case "tracking":
        return "Anda diminta untuk MENGARAHKAN GARIS BIDIK untuk membidik TITIK PUTIH menggunakan JOYSTICK selama tes, sehingga GARIS BIDIK berwarna KUNING.";
      case "button":
        return "Anda diminta untuk MENYENTUH LAYAR KOTAK BIRU yang muncul.";
      case "acoustic":
        return "Anda diminta untuk menekan tuas pada bagian DEPAN JOYSTICK bila mendengar audio serupa, sebanyak 3 kali  berturut-turut. (Contoh: BEEP – BEEP – BEEP, maka anda harus menekan tuas untuk merespon audio tersebut).";
      case "combined":
        return "Lakukan semua tugas secara bersamaan: pelacakan, penekanan tombol, dan identifikasi suara.";
    }
  }
  return "Apakah Anda siap untuk memulai tes?";
}

function handleConfirm() {
  isModalVisible.value = false;
  if (isTraining.value) {
    reset();
    startTrainingSession();
  } else {
    reset();
    startFullTest();
  }
}

function startTrainingSession() {
  config.value.duration = trainingDuration;
  countDownTestTime();

  if (
    currentTrainingTask.value === "tracking" ||
    currentTrainingTask.value === "combined"
  ) {
    gameState.value.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
  if (
    currentTrainingTask.value === "button" ||
    currentTrainingTask.value === "combined"
  ) {
    initRectangleInterval();
  }
  if (
    currentTrainingTask.value === "acoustic" ||
    currentTrainingTask.value === "combined"
  ) {
    playRandomSounds();
  }
}

function startFullTest() {
  initConfig();
  countDownTestTime();
  gameState.value.lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
  initRectangleInterval();
  playRandomSounds();
}

function countDownTestTime() {
  if (testInterval.value) {
    clearInterval(testInterval.value);
  }

  testInterval.value = setInterval(async () => {
    if (config.value.duration > 0) {
      config.value.duration--;
    } else {
      clearInterval(testInterval.value);
      if (isTraining.value) {
        endTrainingSession();
      } else {
        await submitResult();
      }
    }
  }, 1000);
}

function endTrainingSession() {
  const currentIndex = trainingTasks.indexOf(currentTrainingTask.value);
  if (currentIndex < trainingTasks.length - 1) {
    currentTrainingTask.value = trainingTasks[currentIndex + 1];
    isModalVisible.value = true;
  } else {
    isTraining.value = false;
    isModalVisible.value = true;
  }

  metrics.value.tracking_task.correctTime = 0;
  metrics.value.tracking_task.lastCheckTime = 0;
  metrics.value.acoustic_task.correct_answer = 0;
  metrics.value.acoustic_task.total_question = 0;
  metrics.value.acoustic_task.incorrect_answer = 0;
  metrics.value.button_task.correct_answer = 0;
  metrics.value.button_task.total_question = 0;
  // metrics.value.button_task.incorrect_answer = 0;
  userInputs.value = [];

  completeTrainingTestAndUpdateLocalStorage("Multi Monitoring Test");
}

function moveCircle(deltaTime) {
  const { circle } = gameObjects.value;
  const { direction, currentSpeed } = gameState.value;

  changeSpeed();
  changeDirection(); // This handles the random "edge collision" behavior

  const moveDistance = currentSpeed * (deltaTime / 16.67); // Normalize for 60 FPS

  let newX = circle.x + direction.x * moveDistance;
  let newY = circle.y + direction.y * moveDistance;

  // Check for actual canvas edge collisions and bounce
  if (newX - circle.radius < 0 || newX + circle.radius > canvasWidth.value) {
    direction.x *= -1;
    newX = Math.max(
      circle.radius,
      Math.min(canvasWidth.value - circle.radius, newX)
    );
  }
  if (newY - circle.radius < 0 || newY + circle.radius > canvasHeight.value) {
    direction.y *= -1;
    newY = Math.max(
      circle.radius,
      Math.min(canvasHeight.value - circle.radius, newY)
    );
  }

  circle.x = newX;
  circle.y = newY;
}

function changeSpeed() {
  const changeRates = { none: 0, slow: 0.01, normal: 0.05, sudden: 0.2 };
  const rate = changeRates[config.value.speedChange];
  const randomChange =
    (Math.random() - 0.5) * 2 * rate * gameState.value.baseSpeed;
  gameState.value.currentSpeed = Math.max(
    0.5,
    Math.min(
      gameState.value.baseSpeed * 2,
      gameState.value.currentSpeed + randomChange
    )
  );
}

function changeDirection() {
  const changeRates = { none: 0, slow: 0.01, medium: 0.05, sudden: 0.2 };
  const rate = changeRates[config.value.directionChange];

  // Simulate random edge collision
  if (Math.random() < rate) {
    // Randomly choose to "bounce" off either a vertical or horizontal edge
    if (Math.random() < 0.5) {
      // Simulate vertical edge collision
      gameState.value.direction.x *= -1;
    } else {
      // Simulate horizontal edge collision
      gameState.value.direction.y *= -1;
    }

    // Add a small random adjustment to avoid getting stuck in a repeating pattern
    const randomAdjustment = (Math.random() - 0.5) * 0.2;
    gameState.value.direction.x += randomAdjustment;
    gameState.value.direction.y += randomAdjustment;

    // Normalize the direction vector
    const magnitude = Math.sqrt(
      gameState.value.direction.x ** 2 + gameState.value.direction.y ** 2
    );
    gameState.value.direction.x /= magnitude;
    gameState.value.direction.y /= magnitude;
  }
}

function draw() {
  ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);

  if (gameState.value.rectanglesVisible) {
    gameObjects.value.rectangles.forEach((rect) => {
      ctx.value.fillStyle = rect.color;
      ctx.value.fillRect(rect.x, rect.y, 30, 30);
    });
  }

  ctx.value.beginPath();
  ctx.value.arc(
    gameObjects.value.circle.x,
    gameObjects.value.circle.y,
    gameObjects.value.circle.radius,
    0,
    Math.PI * 2
  );
  ctx.value.fillStyle = "white";
  ctx.value.fill();

  const { aim } = gameObjects.value;
  ctx.value.beginPath();
  ctx.value.arc(aim.x, aim.y, aim.size / 2, 0, Math.PI * 2);
  ctx.value.strokeStyle = aim.color;
  ctx.value.lineWidth = 2;
  ctx.value.stroke();
  ctx.value.moveTo(aim.x - aim.size / 2, aim.y);
  ctx.value.lineTo(aim.x + aim.size / 2, aim.y);
  ctx.value.moveTo(aim.x, aim.y - aim.size / 2);
  ctx.value.lineTo(aim.x, aim.y + aim.size / 2);
  ctx.value.stroke();
}

function drawText({ text, color }) {
  acousticMessage.value = text;
  acousticMessageColor.value = color;

  setTimeout(() => {
    acousticMessage.value = "";
    acousticMessageColor.value = "";
  }, 4000);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  return `${minutes}:${remainderSeconds < 10 ? "0" : ""}${remainderSeconds}`;
}

function updateCircleSpeed() {
  gameState.value.baseSpeed = speedMap[config.value.speed] || speedMap.normal;
  gameState.value.currentSpeed = gameState.value.baseSpeed;
}

function createRectangles() {
  if (!isTimeoutCreateRectangleRunning.value) return;

  gameObjects.value.rectangles.push({
    x: Math.random() * (canvasWidth.value - 30),
    y: Math.random() * (canvasHeight.value - 30),
    color: "#1C97FF",
    createdAt: Date.now(),
  });

  timeoutCreateRectangle.value = setTimeout(createRectangles, 7000);
}

function startCreateRectangle() {
  if (!isTimeoutCreateRectangleRunning.value) {
    isTimeoutCreateRectangleRunning.value = true;
    createRectangles();
  }
}

function stopCreateRectangle() {
  isTimeoutCreateRectangleRunning.value = false;
  clearTimeout(timeoutCreateRectangle);
}

function changeColorRectangle() {
  const currentTime = Date.now();

  const redRectangles = gameObjects.value.rectangles.map((rect) => {
    if (rect.color === "#1C97FF" && currentTime - rect.createdAt >= 5000) {
      return {
        ...rect,
        color: "red",
      };
    }

    return rect;
  });

  gameObjects.value.rectangles = redRectangles;

  setTimeout(changeColorRectangle, 1000);
}

function initConfig() {
  const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
  const configMultiMonitoring = scheduleData.tests.find(
    (t) => t.testUrl === "multi-monitoring-test"
  );
  // @TODO: Config Flow
  const { duration, speed, speed_change, direction_change } =
    configMultiMonitoring.configs[0];

  config.value = {
    ...config.value,
    duration: duration * 60,
    speed,
    speedChange: speed_change,
    directionChange: direction_change,
    userId: scheduleData.userId,
    sessionId: scheduleData.sessionId,
    testId: configMultiMonitoring.id, // change to battery test id instead of config id.
  };
}

async function submitResult() {
  try {
    loading.value = true;

    if (soundInterval.value) {
      clearInterval(soundInterval.value);
    }
    audioContext.close();

    const API_URL = process.env.VUE_APP_API_URL;
    const result = {
      ...metrics.value,
      graph_data: userInputs.value,
      tracking_task: {
        correctTime: Number(metrics.value.tracking_task.correctTime.toFixed(2)),
      },
    };
    const payload = {
      testSessionId: config.value.sessionId,
      userId: config.value.userId,
      batteryTestId: config.value.testId,
      result,
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
    removeTestByNameAndUpdateLocalStorage("Multi Monitoring Test");
    localStorage.removeItem("refreshCountMultiMonitoring");
    router.push("/module");
  } catch (error) {
    console.log(error, "<< error");
  } finally {
    loading.value = false; // Set loading to false when the submission is complete
  }
}

function playSound(frequency, duration) {
  const oscillator = audioContext.createOscillator();
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function handleKeydown(event) {
  if (event.code === "Enter") {
    if (gameState.value.acousticAnswerAllowed) {
      if (isSoundSame.value) {
        metrics.value.acoustic_task.correct_answer++;
        drawText({ text: "Respons benar", color: "green" });
      } else {
        metrics.value.acoustic_task.incorrect_answer++;
        drawText({
          text: "Response salah. Bukan pada urutan audio yang benar",
          color: "red",
        });
      }
      isSoundSame.value = false;
      gameState.value.acousticAnswerAllowed = false;
    }
  }
}

// function handleMouseMove(event) {
//     const rect = canvas.value?.getBoundingClientRect();
//     gameObjects.value.aim.x = event.clientX - rect.left;
//     gameObjects.value.aim.y = event.clientY - rect.top;
// }

function handleInteraction(event) {
  const rect = canvas.value?.getBoundingClientRect();
  let mouseX, mouseY;

  if (event.type === "click") {
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  } else if (event.type === "touchstart") {
    const touch = event.touches[0]; // Get the first touch point
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
  }

  if (gameState.value.rectanglesVisible) {
    const rectangleIndex = gameObjects.value.rectangles.findIndex(
      (rectangle) =>
        mouseX >= rectangle.x &&
        mouseX <= rectangle.x + 30 &&
        mouseY >= rectangle.y &&
        mouseY <= rectangle.y + 30
    );

    const currentTime = Date.now();

    if (rectangleIndex !== -1) {
      // If rectangle is blue and clicked
      const rectangle = gameObjects.value.rectangles[rectangleIndex];
      if (
        rectangle.color === "#1C97FF" &&
        currentTime - rectangle.createdAt <= 5000
      ) {
        metrics.value.button_task.correct_answer++;
        userInputs.value.push({
          type: "correct",
          responseTime: currentTime - rectangle.createdAt,
          timestamp: Date.now(),
        });
      } else {
        userInputs.value.push({
          type: "wrong",
          responseTime: currentTime - rectangle.createdAt,
          timestamp: Date.now(),
        });
      }
      gameObjects.value.rectangles.splice(rectangleIndex, 1);
    }
  }
}

function checkAimCollision(timestamp) {
  const currentTimeInSeconds = timestamp / 1000;
  const { circle, aim } = gameObjects.value;
  const distance =
    Math.sqrt(Math.pow(circle.x - aim.x, 2) + Math.pow(circle.y - aim.y, 2)) *
    1.5; // Increase the radius by 50%

  if (distance <= circle.radius + aim.size) {
    const elapsedTime =
      currentTimeInSeconds - metrics.value.tracking_task.lastCheckTime;
    metrics.value.tracking_task.correctTime += elapsedTime;
    aim.color = "yellow";
    targetMessage.value =
      "Pertahankan objek putih tetap berada di objek kuning selama mungkin..";
  } else {
    aim.color = "red";
    targetMessage.value = "";
  }
  metrics.value.tracking_task.lastCheckTime = currentTimeInSeconds;
}

function initRectangleInterval() {
  if (rectangleInterval.value) {
    clearInterval(rectangleInterval.value);
  }
  startCreateRectangle();
  changeColorRectangle();
}

function gameLoop(timestamp) {
  const deltaTime = timestamp - gameState.value.lastFrameTime;
  gameState.value.lastFrameTime = timestamp;

  moveCircle(deltaTime);
  checkAimCollision(timestamp);
  draw();
  requestAnimationFrame(gameLoop);
}

function playRandomSounds() {
  const soundOptions = [
    { frequency: 200, duration: 0.2 },
    { frequency: 200, duration: 0.5 },
    { frequency: 1000, duration: 0.2 },
    { frequency: 1000, duration: 0.5 },
  ];

  function getRandomSoundOption() {
    let selectedOption;
    do {
      selectedOption =
        soundOptions[Math.floor(Math.random() * soundOptions.length)];
    } while (selectedOption.frequency === gameState.value.lastPlayedFrequency);
    gameState.value.lastPlayedFrequency = selectedOption.frequency;
    return selectedOption;
  }

  function playThreeTimes() {
    const randomDecision = Math.random();
    metrics.value.acoustic_task.total_question++;

    if (randomDecision < 0.5) {
      isSoundSame.value = false;

      for (let i = 0; i < 3; i++) {
        const selectedOption = getRandomSoundOption();
        const { frequency, duration } = selectedOption;

        setTimeout(() => {
          playSound(frequency, duration);

          // Set the timestamp after the last sound
          if (i === 2) {
            gameState.value.lastSoundPlayedTime = Date.now();
            setTimeout(() => {
              gameState.value.acousticAnswerAllowed = true;
            }, 500); // Give a small buffer after the last sound
          }
        }, i * (duration * 1000 + 1000));
      }
    } else {
      isSoundSame.value = true;

      const selectedOption = getRandomSoundOption();
      const { frequency, duration } = selectedOption;

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          playSound(frequency, duration);

          // Set the timestamp after the last sound
          if (i === 2) {
            gameState.value.lastSoundPlayedTime = Date.now();
            setTimeout(() => {
              gameState.value.acousticAnswerAllowed = true;
            }, 500); // Give a small buffer after the last sound
          }
        }, i * (duration * 1000 + 1000));
      }
    }

    // Check if user didn't answer the previous question
    if (gameState.value.acousticAnswerAllowed) {
      if (isSoundSame.value) {
        metrics.value.acoustic_task.incorrect_answer++;
        drawText({
          text: "Urutan suara terlewat tiga detik yang lalu",
          color: "red",
        });
      } else {
        metrics.value.acoustic_task.correct_answer++;
        drawText({ text: "Respons benar", color: "green" });
      }
    }

    setTimeout(() => {
      gameState.value.acousticAnswerAllowed = true;
      gameState.value.lastAcousticPlayTime = Date.now();
    }, 3000);
  }

  function startSoundInterval() {
    if (soundInterval.value) {
      clearInterval(soundInterval.value);
    }

    soundInterval.value = setInterval(() => {
      playThreeTimes();
    }, config.value.playInterval);
  }

  startSoundInterval();
}

function handleCancel() {
  router.replace("/module");
}

// for gamepad
function onGamepadConnected(event) {
  console.log("connected", event);
  if (event.gamepad.id !== "T.16000M (Vendor: 044f Product: b10a)") {
    return;
  }
  gamepadIndex.value = event.gamepad.index;
  checkGamepad();
}

function onGamepadDisconnected(event) {
  console.log("disconnected", event);
  if (event.gamepad.id !== "T.16000M (Vendor: 044f Product: b10a)") {
    return;
  }
  if (gamepadIndex.value === event.gamepad.index) {
    gamepadIndex.value = null;
  }
}

function checkGamepad() {
  if (gamepadIndex.value !== null) {
    const gamepad = navigator.getGamepads()[gamepadIndex.value];
    if (gamepad) {
      handleGamepadInput(gamepad);
      handleGamepadPress(gamepad);
    }
  }
  requestAnimationFrame(checkGamepad);
}

function handleGamepadPress(gamepad) {
  const triggerPressed = gamepad.buttons[0].pressed;
  if (triggerPressed && gameState.value.acousticAnswerAllowed) {
    if (isSoundSame.value) {
      metrics.value.acoustic_task.correct_answer++;
      drawText({ text: "Respons benar", color: "green" });
    } else {
      metrics.value.acoustic_task.incorrect_answer++;
      drawText({
        text: "Response salah. Bukan pada urutan audio yang benar",
        color: "red",
      });
    }
    isSoundSame.value = false;
    gameState.value.acousticAnswerAllowed = false;
  }
}

function handleGamepadInput(gamepad) {
  const [leftStickX, leftStickY] = gamepad.axes;
  const canvasRect = canvas.value?.getBoundingClientRect();
  if (!canvasRect) {
    return;
  }
  const canvasWidth = canvasRect.width;
  const canvasHeight = canvasRect.height;

  const sensitivity = 5; // You can adjust this value to control how fast the aim moves

  gameObjects.value.aim.x += leftStickX * sensitivity;
  gameObjects.value.aim.y += leftStickY * sensitivity;

  // Clamp the aim position to stay within the canvas bounds
  gameObjects.value.aim.x = Math.max(
    0,
    Math.min(gameObjects.value.aim.x, canvasWidth)
  );
  gameObjects.value.aim.y = Math.max(
    0,
    Math.min(gameObjects.value.aim.y, canvasHeight)
  );
}

function handleBeforeUnload() {
  // Save the current refresh count to localStorage before the page unloads
  localStorage.setItem(
    "refreshCountMultiMonitoring",
    refreshCount.value.toString()
  );
}

function reset() {
  gameObjects.value.rectangles = [];
  userInputs.value = [];
  metrics.value = DEFAULT_METRICS;
  stopCreateRectangle();

  if (testInterval.value) {
    clearInterval(testInterval.value);
  }
  if (rectangleInterval.value) {
    clearInterval(rectangleInterval.value);
  }
  if (soundInterval.value) {
    clearInterval(soundInterval.value);
    soundInterval.value = null;
  }
  // if (audioContext) {
  //     if (audioContext.state !== "closed") audioContext.close();
  // }
}

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");

    initConfig();

    updateCircleSpeed();
    metrics.value.tracking_task.lastCheckTime = performance.now() / 1000;

    canvas.value.addEventListener("click", handleInteraction);
    canvas.value.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleKeydown);
    canvas.value.addEventListener(
      "mouseenter",
      () => (canvas.value.style.cursor = "none")
    );
    canvas.value.addEventListener(
      "mouseleave",
      () => (canvas.value.style.cursor = "default")
    );

    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
    checkGamepad();

    refreshCount.value = parseInt(
      localStorage.getItem("refreshCountMultiMonitoring") || "0"
    );
    refreshCount.value++;
    localStorage.setItem(
      "refreshCountMultiMonitoring",
      refreshCount.value.toString()
    );
    window.addEventListener("beforeunload", handleBeforeUnload);

    const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
    const configMultiMonitoring = scheduleData.tests.find(
      (t) => t.testUrl === "multi-monitoring-test"
    );
    isTraining.value = configMultiMonitoring.trainingCompleted ? false : true;
    // Start with the first training session
    isModalVisible.value = true;
  }
});

onUnmounted(() => {
  if (canvas.value) {
    canvas.value.removeEventListener("click", handleInteraction);
    canvas.value.removeEventListener("touchstart", handleInteraction);
    // canvas.value.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("keydown", handleKeydown);
    canvas.value.removeEventListener("mouseenter", () => {});
    canvas.value.removeEventListener("mouseleave", () => {});

    window.removeEventListener("gamepadconnected", onGamepadConnected);
    window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  }
  reset();
  if (audioContext) {
    if (audioContext.state !== "closed") audioContext.close();
  }
});

watch(() => config.value.speed, updateCircleSpeed);
</script>
