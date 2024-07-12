<template>
    <div class="container">
        <div class="circular-base">
            <div class="maze-container" :style="rotationStyle">
                <maze :strategy="strategy" :difficulty="difficulty" @start="onStart" @finish="onFinish" @init="onInit"
                    :style="mazeStyle"></maze>
            </div>
        </div>
        <div class="timer">
            <p>Waktu:</p>
            <p>{{ formatTime(testTime) }}</p>
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
            difficulty: 'easy', // easy, normal, hard
            rotation: 0,
            rotationSpeed: 30, // speed of rotation per second
            rotationDuration: 5000, // milliseconds
            isRotating: false,
            rotationInterval: 2000 // milliseconds
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
        },
        onFinish() {
            this.stopRotation();
        },
        onInit() {
            this.rotation = 0;
            this.isRotating = false;
        },
        startRotation() {
            this.isRotating = true;
            const startTime = Date.now();
            const initialRotation = this.rotation;
            const animate = () => {
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < this.rotationDuration) {
                    this.rotation = initialRotation + this.rotationSpeed * elapsedTime / 1000
                    requestAnimationFrame(animate);
                } else {
                    this.isRotating = false;
                    setTimeout(() => {
                        this.startRotation();
                    }, this.rotationInterval);
                }
            };
            requestAnimationFrame(animate);

            console.log(this.rotation, "<< rotation")
        },
        stopRotation() {
            this.isRotating = false;
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
    /* Larger than the maze */
    height: 500px;
    border-radius: 50%;
    border: 2px solid black;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.maze-container {
    width: 400px;
    height: 400px;
}

canvas {
    display: block;
    border: none;
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
