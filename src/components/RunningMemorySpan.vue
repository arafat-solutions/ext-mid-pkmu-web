<template>
  <div v-if="isModalTrainingVisible" class="modal-overlay">
    <div class="modal-content">
      <p style="font-size: 24px">
        <strong>Apakah anda yakin akan memulai latihan ?</strong>
      </p>
      <p style="font-size: 20px">
        Pada tes ini, Anda harus menggunakan headset dan layar sentuh. Anda akan
        mendengarkan serangkaian angka yang harus Anda ingat. Kemudian, Anda
        diminta memasukkan serangkaian angka tersebut secara terbalik
        menggunakan layar sentuh. Anda wajib memasukkan mouse dan keyboard ke
        dalam laci.
      </p>
      <img src="devices/rmt.png" />

      <div>
        <button @click="startTest()">Mulai Latihan</button>
      </div>
    </div>
  </div>

  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <p>
        <strong>Apakah anda yakin akan memulai test?</strong>
      </p>
      <div>
        <button @click="startTest()">Mulai Test</button>
      </div>
    </div>
  </div>

  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div class="timer-container" v-if="isTrainingCompleted">
      Time: {{ formattedTime }}
    </div>

    <div class="input-simulation-container">
      <div v-if="isShowQuestion && !isSubmitted">
        <div class="question">
          <p class="text-question">Urutkan dari angka terakhir</p>
          <p v-if="showFeedback && !isTrainingCompleted" :class="{
            'feedback-correct': lastAnswerCorrect,
            'feedback-wrong': !lastAnswerCorrect,
          }">
            {{ lastAnswerCorrect ? "Benar!" : "Salah!" }}
          </p>
        </div>

        <div class="calculator">
          <input type="text" v-model.trim="expression" readonly />
          <div class="buttons">
            <button class="digit-number" @click="appendToExpression('1')">
              1
            </button>
            <button class="digit-number" @click="appendToExpression('2')">
              2
            </button>
            <button class="digit-number" @click="appendToExpression('3')">
              3
            </button>
            <button class="digit-number" @click="appendToExpression('4')">
              4
            </button>
            <button class="digit-number" @click="appendToExpression('5')">
              5
            </button>
            <button class="digit-number" @click="appendToExpression('6')">
              6
            </button>
            <button class="digit-number" @click="appendToExpression('7')">
              7
            </button>
            <button class="digit-number" @click="appendToExpression('8')">
              8
            </button>
            <button class="digit-number" @click="appendToExpression('9')">
              9
            </button>
            <button class="digit-number" @click="clearExpression()">
              Hapus
            </button>
            <button class="digit-number" @click="appendToExpression('0')">
              0
            </button>
            <button class="digit-number" @click="() => { isSubmitted = true }">Kirim</button>
          </div>
        </div>
      </div>

      <div v-else style="margin-top: 20%">
        <p class="text-question"> {{ isSubmitted ? "Tunggu Sampai Pertanyaan Selanjutnya!" : "Dengarkan angka yang disebutkan!" }}</p>
      </div>
    </div>
    <button v-if="!isTrainingCompleted" @click="finishTraining" class="finish-button">
      Selesai Latihan
    </button>
  </div>
</template>

<script>
import {
  completeTrainingTestAndUpdateLocalStorage,
  removeTestByNameAndUpdateLocalStorage,
} from "@/utils/index";
import { getConfigs } from "@/utils/configs";
import { patchWorkstation } from "@/utils/fetch";

