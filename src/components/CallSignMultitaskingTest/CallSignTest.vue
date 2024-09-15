<template>
    <div class="callsign-test">
        <div class="input-group">
            <input type="number" v-model="userInput" ref="callsignInput" />
            <p>↵</p>
        </div>
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
        },
        updateResults: Function,
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
            result: {
                right: 0,
                wrong: 0
            },
            focus: false
        };
    },
    mounted() {
        this.initializeTest()
        window.addEventListener('keydown', this.checkAnswer);
    },
    beforeUnmount() {
        this.cleanup();
        window.removeEventListener('keydown', this.checkAnswer);
    },
    methods: {
        initializeTest() {
            this.initVisual();
            this.callsign = this.generateCallSign();
            this.drawVisual();
            if (this.callsignData.play) {
                this.initConfig();
                // this.initSpeech()
            }
        },
        initVisual() {
            const canvas = this.$refs.callsignCanvas;
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            this.ctx = canvas.getContext("2d");
        },
        initSpeech() {
            if (window.speechSynthesis) {
                const maxWaitTime = 3000; // 3 seconds
                const startTime = Date.now();

                const checkVoices = () => {
                    if (window.speechSynthesis.getVoices().length > 0) {
                        this.startTest();
                    } else if (Date.now() - startTime < maxWaitTime) {
                        setTimeout(checkVoices, 100);
                    } else {
                        console.warn('Timed out waiting for voices, starting anyway');
                        this.startTest();
                    }
                };

                window.speechSynthesis.onvoiceschanged = checkVoices;
                checkVoices(); // Start checking immediately
            } else {
                this.startTest();
            }
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
        initConfig() {
            const frequencyMap = {
                'often': Math.floor(Math.random() * 11) * 1000 + 10000,
                'medium':  Math.floor(Math.random() * 11) * 1000 + 20000,
                'seldom': Math.floor(Math.random() * 11) * 1000 + 30000
            };

            const matchesMap = {
                'low': 0.3,
                'medium': 0.5,
                'high': 0.7
            };

            this.intervalTime = frequencyMap[this.callsignData.frequency] || 20000;
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

            // Try to resume audio context
            if (window.speechSynthesis.resume) {
                window.speechSynthesis.resume();
            }

            if (window.speechSynthesis.paused) {
                console.log('Speech synthesis was paused, resuming...');
                window.speechSynthesis.resume();
            }

            this.lastSpokenCallsign = callsign;

            // format callsign
            let formattedCallsign = callsign.split('').join(', ');
            formattedCallsign = formattedCallsign.replace(/(\d)/g, (match, p1) => {
                const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                return numberWords[parseInt(p1)];
            });

            // format heading
            let formattedHeading = this.angle.toString().split('').join(', ');
            formattedHeading = formattedHeading.replace(/(\d)/g, (match, p1) => {
                const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                return numberWords[parseInt(p1)];
            });

            this.speech = new SpeechSynthesisUtterance(`your callsign is: ${formattedCallsign}, and new heading is: ${formattedHeading}`);

            if (this.callsign === callsign) {
                this.updateResults('call_sign', { total_match_count: 1 });
            }

            window.speechSynthesis.speak(this.speech);

            // Check if speech actually started
            setTimeout(() => {
                if (!window.speechSynthesis.speaking) {
                    console.warn('Speech did not start, attempting to speak again');
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(this.speech);
                }
            }, 1000);  // Check after 1 second

            this.speech.onerror = (event) => {
                if (event.error === 'not-allowed') {
                    console.warn('Speech synthesis not allowed. User interaction may be required.');
                }
            };
        },
        startTest() {
            this.intervalId = setInterval(() => {
                this.generateAngle();
                const callsignToSpeak = Math.random() < this.matchesCall ? this.callsign : this.generateCallSign();
                this.speak(callsignToSpeak);
                if (this.callsign === callsignToSpeak) {
                    this.updateResults('call_sign', { total_match_count: 1 });
                }
            }, this.intervalTime);
        },
        cleanup() {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                this.intervalTime = 0
            }
        },
        startSpeechTest() {
            if (this.callsignData.play) {
                this.initSpeech()
            }
        },
        checkAnswer(event) {
            if (event.key === 'Enter') {
                if (!this.focus) {
                    this.focus = true
                    this.$refs.callsignInput.focus()
                } else {
                    const isAngleCorrect = this.userInput === this.angle;
                    const isCallsignCorrect = this.callsign === this.lastSpokenCallsign;

                    if (isAngleCorrect && isCallsignCorrect) {
                        this.updateResults('call_sign', { correct_response: 1 });
                    } else {
                        this.updateResults('call_sign', { wrong_response: 1 });
                    }

                    this.userInput = '';
                    this.$refs.callsignInput.blur()
                    this.focus = false
                }
            }
        },

    }
};
</script>

<style scoped>
.callsign-test {
    position: relative;
}

.input-group {
    position: absolute;
    top: 0%;
    right: 20%;
    padding-left: 10px;
    display: flex;
    align-items: center;
}

.input-group p {
    font-size: 24px;
}

input {
    width: 70px;
    height: 24px;
    margin-right: 10px;
    border: 1px solid black;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    margin: 0;
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

.result {
    position: absolute;
    top: 0
}
</style>
