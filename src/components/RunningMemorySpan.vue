<template>
  <div v-if="isShowModal" class="modal-overlay">
    <div class="modal-content">
      <p><strong>Apakah Anda Yakin <br>akan memulai test Running Memory Span?</strong></p>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
      <button @click="closeModal()">Ya</button>
    </div>
  </div>

  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6" style="margin-right: 5px;">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6" style="margin-right: 5px;">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>

    <div class="input-simulation-container">
      <div v-if="isShowQuestion">>
        <div class="question">
          <p> Numbers from the end </p>
        </div>

        <div class="calculator">
          <input type="text" v-model.trim="expression" readonly>
          <div class="buttons">
            <button class="digit-number" @click="appendToExpression('1')">1</button>
            <button class="digit-number" @click="appendToExpression('2')">2</button>
            <button class="digit-number" @click="appendToExpression('3')">3</button>
            <button class="digit-number" @click="appendToExpression('4')">4</button>
            <button class="digit-number" @click="appendToExpression('5')">5</button>
            <button class="digit-number" @click="appendToExpression('6')">6</button>
            <button class="digit-number" @click="appendToExpression('7')">7</button>
            <button class="digit-number" @click="appendToExpression('8')">8</button>
            <button class="digit-number" @click="appendToExpression('9')">9</button>
            <button class="digit-number" @click="clearExpression()">Del</button>
            <button class="digit-number" @click="appendToExpression('0')">0</button>
            <button class="digit-number" @click="submitAnswer()">Send</button>
          </div>
        </div>
      </div>

      <div v-else style="margin-top: 20%;">
        <p>Listen to item presentation!</p>
      </div>

    </div>
  </div>
</template>

<script>
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'

