<template>
    <div class="callsign-test">
        <input class="input" v-model="userInput" @keyup.enter="checkAnswer" />
        <canvas ref="callsignCanvas"></canvas>
    </div>
</template>

<script>
export default {
    name: 'CallSignTest',
    props: {
        callsignData: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            callsign: "NA782",
            angle: 60,
            intervalId: null,
            intervalTime: 0,
            matchesCall: 0,
            speech: null,
            ctx: null,
            userInput: '',
            lastSpokenCallsign: '',
            results: {
                right: 0,
                wrong: 0
            }
        };
    },
    mounted() {
        this.initializeTest()
    },
    beforeUnmount() {
        this.cleanup();
    },
    methods: {
        initializeTest() {
            this.initVisual();
            this.callsign = this.generateCallSign();
            this.drawVisual();
            if (this.callsignData.play) {
                this.configureTest();
                this.startTest();
            }
        },
        initVisual() {
            const canvas = this.$refs.callsignCanvas;
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            this.ctx = canvas.getContext("2d");
        },
        drawVisual() {
            this.clearCanvas();
            this.drawText();
        },
        clearCanvas() {
            this.ctx.clearRect(0, 0, this.$refs.callsignCanvas.width, this.$refs.callsignCanvas.height);
        },
        drawText() {
            this.ctx.fillStyle = 'black';
            this.ctx.font = '12px Arial';
            this.ctx.fillText("Your callsign:", 5, 13);

            this.ctx.fillStyle = 'green';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(this.callsign, 90, 15);

            this.ctx.fillStyle = 'black';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('New heading:', 200, 15);
        },
        configureTest() {
            this.setIntervalTime();
            this.setMatchesCall();
        },
        setIntervalTime() {
            const frequencyMap = {
                'often': 10000,
                'medium': 20000,
                'seldom': 30000
            };
            this.intervalTime = frequencyMap[this.callsignData.frequency] || 20000;
        },
        setMatchesCall() {
            const matchesMap = {
                'low': 0.3,
                'medium': 0.5,
                'high': 0.7
            };
            this.matchesCall = matchesMap[this.callsignData.matches] || 0.5;
        },
        generateCallSign() {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            const getRandomChar = (charset) => charset[Math.floor(Math.random() * charset.length)];
            return Array(2).fill().map(() => getRandomChar(letters)).join('') +
                Array(3).fill().map(() => getRandomChar(numbers)).join('');
        },
        generateAngle() {
            this.angle = Math.floor(Math.random() * 721) - 360;
        },
        speak(callsign) {
            if (!window.speechSynthesis) {
                console.warn("Browser doesn't support text-to-speech.");
                return;
            }
            this.lastSpokenCallsign = callsign;
            this.speech = new SpeechSynthesisUtterance(`your callsign is: ${callsign}, and new heading is: ${this.angle}`);
            window.speechSynthesis.speak(this.speech);
        },
        startTest() {
            this.intervalId = setInterval(() => {
                this.generateAngle();
                const callsignToSpeak = Math.random() < this.matchesCall ? this.callsign : this.generateCallSign();
                this.speak(callsignToSpeak);
            }, this.intervalTime);
        },
        cleanup() {
            window.speechSynthesis.cancel();
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        },
        checkAnswer() {
            const inputAngle = parseInt(this.userInput.trim());
            const isAngleCorrect = inputAngle === this.angle;
            const isCallsignCorrect = this.callsign === this.lastSpokenCallsign;

            if (isAngleCorrect && isCallsignCorrect) {
                this.results.right++;
            } else {
                this.results.wrong++;
            }

            this.userInput = ''; // Clear the input field
            console.log(`Answer checked. Angle: ${isAngleCorrect ? 'Correct' : 'Incorrect'}, Callsign match: ${isCallsignCorrect ? 'Yes' : 'No'}`);
        }
    }
};
</script>

<style scoped>
.callsign-test {
    position: relative;
}

.input {
    position: absolute;
    top: -32%;
    right: 28%;
    width: 70px;
    height: 24px;
    background-color: white;
    border: 1px solid black;
}

canvas {
    border: none;
    margin-top: -30px;
}

button {
    position: absolute;
    top: -32%;
    right: 0
}
</style>
