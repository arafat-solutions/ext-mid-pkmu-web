<template>
  <div v-if="problem">
    <p class="arithmethic-text">{{ problem.num1 }} {{ problem.operator }} {{ problem.num2 }}</p>
    <div class="row">
      <div v-for="(choice, index) in problem.choices" :key="index" class="col-6">{{ choice }}</div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ArithmeticTask',
    props: {
      chooseAnswer: Number
    },
    data() {
      return {
        minNumber: 1,
        maxNumber: 99,
        signRandoms: ['+', '-', ':', 'x'],
        selectedDifficulty: 'easy',
        problem: null
      };
    },
    mounted() {
      this.generateProblem();
    },
    methods: {
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
        switch (this.selectedDifficulty) {
          case 'easy':
            num1 = this.getRandomNumber(this.minNumber, 10);
            num2 = this.getRandomNumber(this.minNumber, 10);
            break;
          case 'medium':
            num1 = this.getRandomNumber(10, 50);
            num2 = this.getRandomNumber(10, 50);
            break;
          case 'hard':
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

        this.problem = { num1, num2, operator, choices, correctAnswer };
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
      }
    }
  };
</script>
<style scoped>
  .arithmethic-text {
    font-size: large;
    font-weight: bold;
  }
</style>