export default {
  name: 'RunningMemorySpan',
  data() {
    return {
      isShowQuestion: false,
      isShowModal: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      isPause: false,
      isLoading: false,
      timer: {
        minutes: 0,
        seconds: 0
      },
      countdownInterval: null,
      expression: '',
      audios: [],
      utterances: [],
      answer: [],
      config: {
        broadcast_length: null, // short, medium, long
        duration: null,
        sequence_pattern: null, // up or down
        include_zero: null // true or false
      },
      correctAnswer: 0,
      responseQuestion: 0,
      responseTime: 0,
      responseDurations: [],
      result: {
        correct_answer: 0,
        avg_response_time: 0,
      },
    };
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.config.duration / 60).toString().padStart(2, '0');
      const seconds = (this.config.duration % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    },
  },
  methods: {
    closeModal() {
      this.isShowModal = false;
      this.isConfigLoaded = true;

      setTimeout(() => {
        this.generateAudio();
      }, 500);

      this.startCountdown();
    },
    pause() {
      clearInterval(this.countdownInterval);
      this.isPause = true;
    },
    startAgain() {
      this.startCountdown();
      this.isPause = false;
    },
    exit() {
      if (confirm("Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang.")) {
        this.$router.push('module');
      }
    },
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        if (this.config.duration > 0) {
          this.config.duration--;
        } else {
          clearInterval(this.countdownInterval);

          // Submit Answer
          setTimeout(() => {
            this.calculatedResult();
          }, 1000);
        }
      }, 1000);
    },
    initConfig() {
      try {
        let config = JSON.parse(localStorage.getItem('scheduleData'));

        if (config) {
          const runningMemorySpan = config.tests.find(test => test.testUrl === 'running-memory-span-test' || test.name === 'Running Memory Span Test').config;
          this.config.duration = runningMemorySpan.duration * 60;
          this.config.batteryTestConfigId = runningMemorySpan.id;
          this.config.moduleId = config.moduleId;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          this.config.broadcast_length = runningMemorySpan.broadcast_length;
          this.config.sequence_pattern = runningMemorySpan.sequence_pattern;
          this.config.include_zero = runningMemorySpan.include_zero;
          this.config.speed = runningMemorySpan.speed;

          this.isShowModal = true;
        }
      } catch (error) {
        console.error(error);
      }
    },
    calculatedResult() {
      this.correct_answer = this.correctAnswer;
      this.result.avg_response_time = this.averageResponseTime();

      this.submitResult()
    },
    async submitResult() {
      try {
        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.config.sessionId,
          userId: this.config.userId,
          moduleId: this.config.moduleId,
          batteryTestConfigId: this.config.batteryTestConfigId,
          result: this.result,
        }

        const res = await fetch(`${API_URL}api/submission`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        )

        if (!res.ok) {
          throw new Error('Failed Submit Test');
        }
      } catch (error) {
        console.error(error), "error";
      } finally {
        this.isLoading = false;

        removeTestByNameAndUpdateLocalStorage('Running Memory Span Test')
        this.$router.push('/module');
      }
    },
    setLength() {
      if (this.config.broadcast_length === 'short') {
        return 5;
      }

      if (this.config.broadcast_length === 'medium') {
        return 7;
      }

      if (this.config.broadcast_length === 'long') {
        return 9;
      }
    },
    generateAudio() {
      if (this.isPause) {
        return;
      }

      this.audios = [];
      this.utterances = [];
      this.responseQuestion = 0;
      this.responseTime = 0;

      for (let i = 0; i < this.setLength(); i++) {
        let number = Math.floor(Math.random() * 10);

        if (!this.config.include_zero) {
          number = Math.floor(Math.random() * 9) + 1;
        }

        this.audios.push(number);
      }

      if (this.audios.length > 0) {
        this.utterances = this.audios.map(audio => {
          const speak = new SpeechSynthesisUtterance(audio.toString());
          return speak;
        });

        setTimeout(() => {
          this.startPlayback();
        }, 500);
      }
    },
    submitAnswer() {
      if (this.isPause) {
        return;
      }

      const reverseAudios = [...this.audios].reverse();
      let checkAnswer = this.answer.length === reverseAudios.length && this.answer.every((value, index) => value === reverseAudios[index]);

      if (checkAnswer) {
        this.correctAnswer++;
        this.responseTime = Date.now();
				this.calculateResponseTime();
      }

      this.clearExpression();
      this.generateAudio();
      this.isShowQuestion = false;
    },
    averageResponseTime() {
      if (this.responseDurations.length > 0) {
        const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);

        return (sum / this.responseDurations.length) / 1000;
      }

      return 0;
    },
    calculateResponseTime() {
      return this.responseDurations.push(this.responseTime - this.responseQuestion);
    },
    appendToExpression(value) {
      if (this.isPause) {
        return;
      }

      this.expression += value;
      this.answer.push(parseInt(value));
    },
    clearExpression() {
      if (this.isPause) {
        return;
      }

      this.expression = '';
      this.answer = [];
    },
    startPlayback() {
      if ('speechSynthesis' in window) {

        setTimeout(() => {
          // Initial
          const preambule = new SpeechSynthesisUtterance("  ");
          preambule.rate = 1;
          preambule.pitch = 1.2;
          preambule.volume = 1;
          preambule.lang = 'id-ID';
          window.speechSynthesis.speak(preambule);
          // Initial

          let index = 0;
          const speakNext = () => {
            if (index < this.utterances.length) {
              const utterance = this.utterances[index];
              utterance.rate = 1;
              utterance.pitch = 1.2;
              utterance.volume = 1;
              utterance.lang = 'id-ID';
              utterance.onend = () => {
                index++;
                speakNext();
              };
              window.speechSynthesis.speak(utterance);
            } else {
              this.responseQuestion = Date.now();
              this.isShowQuestion = true;
            }
          };
          speakNext();
        }, 500);
      } else {
        alert('Sorry, your browser does not support text-to-speech.');
      }
    },
  },
  mounted() {
    this.initConfig();
  }
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
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
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
  .timer-container-trial {
    position: absolute;
    right: 0;
    top: 0;
    background-color: #0349D0;
    padding: 0.75rem;
    color: #ffffff;
    font-weight: bold;
    border-bottom-left-radius: 15px;
  }
  .timer-container-trial button {
    color: #000000;
    font-weight: bold;
    padding: 0.5rem;
    border-radius: 5px;
    border: none;
    cursor: pointer;
  }
  .timer-container {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: #0349D0;
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
</style>
