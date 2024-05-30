<template>
  <div class="game-container">
    <div class="instructions">Guess which shape exists inside the box:</div>
    <div class="shape-box">
      <svg width="400" height="200" viewBox="0 0 400 200">
        <!-- Random shape here -->
        <polygon points="100,50 200,150 300,50" fill="none" stroke="black" stroke-width="2" />
        <!-- Random lines to hide the shape -->
        <line v-for="(line, index) in randomLines" :key="index" :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" stroke="black" stroke-width="1" />
      </svg>
    </div>
    <div class="options">
      <div v-for="(option, index) in options" :key="index" class="option">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <polygon :points="option.points" fill="none" stroke="black" stroke-width="2" />
        </svg>
        <button @click="checkAnswer(option)">{{ option.label }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShapeGuessingGame',
  data() {
    return {
      correctAnswer: 'B',
      options: [
        { label: 'A', points: '10,50 50,50 30,10' },
        { label: 'B', points: '10,50 50,10 50,50' },
        { label: 'C', points: '30,10 40,50 20,50' },
        { label: 'D', points: '10,10 50,10 50,50 10,50' },
        { label: 'E', points: '20,10 40,10 30,50' }
      ],
      randomLines: this.generateRandomLines()
    };
  },
  methods: {
    generateRandomLines() {
      const lines = [];
      const width = 500;
      const height = 200;

      // number of lines to hide the shape (can be increased)
      const numLines = 100;
      for (let i = 0; i < numLines; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;

        lines.push({ x1, y1, x2, y2 });
      }

      return lines;
    },
    checkAnswer(selectedOption) {
      const result = selectedOption.label === this.correctAnswer ? 'Correct' : 'Incorrect';
      console.log(result);
    }
  }
};
</script>

<style>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: white;
}
.instructions {
  margin-bottom: 20px;
  font-size: 18px;
  color: black;
}
.shape-box {
  width: 400px;
  height: 200px;
  border: 2px solid black;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}
.options {
  display: flex;
  justify-content: space-around;
  width: 100%;
}
.option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.option svg {
  margin-bottom: 10px;
}
.option button {
  padding: 5px 10px;
  cursor: pointer;
}
</style>
