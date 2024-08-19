<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-gray-500 h-24 w-24"></div>
      <div class="bg-gray-500 h-24 w-24"></div>
      <div class="bg-gray-500 h-24 w-24"></div>
      <div class="bg-gray-500 h-24 w-24"></div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      colors: ['red', 'green', 'blue'],
      positions: [1, 2, 3, 4],
      levels: ['very_easy', 'easy', 'medium', 'difficult', 'very_difficult'],
    };
  },
  methods: {
    getRandomWeightedColor(level) {
      const weights = {
        very_easy: { red: 5, green: 3, blue: 2 },
        easy: { red: 3, green: 4, blue: 3 },
        medium: { red: 2, green: 5, blue: 3 },
        difficult: { red: 1, green: 6, blue: 3 },
        very_difficult: { red: 1, green: 7, blue: 4 },
      };

      const levelWeights = weights[level];
      const totalWeight = Object.values(levelWeights).reduce((a, b) => a + b, 0);
      const randomNum = Math.random() * totalWeight;

      let weightSum = 0;
      for (const color in levelWeights) {
        weightSum += levelWeights[color];
        if (randomNum <= weightSum) {
          return color;
        }
      }
    },
    getRandomPosition(level) {
      const levelChangeProbability = {
        very_easy: 0.1,
        easy: 0.2,
        medium: 0.3,
        difficult: 0.4,
        very_difficult: 0.5,
      };

      const changeChance = levelChangeProbability[level];
      if (Math.random() < changeChance) {
        return this.positions[Math.floor(Math.random() * this.positions.length)];
      } else {
        return this.positions[0]; // Default position or any other logic
      }
    },
    generateRandomArray(level, length) {
      const randomArray = [];

      for (let i = 0; i < length; i++) {
        randomArray.push({
          color: this.getRandomWeightedColor(level),
          position: this.getRandomPosition(level),
        });
      }

      return randomArray;
    },
  },
  created() {
    // Example usage
    const level = 'very_difficult'; // This can be any difficulty level
    const length = 10; // Desired length of the resulting array
    const randomizedArray = this.generateRandomArray(level, length);
    console.log(randomizedArray);
  },
};

</script>
