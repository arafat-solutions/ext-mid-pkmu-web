<template>
  <div class="lights">
    <div
      v-for="(light, index) in lights"
      :key="index"
:class="['light', light.color, { selected: selectedLightIndex === index }]"
      @click="turnOffLight(index)"
    >
      {{ light.label }}
    </div>
    <div v-if="feedbackMessage && isTraining" class="feedback">
      {{ feedbackMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: "AlertLights",
  data() {
    return {
      lights: [
        { label: "R", color: "off", litTime: null },
        { label: "S", color: "off", litTime: null },
        { label: "T", color: "off", litTime: null },
        { label: "U", color: "off", litTime: null },
      ],
      result: {
        correct: 0,
        wrong: 0,
        missed: 0,
        colors: [],
        answerTimes: [],
        questionTimes: [],
      },
      intervalId: null,
      lightTimeouts: [],
      feedbackMessage: "", // New data property for feedback message
      selectedLightIndex: null, // New data property for selected light index
    };
  },
  computed: {
    redLength() {
      return this.result.colors.filter((color) => color === "red").length;
    },
    yellowLength() {
      return this.result.colors.filter((color) => color === "yellow").length;
    },
    correctResponse() {
      return Number(((this.result.correct / this.redLength) * 100).toFixed(2));
    },
    responseTime() {
      let totalResponse = 0;
      let counter = 0;
      for (let i = 0; i < this.result.questionTimes.length; i++) {
        if (!this.result.answerTimes[i]) {
          continue;
        }
        counter++;
        totalResponse += this.getTimeDifferenceInSeconds(
          this.result.questionTimes[i],
          this.result.answerTimes[i]
        );
      }

      return Number((totalResponse / counter).toFixed(2));
    },
  },
  watch: {
    isTimesUp() {
      this.$emit("getResult", {
        correctResponse: this.correctResponse,
        responseTime: this.responseTime,
        wrong: this.result.wrong,
        correct: this.result.correct,
        alertCount: this.redLength,
        warningCount: this.yellowLength,
      });
    },
    isPause(newValue) {
      if (newValue) {
        clearInterval(this.intervalId);
      } else {
        this.startLights();
      }
    },
  },
  props: {
    speed: String,
    isTimesUp: Boolean,
    frequency: String,
    isPause: Boolean,
    isActive: Boolean,
    isTraining: Boolean,
  },
  mounted() {
    if (this.isActive) {
      this.startLights();
    }
    window.addEventListener("keydown", this.handleKeyPress);
  },
  beforeUnmount() {
    this.clearAllIntervals();
    window.removeEventListener("keydown", this.handleKeyPress);
  },
  methods: {
    startLights() {
      this.intervalId = setInterval(this.randomLight(), this.getInterval());
    },
    clearAllIntervals() {
      clearInterval(this.intervalId);
      this.lightTimeouts.forEach(clearTimeout);
      this.lightTimeouts = [];
    },
    getInterval() {
      switch (this.speed) {
        case "very_slow":
          return 15000;
        case "slow":
          return 10000;
        case "medium":
          return 7000;
        case "fast":
          return 5000;
        case "very_fast":
          return 3000;
        default:
          return 5000;
      }
    },
    getFrequency() {
      // Adjust ranges based on difficulty level
      switch (this.frequency) {
        case "very_rarely":
          return 0.9;
        case "rarely":
          return 0.7;
        case "medium":
          return 0.5;
        case "often":
          return 0.3;
        case "very_often":
          return 0.1;
        default:
          return 0.5;
      }
    },
    checkMissed(isLast = false) {
      let indexCheck;
      if (isLast) {
        indexCheck = this.result.questionTimes.length - 1;
      } else {
        indexCheck = this.result.questionTimes.length - 2;
      }
      if (
        indexCheck >= 0 &&
        typeof this.result.answerTimes[indexCheck] === "undefined"
      ) {
        // Check if light is red and user not push R,S,T,U
        if (this.result.colors[indexCheck] === "red") {
          this.result.missed++;
        }

        this.result.answerTimes.push(null);
      }
    },
    randomLight() {
      if (this.isTimesUp) {
        this.checkMissed(true);
        this.clearAllIntervals();
        return;
      }

      const index = Math.floor(Math.random() * this.lights.length);
      const frequency = this.getFrequency();
      const color = Math.random() > frequency ? "red" : "yellow";

      if (this.lights[index].color === "off") {
        this.lights[index].color = color;
        this.lights[index].litTime = Date.now();
        this.result.questionTimes.push(this.lights[index].litTime);
        this.result.colors.push(color);

        const timeout = setTimeout(() => {
          if (this.lights[index].color !== "off") {
            this.lights[index].color = "off";
            this.lights[index].litTime = null;
            if (color === "red") {
              this.result.missed++;
            }
            this.result.answerTimes.push(null);
          }
        }, 5000);

        this.lightTimeouts.push(timeout);
      }

      this.checkMissed();
    },
    turnOffLight(index) {
      if (this.lights[index].color !== "off") {
        const now = Date.now();
        this.result.answerTimes.push(now);
        if (this.lights[index].color === "red") {
          this.result.correct++;
          this.feedbackMessage = "Benar!";
        } else {
          this.result.wrong++;
          this.feedbackMessage = "Salah!";
        }
        this.lights[index].color = "off";
        this.lights[index].litTime = null;
        this.selectedLightIndex = index; // Set the selected light index
        setTimeout(() => {
          this.feedbackMessage = ""; // Clear feedback message after 2 seconds
          this.selectedLightIndex = null; // Clear selected light index after 2 seconds
        }, 2000);
      }
    },
    handleKeyPress(event) {
      if (
        event.key !== "r" &&
        event.key !== "s" &&
        event.key !== "t" &&
        event.key !== "u"
      ) {
        return;
      }

      if (this.isPause || !this.isActive) {
        return;
      }

      const keyMap = { r: 0, s: 1, t: 2, u: 3 };
      if (keyMap[event.key] !== undefined) {
        this.turnOffLight(keyMap[event.key]);
      }
    },
    getTimeDifferenceInSeconds(dateTime1, dateTime2) {
      let differenceInMilliseconds = Math.abs(dateTime2 - dateTime1);
      return differenceInMilliseconds / 1000;
    },
  },
};
</script>

<style scoped>
.lights {
  display: inline-block;
  width: 100px;
}

.light {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: gray;
  color: #000000;
  font-weight: bold;
  margin-bottom: 25px;
}

.light.red {
  background-color: red;
}

.light.yellow {
  background-color: yellow;
}

.feedback {
  margin-top: 20px;
  font-size: 18px;
  font-weight: bold;
}


.light.selected {
  border: 2px solid blue; /* Add border style for selected light */
}
</style>
