<template>
    <div>
        <div>Time Remaining: {{ timeRemaining }} seconds</div>
        <canvas ref="mazeCanvas" :width="canvasSize" :height="canvasSize" tabindex="0" @keydown="movePlayer"></canvas>
        <div>
            <button @click="generateMaze">Generate New Maze</button>
            <button @click="findAndRenderPath">Find Path</button>
        </div>
        <div class="result">
            <p>correctTurn: {{ quizMetrics.correctTurn }}</p>
            <p>wrongTurn: {{ quizMetrics.wrongTurn }}</p>
            <p>leastPossibleMove: {{ quizMetrics.leastPossibleMove }}</p>
            <p>wallHit: {{ quizMetrics.wallHit }}</p>
            <p>avgStepResponse: {{ quizMetrics.avgStepResponse.toFixed(2) }} ms</p>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            maze: [],
            path: [],
            size: 30,
            cellSize: 15,
            canvasSize: 450,
            ctx: null,
            playerPos: [0, 0],
            goalPos: [12, 12],
            renderInterval: null,
            quizMetrics: {
                correctTurn: 0,
                wrongTurn: 0,
                leastPossibleMove: 0,
                wallHit: 0,
                avgStepResponse: 0,
            },
            stepStartTime: null,
            totalStepTime: 0,
            totalSteps: 0,
            // config below
            difficulty: 'normal',
            difficultyConfig: {
                easy: {
                    size: 15,
                    wallDensity: 0.3,
                    timeLimit: 120 // in seconds
                },
                normal: {
                    size: 40,
                    wallDensity: 0.4,
                    timeLimit: 90 // in seconds
                },
                hard: {
                    size: 25,
                    wallDensity: 0.5,
                    timeLimit: 60 // in seconds
                }
            },
            timeRemaining: 0,
            timerInterval: null,
        }
    },
    methods: {
        generateMaze() {
            this.resetMetrics();
            this.generateRandomPosition()
            const config = this.difficultyConfig[this.difficulty];
            this.size = config.size;
            this.canvasSize = this.size * this.cellSize;

            // Initialize maze as a 2D array
            this.maze = Array(this.size).fill().map(() => Array(this.size).fill(0));

            // Generate walls based on wallDensity
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    if (Math.random() < config.wallDensity) {
                        this.maze[y][x] = 1;
                    }
                }
            }

            // Ensure playerPos and goalPos are within bounds
            if (this.playerPos[1] >= this.size) this.playerPos[1] = this.size - 1;
            if (this.playerPos[0] >= this.size) this.playerPos[0] = this.size - 1;
            if (this.goalPos[1] >= this.size) this.goalPos[1] = this.size - 1;
            if (this.goalPos[0] >= this.size) this.goalPos[0] = this.size - 1;

            // Clear the player and goal positions
            this.maze[this.playerPos[1]][this.playerPos[0]] = 0;
            this.maze[this.goalPos[1]][this.goalPos[0]] = 0;

            this.ensurePathExists();
            this.clearPath();
            console.log("Maze generated:", this.maze);
            this.drawMaze();

            // Start the timer
            this.startTimer(config.timeLimit);
        },

        ensurePathExists() {
            let x = this.playerPos[0], y = this.playerPos[1];
            while (x !== this.goalPos[0] || y !== this.goalPos[1]) {
                if (x < this.goalPos[0] && (Math.random() < 0.5 || y === this.goalPos[1])) {
                    this.maze[y][x + 1] = 0;
                    x++;
                } else if (y < this.goalPos[1]) {
                    this.maze[y + 1][x] = 0;
                    y++;
                } else if (x > this.goalPos[0]) {
                    this.maze[y][x - 1] = 0;
                    x--;
                } else if (y > this.goalPos[1]) {
                    this.maze[y - 1][x] = 0;
                    y--;
                }
            }
        },
        carvePath(x, y) {
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            directions.sort(() => Math.random() - 0.5);

            for (let [dx, dy] of directions) {
                let nx = x + dx * 2, ny = y + dy * 2;
                if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1 && this.maze[ny][nx] === 1) {
                    this.maze[y + dy][x + dx] = 0;
                    this.maze[ny][nx] = 0;
                    this.carvePath(nx, ny);
                }
            }
        },
        drawMaze() {
            this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    if (this.maze[y][x] === 1) {
                        this.ctx.fillStyle = '#333';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    }
                }
            }
            this.drawPlayer();
            this.drawGoal();
        },
        drawPlayer() {
            this.ctx.fillStyle = '#00f';
            this.ctx.beginPath();
            this.ctx.arc(
                this.playerPos[0] * this.cellSize + this.cellSize / 2,
                this.playerPos[1] * this.cellSize + this.cellSize / 2,
                this.cellSize / 3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        },
        drawGoal() {
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(
                this.goalPos[0] * this.cellSize + this.cellSize / 2,
                this.goalPos[1] * this.cellSize + this.cellSize / 2,
                this.cellSize / 3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        },
        findAndRenderPath() {
            // this.printMaze();
            const pathFound = this.findPath();
            if (pathFound) {
                this.quizMetrics.leastPossibleMove = this.path.length - 1; // -1 because the start position is included
                this.drawMaze();
                this.drawPath();
            } else {
                console.log("No path found");
            }
        },
        findPath() {
            const queue = [[this.playerPos[0], this.playerPos[1]]];
            const visited = new Set([`${this.playerPos[0]},${this.playerPos[1]}`]);
            const parent = new Map();
            // const goalKey = `${this.goalPos[0]},${this.goalPos[1]}`;

            while (queue.length > 0) {
                const [x, y] = queue.shift();
                if (x === this.goalPos[0] && y === this.goalPos[1]) {
                    this.reconstructPath(parent, this.goalPos);
                    return true; // Path found
                }

                for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
                    const nx = x + dx, ny = y + dy;
                    const key = `${nx},${ny}`;
                    if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size &&
                        (this.maze[ny][nx] === 0 || this.maze[ny][nx] === 3) && !visited.has(key)) {
                        queue.push([nx, ny]);
                        visited.add(key);
                        parent.set(key, [x, y]);
                    }
                }
            }

            console.log("No path found");
            return false; // No path found
        },

        printMaze() {
            let mazeString = '';
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    if (this.maze[y][x] === 1) mazeString += '█';
                    else if (this.maze[y][x] === 2) mazeString += 'S';
                    else if (this.maze[y][x] === 3) mazeString += 'E';
                    else mazeString += ' ';
                }
                mazeString += '\n';
            }
            console.log(mazeString);
        },

        reconstructPath(parent, end) {
            this.path = [end];
            let current = end;
            while (parent.has(`${current[0]},${current[1]}`)) {
                current = parent.get(`${current[0]},${current[1]}`);
                this.path.unshift(current);
            }
        },

        drawPath() {
            if (this.path.length === 0) {
                console.log("Path is empty, not drawing");
                return;
            }

            this.ctx.strokeStyle = '#ff0';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.path[0][0] * this.cellSize + this.cellSize / 2,
                this.path[0][1] * this.cellSize + this.cellSize / 2);
            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(this.path[i][0] * this.cellSize + this.cellSize / 2,
                    this.path[i][1] * this.cellSize + this.cellSize / 2);
            }
            this.ctx.stroke();
        },
        clearPath() {
            this.path = [];
        },
        movePlayer(event) {
            const key = event.key;
            let [x, y] = this.playerPos;
            let newX = x, newY = y;

            if (key === 'ArrowUp') newY--;
            else if (key === 'ArrowDown') newY++;
            else if (key === 'ArrowLeft') newX--;
            else if (key === 'ArrowRight') newX++;

            // Start timing the step
            if (!this.stepStartTime) {
                this.stepStartTime = performance.now();
            }

            if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size && this.maze[newY][newX] !== 1) {
                // Valid move
                this.playerPos = [newX, newY];
                this.drawMaze();
                if (this.path.length > 0) {
                    this.drawPath();
                }

                // Check if the move follows the path
                const nextPathIndex = this.path.findIndex(([px, py]) => px === x && py === y) + 1;
                if (nextPathIndex < this.path.length && this.path[nextPathIndex][0] === newX && this.path[nextPathIndex][1] === newY) {
                    this.quizMetrics.correctTurn++;
                } else {
                    this.quizMetrics.wrongTurn++;
                }

                // Update step time
                const stepEndTime = performance.now();
                const stepTime = stepEndTime - this.stepStartTime;
                this.totalStepTime += stepTime;
                this.totalSteps++;
                this.quizMetrics.avgStepResponse = this.totalStepTime / this.totalSteps;

                this.stepStartTime = null; // Reset for next step
            } else {
                // Wall hit
                this.quizMetrics.wallHit++;
            }

            // Display metrics after each move
            // this.displayMetrics();

            // Check if player has reached the end
            if (newX === this.size - 2 && newY === this.size - 2) {
                clearInterval(this.timerInterval);
                this.gameOver(`Congratulations! You've reached the end!`);
            }
        },
        resetMetrics() {
            this.quizMetrics = {
                correctTurn: 0,
                wrongTurn: 0,
                leastPossibleMove: 0,
                wallHit: 0,
                avgStepResponse: 0,
            };
            this.totalStepTime = 0;
            this.totalSteps = 0;
            this.stepStartTime = null;
        },
        displayMetrics() {
            console.log('Quiz Metrics:');
            console.log(`Correct Turns: ${this.quizMetrics.correctTurn}`);
            console.log(`Wrong Turns: ${this.quizMetrics.wrongTurn}`);
            console.log(`Least Possible Moves: ${this.quizMetrics.leastPossibleMove}`);
            console.log(`Wall Hits: ${this.quizMetrics.wallHit}`);
            console.log(`Average Step Response Time: ${this.quizMetrics.avgStepResponse.toFixed(2)} ms`);
        },
        // changeDifficulty(newDifficulty) {
        //     this.difficulty = newDifficulty;
        //     this.generateMaze();
        // },
        startTimer(timeLimit) {
            this.timeRemaining = timeLimit;
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                this.timeRemaining--;
                if (this.timeRemaining <= 0) {
                    clearInterval(this.timerInterval);
                    this.gameOver(`Time's up!`);
                }
            }, 1000);
        },

        gameOver(message) {
            console.log(message);
            this.displayMetrics();
            // Add any other game over logic here
        },
        getRandomNumber(number) {
            return Math.floor(Math.random() * number); // Generates random number from 0 to 28
        },
        generateRandomPosition() {
            const config = this.difficultyConfig[this.difficulty];
            const newPlayer = [this.getRandomNumber(config.size), this.getRandomNumber(config.size)]
            const newGoal = [config.size, this.getRandomNumber(config.size)]

            console.log(newPlayer, newGoal)

            // this.playerPos = newPlayer
            this.goalPos = newGoal
        }
    },
    mounted() {
        this.ctx = this.$refs.mazeCanvas.getContext('2d');
        this.generateMaze();
        this.$refs.mazeCanvas.focus();
    },
}
</script>

<style scoped>
canvas {
    border: 1px solid #ccc;
}

button {
    margin: 10px 5px;
}
</style>