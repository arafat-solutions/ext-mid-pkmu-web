<template>
  <div v-if="problem" class="problem-section">
    <p class="problem">{{ problem.num1 }} {{ problem.operator }} {{ problem.num2 }} = ?</p>
    <div class="choices">
      <div v-for="(choice, index) in problem.choices" :key="index" class="choice">
        <button @click="checkAnswer(choice)" class="btn-answer">{{ index + 1 }}</button>{{ choice }}
      </div>
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
    cursor: pointer;
  }

</style>
