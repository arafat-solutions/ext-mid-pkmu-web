<template>
  <div v-if="problem" class="problem-section">
    <p class="problem">{{ problem.num1 }} {{ problem.operator }} {{ problem.num2 }} = ?</p>
    <div class="choices">
      <div v-for="(choice, index) in problem.choices" :key="index" class="choice">
        <button class="btn-answer">{{ index + 1 }}</button><span class="label-choice">{{ choice }}</span>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ArithmeticTask',
    data() {
      return {
        minNumber: 1,
        maxNumber: 99,
        signRandoms: ['+', '-', ':', 'x'],
        problem: null,
        result: {
          correct: 0,
          wrong: 0,
          answerTimes: [],
          problems: [],
        },
      };
    },
    props: {
      difficulty: String,
      isTimesUp: Boolean,
      isPause: Boolean,
      minuteTime: Number,
      isActive: Boolean,
    },
    mounted() {
      this.generateProblem();
    },
    created() {
      window.addEventListener('keyup', this.handleKeyPress);
    },
    beforeUnmount() {
      window.removeEventListener('keyup', this.handleKeyPress);
    },
    computed: {
      correctResponse() {
        return (this.result.correct / this.minuteTime).toFixed(2);
      },
      responseTime() {
        let totalResponse = 0;
        for (let i = 0; i < this.result.answerTimes.length; i++) {
          totalResponse += this.getTimeDifferenceInSeconds(
            this.result.problems[i].createdAt,
            this.result.answerTimes[i]
          )
        }

        return (totalResponse / this.result.problems.length).toFixed(2);
      },
    },
    watch: {
      correctResponse(newValue) {
        this.$emit('getResult', {
          correctResponse: newValue,
          responseTime: this.responseTime,
        });
      },
      responseTime(newValue) {
        this.$emit('getResult', {
          correctResponse: this.correctResponse,
          responseTime: newValue,
        });
      }
    },
    methods: {
      handleKeyPress(event) {
        if (this.isPause || this.isTimesUp) {
          return;
        }

        // Check if the pressed key is '1', '2', '3', or '4'
        if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
          // Perform any specific action based on the key pressed
          switch (event.key) {
            case '1':
              this.chooseAnswer(0);
              break;
            case '2':
              this.chooseAnswer(1);
              break;
            case '3':
              this.chooseAnswer(2);
              break;
            case '4':
              this.chooseAnswer(3);
              break;
            default:
              break;
          }
        }
      },
      chooseAnswer(index) {
        if (!this.problem) {
          return;
        }

        this.result.answerTimes.push(new Date());
        if (this.problem.choices[index] === this.problem.correctAnswer) {
          this.result.correct++;
        } else {
          this.result.wrong++;
        }
        this.result.problems.push(this.problem);
        this.generateProblem();
      },
      getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      getRandomOperator() {
        const randomIndex = Math.floor(Math.random() * this.signRandoms.length);
        return this.signRandoms[randomIndex];
      },
      generateProblem() {
        let num1, num2;

        // Adjust ranges based on difficulty level
        switch (this.difficulty) {
          case 'easy':
            num1 = this.getRandomNumber(this.minNumber, 10);
            num2 = this.getRandomNumber(this.minNumber, 10);
            break;
          case 'medium':
            num1 = this.getRandomNumber(10, 50);
            num2 = this.getRandomNumber(10, 50);
            break;
          case 'difficult':
            num1 = this.getRandomNumber(50, this.maxNumber);
            num2 = this.getRandomNumber(50, this.maxNumber);
            break;
          default:
            num1 = this.getRandomNumber(this.minNumber, this.maxNumber);
            num2 = this.getRandomNumber(this.minNumber, this.maxNumber);
        }

        const operator = this.getRandomOperator();

        // Ensure non-zero divisor for division and integer result
        if (operator === ':') {
          num2 = this.getRandomNumber(1, 10); // Ensure divisor is not zero
          num1 = num2 * this.getRandomNumber(1, 10); // Ensure num1 is a multiple of num2
        }

        const correctAnswer = this.calculateAnswer(num1, num2, operator);
        const choices = this.generateChoices(correctAnswer);
        const createdAt = new Date();

        this.problem = { num1, num2, operator, choices, correctAnswer, createdAt };
      },
      calculateAnswer(num1, num2, operator) {
        switch (operator) {
          case '+':
            return num1 + num2;
          case '-':
            return num1 - num2;
          case 'x':
            return num1 * num2;
          case ':':
            return num1 / num2;
          default:
            return null;
        }
      },
      generateChoices(correctAnswer) {
        const choices = new Set();
        choices.add(correctAnswer);
        while (choices.size < 4) {
          const randomChoice = correctAnswer + this.getRandomNumber(-10, 10);
          choices.add(randomChoice);
        }
        return Array.from(choices).sort(() => Math.random() - 0.5);
      },
      getTimeDifferenceInSeconds(dateTime1, dateTime2) {
        let differenceInMilliseconds = Math.abs(dateTime2 - dateTime1);
        return differenceInMilliseconds / 1000;
      }
    }
  };
</script>
<style scoped>
  .container {
    font-family: Arial, sans-serif;
    margin: 20px;
    text-align: center;
  }

  h1 {
    color: #333;
  }

  .control-panel {
    margin-bottom: 20px;
  }

  label {
    margin-right: 10px;
  }

  select {
    margin-bottom: 20px;
  }

  .problem-section {
    margin-top: 100px;
    margin-bottom: 20px;
  }

  .problem {
    font-size: 24px;
    margin-bottom: 20px;
    font-weight: bold;
  }

  .choices {
    display: grid;
    grid-template-columns: auto auto; /* Two columns */
    grid-gap: 5px;
    width: 50%;
    margin: 0 auto; /* Gap between grid items */
  }

  .choice {
    /* Adjust styling of individual choices */
    padding: 10px;
    border: node;
  }

  .btn-answer {
    padding: 10px 20px;
    font-size: 16px;
    margin-right: 1rem;
    border: 0;
    font-weight: bold;
    background-color: aqua;
    border-radius: 5px;
  }

  .label-choice {
    display: inline-block;
    min-width: 20px;
  }
</style>
