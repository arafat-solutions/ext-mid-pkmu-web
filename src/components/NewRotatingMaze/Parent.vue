<template>
    <div class="container">
        <div class="circular-base">
            <div class="maze-container" :style="rotationStyle">
                <maze :strategy="strategy" :difficulty="difficulty" @start="onStart" @finish="onMazeFinish"
                    @init="onInit" @move="onMazeMove" @wallHit="onWallHit" :style="mazeStyle"></maze>
                <div class="rotation-indicator"></div>
            </div>
        </div>
        <div class="timer">
            <p>Waktu:</p>
            <p>{{ formatTime(testTime) }}</p>
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
import Maze from './Maze.vue';

export default {
    name: 'NewRotatingMaze',
    components: {
        Maze
    },
    data() {
        return {
            testTime: 10 * 60,
            tesInterval: null,
            mazeStyle: {
                width: '400px',
                height: '400px',
                backgroundColor: 'white'
            },
            strategy: 'cluster', //cluster, dig
            difficulty: 'hard', // easy, normal, hard
            rotation: 0,
            rotationSpeed: 30, // speed of rotation per second
            rotationDuration: 5000, // milliseconds
            isRotating: false,
            rotationInterval: 2000, // milliseconds
            quizMetrics: {
                correctTurn: 0,
                wrongTurn: 0,
                leastPossibleMove: 0,
                wallHit: 0,
                avgStepResponse: 0,
                totalSteps: 0,
                totalResponseTime: 0
            }
        }
    },
    computed: {
        rotationStyle() {
            return {
                transform: `rotate(${this.rotation}deg)`,
                transition: this.isRotating ? 'transform 0.1s linear' : 'none'
            }
        }
    },
    methods: {
        onStart() {
            this.startRotation();
            this.resetMetrics()
        },
        // onFinish() {
        //     this.stopRotation();
        // },
        onInit() {
            this.rotation = 0;
            this.isRotating = false;
        },
        resetMetrics() {
            this.quizMetrics = {
                correctTurn: 0,
                wrongTurn: 0,
                leastPossibleMove: 0,
                wallHit: 0,
                avgStepResponse: 0,
                totalSteps: 0,
                totalResponseTime: 0
            }
        },
        startRotation() {
            this.isRotating = true;
            const startTime = Date.now();
            const initialRotation = this.rotation;

            const rotationDirection = Math.random() < 0.5 ? 1 : -1;
            const currentRotationSpeed = this.rotationSpeed * rotationDirection;

            const animate = () => {
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < this.rotationDuration) {
                    this.rotation = initialRotation + currentRotationSpeed * elapsedTime / 1000
                    requestAnimationFrame(animate);
                } else {
                    this.isRotating = false;
                    setTimeout(() => {
                        this.startRotation();
                    }, this.rotationInterval);
                }
            };
            requestAnimationFrame(animate);
        },
        stopRotation() {
            this.isRotating = false;
        },
        onMazeMove(moveData) {
            this.quizMetrics.totalSteps++;
            this.quizMetrics.totalResponseTime += moveData.responseTime;
            this.quizMetrics.avgStepResponse = this.quizMetrics.totalResponseTime / this.quizMetrics.totalSteps;

            if (moveData.isCorrectTurn) {
                this.quizMetrics.correctTurn++;
            } else {
                this.quizMetrics.wrongTurn++;
            }
        },
        onWallHit() {
            this.quizMetrics.wallHit++;
        },
        onMazeFinish() {
            // wip
            // const startX = 0;
            // const startY = 0;
            // const goalX = this.maze.goal.x;
            // const goalY = this.maze.goal.y;
            // this.quizMetrics.leastPossibleMove = Math.abs(startX - goalX) + Math.abs(startY - goalY);
            this.stopRotation();
        },
        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
        },
        countDownTestTime() {
            this.tesInterval = setInterval(async () => {
                if (this.testTime > 0) {
                    this.testTime--;
                    // this.drawVisual()
                } else {
                    clearInterval(this.tesInterval);
                    // try {
                    //     await this.submitResult();
                    //     console.log('Test result submitted successfully');
                    // } catch (error) {
                    //     console.error('An error occurred while submitting the test result:', error);
                    // }
                }
            }, 1000)
        },
    },
    mounted() {
        this.countDownTestTime()
    },
    beforeUnmount() {
        clearInterval(this.tesInterval)
    }
}
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    position: relative;
    padding-top: 3%;
}

.circular-base {
    width: 500px;
    height: 500px;
    border-radius: 50%;
    border: 2px solid black;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.maze-container {
    position: relative;
    width: 400px;
    height: 400px;
}

.rotation-indicator {
    position: absolute;
    top: 50%;
    right: -65px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 20px solid black;
    transform: translateY(-50%);
}

.result {
    position: absolute;
    left: 0;
    margin-left: 30px;
}

.timer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    font-size: 24px;
    font-weight: bold;
    width: 300px;
    height: 60px;
    background-color: #6757dc;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
}

.timer p {
    margin: 0;
    padding: 0;
}

.timer :nth-child(1) {
    font-size: 12px;
}

.timer :nth-child(2) {
    font-size: 24px;
    margin-top: 4px
}

.loading-container {
    /* Add your loading indicator styles here */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    /* Black background with 80% opacity */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    /* Ensure it is above other content */
}

.loading-spinner {
    border: 8px solid rgba(255, 255, 255, 0.3);
    /* Light border */
    border-top: 8px solid #ffffff;
    /* White border for the spinning part */
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

.loading-text {
    color: #ffffff;
    margin-top: 20px;
    font-size: 1.2em;
}
</style>
