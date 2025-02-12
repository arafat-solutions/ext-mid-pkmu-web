<template>
  <div class="plane-simulation-wrapper">
    <div class="plane-simulation-container">
      <div class="timer" v-if="config.duration !== 99999">
        {{ formatTime(remainingTime) }}
      </div>
      <div
        class="instructions"
        v-if="config.subtask.navigation && config.subtask.observer"
      >
        Press 'Space bar' to switch tasks
      </div>
      <div class="game-content">
        <div class="instruments-left" v-if="config.subtask.observer">
          <div
            class="instrument"
            v-for="(instrument, index) in instrumentsLeft"
            :key="index"
            @click="handleInstrumentClick(instrument.key)"
          >
            <svg
              :ref="'gauge' + index"
              width="120"
              height="120"
              viewBox="0 0 120 120"
            ></svg>
            <div class="instrument-key">{{ instrument.key }}</div>
            <div class="wrong-inputs">
              Wrong: {{ wrongInputs[instrument.key] }}
            </div>
          </div>
        </div>
        <div class="simulation-box" v-if="config.subtask.navigation">
          <canvas ref="simulationCanvas" width="800" height="500"></canvas>
        </div>
        <div class="instruments-right" v-if="config.subtask.observer">
          <div
            class="instrument"
            v-for="(instrument, index) in instrumentsRight"
            :key="index"
            @click="handleInstrumentClick(instrument.key)"
          >
            <svg
              :ref="'gauge' + (index + 2)"
              width="120"
              height="120"
              viewBox="0 0 120 120"
            ></svg>
            <div class="instrument-key">{{ instrument.key }}</div>
            <div class="wrong-inputs">
              Wrong: {{ wrongInputs[instrument.key] }}
            </div>
          </div>
        </div>
      </div>
      <div class="collision-count" v-if="config.subtask.navigation">
        Collisions: {{ collisionCount }}
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "PlaneSimulator",
  emits: ["test-finished", "switch-task"],
  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      plane: {
        x: 400,
        targetX: 400,
        y: 200,
        angle: 0,
      },
      obstacles: [],
      instrumentsLeft: [
        { key: "C", value: 0, targetValue: 0, speed: 1 },
        { key: "V", value: 0, targetValue: 0, speed: 1 },
      ],
      instrumentsRight: [
        { key: "N", value: 0, targetValue: 0, speed: 1 },
        { key: "B", value: 0, targetValue: 0, speed: 1 },
      ],
      gaugeUpdateFunctions: [],
      gaugeSpeed: "",
      increaseFrequency: "",
      collisionCount: 0,
      lastCollisionTime: 0,
      gamepadIndex: null,
      duration: 600, // in seconds
      remainingTime: 600,
      joystickState: {
        x: 0,
        y: 0,
      },
      isPaused: false,
      isCollision: false,
      obstacleSpeed: 2,
      obstacleDensity: "medium",
      controlPerspective: "cockpit_crew",
      gaugeTimers: {
        C: null,
        V: null,
        N: null,
        B: null,
      },
      gaugeLateTime: {
        C: 0,
        V: 0,
        N: 0,
        B: 0,
      },
      wrongInputs: {
        C: 0,
        V: 0,
        N: 0,
        B: 0,
      },
      redZoneThreshold: 75,
    };
  },
  computed: {
    timerWidth() {
      return (this.remainingTime / this.duration) * 100;
    },
  },
  mounted() {
    this.initializeGame();
  },
  activated() {
    this.resumeGame();
  },
  deactivated() {
    this.pauseGame();
  },
  methods: {
    initializeGame() {
      this.setRandomObstacleConfig();
      if (this.config.subtask.observer) {
        this.initGauges();
      }
      this.startGameLoops();
      this.setupEventListeners();
    },
    startGameLoops() {
      if (this.config.subtask.navigation) {
        this.obstacleInterval = setInterval(this.moveObstacles, 30);
        this.generationInterval = setInterval(
          this.generateObstacles,
          this.getObstacleGenerationInterval()
        );
      }
      if (this.config.subtask.observer) {
        this.gaugeInterval = setInterval(this.updateGauges, 50);
        this.randomGaugeInterval = setInterval(this.randomGaugeIncrease, 2000);
      }
      this.animatePlane();
      this.startTimer();
    },
    setupEventListeners() {
      // if (this.config.subtask.navigation) {
      //   window.addEventListener('gamepadconnected', this.onGamepadConnected);
      //   window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
      // }
      window.addEventListener("keydown", this.handleKeydown);
      // this.checkGamepad();
    },
    removeEventListeners() {
      // if (this.config.subtask.navigation) {
      //   window.removeEventListener('gamepadconnected', this.onGamepadConnected);
      //   window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
      // }
      window.removeEventListener("keydown", this.handleKeydown);
    },
    pauseGame() {
      this.isPaused = true;
      clearInterval(this.obstacleInterval);
      clearInterval(this.generationInterval);
      clearInterval(this.gaugeInterval);
      clearInterval(this.randomGaugeInterval);
      clearInterval(this.timerInterval);
      this.removeEventListeners();
    },
    resumeGame() {
      this.isPaused = false;
      this.startGameLoops();
      this.setupEventListeners();
    },
    setRandomObstacleConfig() {
      this.duration = this.config.duration * 60;
      this.remainingTime = this.duration;
      this.obstacleDensity = this.config.navigation.density;
      this.controlPerspective = this.config.navigation.control_perspective;
      const speed = this.config.navigation.speed;
      this.obstacleDensity = this.config.navigation.density;

      switch (speed) {
        case "very_slow":
          this.obstacleSpeed = 1;
          break;
        case "slow":
          this.obstacleSpeed = 1.5;
          break;
        case "medium":
          this.obstacleSpeed = 2;
          break;
        case "fast":
          this.obstacleSpeed = 2.5;
          break;
        case "very_fast":
          this.obstacleSpeed = 3;
          break;
      }

      // gauge cluster
      this.gaugeSpeed = this.config.observer.speed;
      this.increaseFrequency = this.config.observer.frequency;
    },
    getObstacleGenerationInterval() {
      switch (this.obstacleDensity) {
        case "very_slow":
          return 3000;
        case "slow":
          return 2500;
        case "medium":
          return 2000;
        case "fast":
          return 1500;
        case "very_fast":
          return 1000;
      }
    },
    handleGamepadInput(gamepad) {
      const [leftStickX] = gamepad.axes;
      this.joystickState.x =
        this.controlPerspective === "observer" ? -leftStickX : leftStickX;
    },
    updatePlanePosition() {
      if (this.isPaused) return;

      const ease = 0.05;
      const movement = 1.5;

      if (Math.abs(this.joystickState.x) > 0.1) {
        this.plane.targetX += this.joystickState.x * movement;
        this.plane.targetX = Math.max(0, Math.min(this.plane.targetX, 740));
      }

      this.plane.x += (this.plane.targetX - this.plane.x) * ease;
    },
    // onGamepadConnected(event) {
    //   if (event.gamepad.id !== 'T.16000M (Vendor: 044f Product: b10a)') {
    //     return;
    //   }
    //   this.gamepadIndex = event.gamepad.index;
    //   this.checkGamepad();
    // },
    // onGamepadDisconnected(event) {
    //   if (this.gamepadIndex === event.gamepad.index) {
    //     this.gamepadIndex = null;
    //   }
    // },
    // checkGamepad() {
    //   if (this.gamepadIndex !== null) {
    //     const gamepad = navigator.getGamepads()[this.gamepadIndex];
    //     if (gamepad) {
    //       this.handleGamepadInput(gamepad);
    //     }
    //   }
    //   requestAnimationFrame(this.checkGamepad);
    // },
    animatePlane() {
      const canvas = this.$refs.simulationCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = require("@/assets/top-view.png");
      img.onload = () => {
        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          this.updatePlanePosition();

          ctx.save();
          ctx.translate(this.plane.x, this.plane.y);
          ctx.rotate((this.plane.angle * Math.PI) / 180);
          ctx.drawImage(img, -30, -30, 60, 60);
          ctx.restore();
          this.drawObstacles(ctx);

          this.checkCollision();
          requestAnimationFrame(animate);
        };
        animate();
      };
    },
    drawObstacles(ctx) {
      for (const obstacle of this.obstacles) {
        ctx.fillStyle = "black";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    },
    initGauges() {
      const gauges = [...this.instrumentsLeft, ...this.instrumentsRight];
      this.gaugeUpdateFunctions = gauges.map((instrument, index) => {
        const svg = d3.select(this.$refs[`gauge${index}`][0]);
        return this.createGauge(svg, instrument);
      });
    },
    createGauge(svg, instrument) {
      const width = 120;
      const height = 120;
      const radius = Math.min(width, height) / 2;
      const centerX = width / 2;
      const centerY = height / 2;

      svg.selectAll("*").remove();

      svg
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius)
        .attr("fill", "#f0f0f0");

      const sections = [
        { startAngle: -Math.PI / 2, endAngle: -Math.PI / 4, color: "#4CAF50" },
        { startAngle: -Math.PI / 4, endAngle: 0, color: "#FFEB3B" },
        { startAngle: 0, endAngle: Math.PI / 4, color: "#FF9800" },
        { startAngle: Math.PI / 4, endAngle: Math.PI / 2, color: "#F44336" },
      ];

      const arc = d3
        .arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.8);

      sections.forEach((section) => {
        svg
          .append("path")
          .attr(
            "d",
            arc({ startAngle: section.startAngle, endAngle: section.endAngle })
          )
          .attr("fill", section.color)
          .attr("transform", `translate(${centerX},${centerY})`);
      });

      const needle = svg
        .append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", centerX)
        .attr("y2", centerY - radius * 0.7)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("transform", `rotate(0, ${centerX}, ${centerY})`);

      const valueText = svg
        .append("text")
        .attr("x", centerX)
        .attr("y", centerY + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold");

      const updateGauge = (value) => {
        const angle = this.valueToAngle(value);
        needle.attr("transform", `rotate(${angle}, ${centerX}, ${centerY})`);
        valueText.text(Math.round(value));

        if (
          value >= this.redZoneThreshold &&
          !this.gaugeTimers[instrument.key]
        ) {
          this.gaugeTimers[instrument.key] = setInterval(() => {
            this.gaugeLateTime[instrument.key] += 10;
          }, 10);
        } else if (
          value < this.redZoneThreshold &&
          this.gaugeTimers[instrument.key]
        ) {
          clearInterval(this.gaugeTimers[instrument.key]);
          this.gaugeTimers[instrument.key] = null;
        }
      };

      updateGauge(instrument.value);
      return updateGauge;
    },
    valueToAngle(value) {
      return (value / 100) * 180 - 90;
    },
    updateGauges() {
      [...this.instrumentsLeft, ...this.instrumentsRight].forEach(
        (instrument, index) => {
          if (Math.abs(instrument.value - instrument.targetValue) > 0.1) {
            instrument.value +=
              (instrument.targetValue - instrument.value) *
              0.1 *
              instrument.speed;
          } else {
            instrument.value = instrument.targetValue;
          }
          const updateGauge = this.gaugeUpdateFunctions[index];
          if (updateGauge) {
            updateGauge(instrument.value);
          }
        }
      );
    },
    handleKeydown(event) {
      if (
        event.key === " " &&
        this.config.subtask.navigation &&
        this.config.subtask.observer
      ) {
        this.$emit("switch-task");
        return;
      }

      if (this.isPaused) return;

      if (this.config.subtask.navigation) {
        switch (event.key) {
          case "a":
          case "A":
            this.plane.targetX = Math.max(this.plane.x - 80, 0);
            break;
          case "d":
          case "D":
            this.plane.targetX = Math.min(this.plane.x + 80, 740);
            break;
        }
      }

      if (this.config.subtask.observer) {
        switch (event.key) {
          case "c":
          case "C":
          case "v":
          case "V":
          case "n":
          case "N":
          case "b":
          case "B":
            this.handleInstrumentKey(event.key.toUpperCase());
            break;
        }
      }
    },
    handleInstrumentClick(key) {
      const instrument = [
        ...this.instrumentsLeft,
        ...this.instrumentsRight,
      ].find((i) => i.key === key);
      if (instrument) {
        if (instrument.value >= this.redZoneThreshold) {
          instrument.targetValue = 0;
          this.updateGauges();

          if (this.gaugeTimers[key]) {
            clearInterval(this.gaugeTimers[key]);
            this.gaugeTimers[key] = null;
            console.log(`Late time for ${key}: ${this.gaugeLateTime[key]}ms`);
            this.gaugeLateTime[key] = 0;
          }
        } else {
          // Count as wrong input
          this.wrongInputs[key]++;
          console.log(
            `Wrong input for ${key}. Total wrong inputs: ${this.wrongInputs[key]}`
          );
        }
      }
    },

    handleInstrumentKey(key) {
      this.handleInstrumentClick(key);
    },
    checkCollision() {
      const currentTime = Date.now();
      const planeRect = {
        left: this.plane.x - 30,
        right: this.plane.x + 30,
        top: this.plane.y - 30,
        bottom: this.plane.y + 30,
      };

      let currentCollision = false;

      for (const obstacle of this.obstacles) {
        const obstacleRect = {
          left: obstacle.x,
          right: obstacle.x + obstacle.width,
          top: obstacle.y,
          bottom: obstacle.y + obstacle.height,
        };
        if (
          planeRect.left < obstacleRect.right &&
          planeRect.right > obstacleRect.left &&
          planeRect.top < obstacleRect.bottom &&
          planeRect.bottom > obstacleRect.top
        ) {
          currentCollision = true;

          if (
            !this.isCollision &&
            currentTime - this.lastCollisionTime > 2000
          ) {
            this.collisionCount++;
            this.lastCollisionTime = currentTime;
          }
          break;
        }
      }

      this.isCollision = currentCollision;

      if (!this.isCollision) {
        this.moveObstacles();
      }
    },
    moveObstacles() {
      if (this.isPaused || this.isCollision) return;

      for (const obstacle of this.obstacles) {
        obstacle.y -= this.obstacleSpeed;
        if (obstacle.y < -20) {
          const index = this.obstacles.indexOf(obstacle);
          this.obstacles.splice(index, 1);
        }
      }
    },
    generateObstacles() {
      if (this.isPaused) return;

      // Check if there's enough vertical space for new obstacles
      const lastObstacleY = Math.max(...this.obstacles.map((o) => o.y), 0);
      if (500 - lastObstacleY < 100) return; // Ensure at least 100px vertical gap

      const numberOfObstacles = Math.floor(Math.random() * 2) + 3; // 3 to 4 obstacles
      const minWidth = 40;
      const maxWidth = 120;
      const minGap = 60;
      const canvasWidth = 800;

      let obstacleData = [];
      let totalWidth = 0;

      // Generate initial set of obstacles
      for (let i = 0; i < numberOfObstacles; i++) {
        const width =
          Math.floor(Math.random() * (maxWidth - minWidth)) + minWidth;
        obstacleData.push({ width, x: 0 });
        totalWidth += width;
      }

      // Adjust widths if total exceeds canvas width
      if (totalWidth > canvasWidth - (numberOfObstacles - 1) * minGap) {
        const scale =
          (canvasWidth - (numberOfObstacles - 1) * minGap) / totalWidth;
        obstacleData = obstacleData.map((o) => ({
          ...o,
          width: Math.floor(o.width * scale),
        }));
        totalWidth = obstacleData.reduce((sum, o) => sum + o.width, 0);
      }

      // Distribute obstacles across canvas width
      let availableSpace = canvasWidth - totalWidth;

      // Randomly decide if we want an obstacle at the leftmost edge
      const startAtZero = Math.random() < 0.3; // 30% chance to start at zero

      for (let i = 0; i < numberOfObstacles; i++) {
        if (i === 0 && startAtZero) {
          obstacleData[i].x = 0;
        } else if (i === 0) {
          // For the first obstacle, if not starting at zero, position it randomly
          obstacleData[i].x = Math.floor(Math.random() * (availableSpace / 2));
        } else {
          // For subsequent obstacles, ensure there's at least minGap space from the previous obstacle
          const minX =
            obstacleData[i - 1].x + obstacleData[i - 1].width + minGap;
          const maxX = canvasWidth - obstacleData[i].width;
          if (minX < maxX) {
            obstacleData[i].x =
              Math.floor(Math.random() * (maxX - minX + 1)) + minX;
          } else {
            // If we can't fit this obstacle, adjust its width
            obstacleData[i].width = canvasWidth - minX;
            obstacleData[i].x = minX;
          }
        }
        availableSpace -=
          obstacleData[i].x -
          (i > 0 ? obstacleData[i - 1].x + obstacleData[i - 1].width : 0);
      }

      // Create obstacle objects
      this.obstacles.push(
        ...obstacleData.map((o, index) => ({
          id: Date.now() + index,
          y: 500,
          x: o.x,
          width: o.width,
          height: 10,
        }))
      );
    },
    // Updated randomGaugeIncrease function
    randomGaugeIncrease() {
      if (this.isPaused) return;

      const increaseChance = this.getIncreaseChance();
      const increaseAmount = this.getIncreaseAmount();

      [...this.instrumentsLeft, ...this.instrumentsRight].forEach(
        (instrument) => {
          if (Math.random() < increaseChance) {
            instrument.targetValue = Math.min(
              instrument.targetValue + increaseAmount,
              100
            );
          }
        }
      );
    },

    // Helper method to determine increase chance based on frequency
    getIncreaseChance() {
      switch (this.increaseFrequency) {
        case "very_seldom":
          return 0.1;
        case "seldom":
          return 0.25;
        case "moderate":
          return 0.5;
        case "frequent":
          return 0.75;
        case "very_frequent":
          return 0.9;
        default:
          return 0.5;
      }
    },

    // Helper method to determine increase amount based on speed
    getIncreaseAmount() {
      switch (this.gaugeSpeed) {
        case "very_slow":
          return Math.random() * 2 + 1; // 1-3
        case "slow":
          return Math.random() * 3 + 2; // 2-5
        case "medium":
          return Math.random() * 4 + 3; // 3-7
        case "fast":
          return Math.random() * 5 + 5; // 5-10
        case "very_fast":
          return Math.random() * 7 + 8; // 8-15
        default:
          return Math.random() * 4 + 3; // 3-7 (medium)
      }
    },

    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.isPaused) return;
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          clearInterval(this.timerInterval);
          this.finishGame();
        }
      }, 1000);
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },
    finishGame() {
      this.pauseGame();
      console.log("Game finished");
      this.$emit("test-finished", {
        collisionCount: this.collisionCount,
        gaugeLateTime: this.gaugeLateTime,
        wrongInputs: this.wrongInputs,
      });
      console.log(`Collisions: ${this.collisionCount}`);
      console.log(`Late time for C: ${this.gaugeLateTime.C}ms`);
      console.log(`Late time for V: ${this.gaugeLateTime.V}ms`);
      console.log(`Late time for N: ${this.gaugeLateTime.N}ms`);
      console.log(`Late time for B: ${this.gaugeLateTime.B}ms`);
    },
  },
};
</script>

<style scoped>
.plane-simulation-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f0f0;
}

.plane-simulation-container {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.game-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.timer {
  height: 50px;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: width 1s linear;
  border-radius: 5px;
  margin-bottom: 10px;
}

.instructions {
  text-align: center;
  margin-bottom: 20px;
}

.instruments-left,
.instruments-right {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 500px;
}

.instrument {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.instrument-key {
  margin-top: 5px;
  font-weight: bold;
}

.simulation-box {
  position: relative;
  width: 800px;
  height: 500px;
  border: 2px solid black;
  overflow: hidden;
  margin: 0 20px;
}

.collision-count {
  text-align: center;
  margin-top: 20px;
  font-weight: bold;
}

.instrument.clickable {
  cursor: pointer;
}

.instrument.clickable::after {
  content: "Click!";
  color: red;
  font-weight: bold;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.wrong-inputs {
  font-size: 12px;
  color: red;
  margin-top: 5px;
}
</style>