export default {
  name: "RunningMemorySpan",
  data() {
    return {
      isNextLevel: false,
      isModalTrainingVisible: false,
      isModalVisible: false,
      isShowQuestion: false,
      isConfigLoaded: false,
      isLoading: false,
      isTrainingCompleted: false,
      isSubmitted: false,
      countdownInterval: null,
      countdownNextQuestion: null,
      expression: "",
      audios: [],
      utterances: [],
      answer: [],
      config: {},
      configs: [],
      moduleId: "",
      sessionId: "",
      userId: "",
      testId: "",
      indexConfig: 0,
      durationTest: 0,
      totalQuestion: 0,
      correctAnswer: 0,
      responseQuestion: 0,
      responseTime: 0,
      responseDurations: [],
      actualTestCount: 0,
      userInputs: [],
      result: {
        total_question: 0,
        correct_answer: 0,
        avg_response_time: 0,
        response_times: 0,
        graph_data: [],
      },
      result2: {
        total_question: 0,
        correct_answer: 0,
        avg_response_time: 0,
        response_times: 0,
        graph_data: [],
      },
      showFeedback: false,
      lastAnswerCorrect: false,
    };
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.durationTest / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (this.durationTest % 60).toString().padStart(2, "0");
      return `${minutes}:${seconds}`;
    },
  },
  mounted() {
    let reloadCount = parseInt(
      localStorage.getItem("reloadCountRunningMemorySpan") || "0"
    );
    reloadCount++;
    localStorage.setItem(
      "reloadCountRunningMemorySpan",
      reloadCount.toString()
    );

    window.addEventListener("beforeunload", () => {
      localStorage.setItem(
        "reloadCountRunningMemorySpan",
        reloadCount.toString()
      );
    });

    this.initConfig();
  },
  methods: {
    startTest() {
      this.cleanUp();

      let updatePayload = {
        status: "",
        name: "Running Memory Span Test",
      };
      if (!this.isTrainingCompleted) {
        this.setConfig(this.configs[0]);
        updatePayload.status = "IN_TRAINING"
        this.durationTest = 9999;
      } else {
        updatePayload.status = "IN_TESTING"
        this.setConfig(this.configs[this.indexConfig]);

        this.durationTest = 0;
        for (const i in this.configs) {
          this.durationTest += this.configs[i].duration * 60;
        }

        this.config.duration = this.configs[this.indexConfig].duration * 60;
      }


      patchWorkstation(updatePayload);

      this.isModalTrainingVisible = false;
      this.isModalVisible = false;

      setTimeout(() => {
        this.generateAudio();
      }, 500);

      this.startCountdown();
    },
    cleanUp() {
      clearInterval(this.countdownInterval);
      clearInterval(this.countdownNextQuestion);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    exit() {
      if (
        confirm(
          "Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang."
        )
      ) {
        this.$router.push("module");
      }
    },
    finishTraining() {
      this.cleanUp()
      this.isTrainingCompleted = true;
      completeTrainingTestAndUpdateLocalStorage("Running Memory Span Test");

      //Start Exam After Training
      this.isModalVisible = true;
      this.totalQuestion = 0;
      this.correctAnswer = 0;
      this.responseDurations = [];
      this.userInputs = [];
    },
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        if (this.durationTest > 0) {
          this.durationTest--;
        } else {
          this.cleanUp();

          //For Training
          if (!this.isTrainingCompleted) {
            this.finishTraining();
          } else {
            setTimeout(() => {
              this.actualTestCount += 1
              if (this.actualTestCount < 2) {


                this.result.total_question = this.totalQuestion;
                this.result.correct_answer = this.correctAnswer;

                const resultTimeResonded = this.averageResponseTime();
                this.result.avg_response_time = resultTimeResonded.toFixed(2);

                this.result.response_times = this.responseDurations.map((duration) => ({
                  responseTime: duration,
                  timestamp: Date.now(),
                }));

                this.result.graph_data = this.userInputs;
                this.finishTraining()
              } else {

                this.calculatedResult();
              }
            }, 1000);
          }
        }

        //Check timer for next level exam
        if (this.isTrainingCompleted) {
          if (this.config.duration >= 0) {
            this.config.duration--;

            if (this.config.duration === 0) {
              this.isNextLevel = true;
            }
          } else {
            if (this.isNextLevel) {
              this.isNextLevel = false;
              this.indexConfig++;
              this.config.duration =
                this.configs[this.indexConfig].duration * 60;
            }
          }
        }
      }, 1000);
    },
    initConfig() {
      const configData = getConfigs("running-memory-span-test");
      if (!configData) {
        this.$router.push("/module");
        return;
      }

      this.configs = configData.configs;
      this.moduleId = configData.moduleId;
      this.sessionId = configData.sessionId;
      this.userId = configData.userId;
      this.testId = configData.testId;

      //For Training
      this.isTrainingCompleted = configData.trainingCompleted;

      if (!this.isTrainingCompleted) {
        this.isModalTrainingVisible = true;
      } else {
        this.isModalVisible = true;
      }
    },
    setConfig(config) {
      this.config.broadcastLength = config.broadcast_length;
      this.config.difficultyLevel = config.difficulty_level;
      this.config.includeZero = config.include_zero;
      this.config.speed = config.speed;
      this.config.subtask = config.subtask;
      this.config.testId = config.id;

      this.isConfigLoaded = true;
    },
    calculatedResult() {
      this.result2.total_question = this.totalQuestion;
      this.result2.correct_answer = this.correctAnswer;

      const resultTimeResonded = this.averageResponseTime();
      this.result2.avg_response_time = resultTimeResonded.toFixed(2);

      this.result2.response_times = this.responseDurations.map((duration) => ({
        responseTime: duration,
        timestamp: Date.now(),
      }));

      this.result.graph_data = this.userInputs;
      this.cleanUp();
      this.submitResult();
    },
    async submitResult() {
      try {
        this.isLoading = true;
        // stop any audio
        this.cleanUp();
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.sessionId,
          userId: this.userId,
          batteryTestId: this.testId,
          refreshCount: parseInt(
            localStorage.getItem("reloadCountRunningMemorySpan")
          ),
          result: this.result,
          result2: this.result2,
        };

        const res = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Failed Submit Test");
        }
      } catch (error) {
        console.error(error), "error";
      } finally {
        this.isLoading = false;

        removeTestByNameAndUpdateLocalStorage("Running Memory Span Test");
        localStorage.removeItem("reloadCountRunningMemorySpan");
        this.$router.push("/module");
      }
    },
    setLength() {
      let basePattern = [5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9, 9];
      return basePattern[this.totalQuestion % basePattern.length] ?? 9;
    },
    generateAudio() {
      this.setConfig(this.configs[this.indexConfig]);

      this.audios = [];
      this.utterances = [];
      this.responseQuestion = 0;
      this.responseTime = 0;

      for (let i = 0; i < this.setLength(); i++) {
        let number = null;

        if (!this.config.includeZero) {
          number = Math.floor(Math.random() * 9) + 1;
        } else {
          number = Math.floor(Math.random() * 10);
        }

        this.audios.push(number);
      }

      if (this.audios.length > 0) {
        this.utterances = this.audios.map((audio) => {
          const speak = new SpeechSynthesisUtterance(audio.toString());
          return speak;
        });

        setTimeout(() => {
          this.startPlayback();
        }, 500);
      }
    },
    submitAnswer() {
      clearInterval(this.countdownNextQuestion);
      this.totalQuestion++;

      const reverseAudios = [...this.audios].reverse();
      let checkAnswer =
        this.answer.length === reverseAudios.length &&
        this.answer.every((value, index) => value === reverseAudios[index]);

      this.responseTime = Date.now();
      this.lastAnswerCorrect = checkAnswer;
      this.showFeedback = true;

      if (checkAnswer) {
        this.correctAnswer++;
        this.userInputs.push({
          type: "correct",
          responseTime: this.responseTime - this.responseQuestion,
          timestamp: Date.now(),
        });
      } else {
        this.userInputs.push({
          type: "wrong",
          responseTime: this.responseTime - this.responseQuestion,
          timestamp: Date.now(),
        });
      }

      this.responseDurations.push(this.responseTime - this.responseQuestion);
      this.expression = "";
      this.answer = [];

      // Clear feedback after delay
      setTimeout(() => {
        this.isSubmitted = false;
        this.showFeedback = false;
        this.clearExpression();
        this.generateAudio();
        this.isShowQuestion = false;
      }, 1000);
    },
    averageResponseTime() {
      if (this.responseDurations.length > 0) {
        const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);

        return sum / this.responseDurations.length / 1000;
      }

      return 0;
    },
    appendToExpression(value) {
      this.expression += value;
      this.answer.push(parseInt(value));
    },
    clearExpression() {
      this.expression = this.expression.slice(0, -1);
      this.answer.pop();
    },
    startPlayback() {
      if ("speechSynthesis" in window) {
        setTimeout(() => {
          // Initial
          const preambule = new SpeechSynthesisUtterance("  ");
          preambule.rate = 1;
          preambule.pitch = 1.2;
          preambule.volume = 1;
          preambule.lang = "id-ID";
          window.speechSynthesis.speak(preambule);
          // Initial

          let index = 0;
          const speakNext = () => {
            if (index < this.utterances.length) {
              const utterance = this.utterances[index];
              utterance.rate = 1;
              utterance.pitch = 1;
              utterance.volume = 1;
              utterance.lang = "id-ID";
              utterance.onend = () => {
                index++;
                speakNext();
              };
              window.speechSynthesis.speak(utterance);
            } else {
              this.responseQuestion = Date.now();
              this.isShowQuestion = true;

              let intervalQuestion = 20;
              this.countdownNextQuestion = setInterval(() => {
                if (intervalQuestion > 0) {
                  intervalQuestion--;
                } else {
                  this.submitAnswer();
                }
              }, 1000);
            }
          };
          speakNext();
        }, 500);
      } else {
        alert("Sorry, your browser does not support text-to-speech.");
      }
    },
  },
};
</script>

<style scoped>
.main-view {
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  margin: 60px auto;
}

.modal-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.modal-content button {
  background-color: #6200ee;
  color: white;
  padding: 10px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.modal-content button:hover {
  background-color: #5e37a6;
}

.timer-container {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: #0349d0;
  padding: 1.5rem 5rem;
  color: #ffffff;
  font-weight: bold;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  border: 8px solid rgba(255, 255, 255, 0.3);
  border-top: 8px solid #ffffff;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.text {
  color: #ffffff;
  margin-top: 20px;
  font-size: 1.2em;
}

.input-simulation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.question {
  margin: 30px;
}

.text-question {
  font-weight: bolder;
}

.calculator {
  max-width: 300px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f2f2f2;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

input[type="text"] {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 10px;
}

.digit-number {
  padding: 15px;
  font-size: 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #505250;
  color: white;
}

.feedback-correct {
  color: #4caf50;
  font-weight: bold;
  margin-top: 10px;
  font-size: 1.2em;
}

.feedback-wrong {
  color: #f44336;
  font-weight: bold;
  margin-top: 10px;
  font-size: 1.2em;
}
</style>
