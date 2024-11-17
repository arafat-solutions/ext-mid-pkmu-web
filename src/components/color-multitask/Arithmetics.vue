<template>
	<div class="arithmetic">
		<div class="question-container">
			<div class="question">
				<strong> Dengarkan dan masukkan jawaban Anda </strong>
			</div>
			<ul class="options">
				<li v-for="(option, index) in optionAnswerAudios" :key="index" class="option-item">
					<button class="option-button" :class="{ 'clickable': isCanChooseAudio }"
						@click="handleOptionClick(option.key)" :disabled="!isCanChooseAudio">
						<span class="option-answer">{{ option.key }}</span>
						<span class="option-value">{{ option.value }}</span>
					</button>
				</li>
			</ul>
		</div>
	</div>
</template>

<script>
export default {
	name: 'ArithmeticsView',
	data() {
		return {
			isCanChooseAudio: false,
			audio: null,
			correctAnswer: 0,
			totalQuestion: 0,
			currentQuestion: '',
			optionAnswerAudios: [
				{ key: 1, value: '' },
				{ key: 2, value: '' },
				{ key: 3, value: '' },
				{ key: 4, value: '' },
			],
			responseQuestion: 0,
			responseTime: 0,
			responseDurations: [],
			questionTimer: null,
			QUESTION_DURATION: 20000, // 20 seconds in milliseconds
			hasAnswered: false,
			currentUtterance: null, // Track current speech utterance
		};
	},
	props: {
		isTimesUp: Boolean,
		difficulty: String,
		duration: Number,
		isPause: Boolean,
		isActive: Boolean,
		useSound: Boolean,
	},
	async mounted() {
		if (this.useSound && this.isActive) {
			this.generateQuestion();
		}
	},
	created() {
		window.addEventListener('keyup', this.handleKeyPress);
	},
	beforeUnmount() {
		window.removeEventListener('keyup', this.handleKeyPress);
		this.cleanupQuestion();
	},
	watch: {
		isTimesUp() {
			this.cleanupQuestion();
			this.$emit('getResult', {
				correctAnswer: this.correctAnswer,
				totalQuestion: this.totalQuestion,
				responseTime: this.averageResponseTime(),
			});
		},
		isPause(newValue) {
			if (newValue) {
				this.cleanupQuestion();
			} else if (this.isActive && !this.isTimesUp) {
				// Small delay before starting new question when unpaused
				setTimeout(() => {
					this.generateQuestion();
				}, 500);
			}
		}
	},
	methods: {
		cleanupQuestion() {
			this.stop();
			if (this.questionTimer) {
				clearTimeout(this.questionTimer);
				this.questionTimer = null;
			}
			this.isCanChooseAudio = false;
		},
		stop() {
			// Cancel any ongoing speech
			if (this.currentUtterance) {
				window.speechSynthesis.cancel();
				this.currentUtterance = null;
			}
		},

		handleOptionClick(key) {
			this.pressAnswerAudio(key);
		},

		generateNumbers() {
			let num1, num2;
			if (this.difficulty === 'hard') {
				num1 = Math.floor(Math.random() * 90) + 10; // 10-99
				num2 = Math.floor(Math.random() * 90) + 10;
			} else if (this.difficulty === 'medium') {
				num1 = Math.floor(Math.random() * 90) + 10; // 10-99
				num2 = Math.floor(Math.random() * 9) + 1;   // 1-9
			} else { // easy
				num1 = Math.floor(Math.random() * 9) + 1;   // 1-9
				num2 = Math.floor(Math.random() * 9) + 1;   // 1-9
			}
			return [num1, num2];
		},
		generateOperation() {
			const operations = this.difficulty === 'easy'
				? ['+', '-']
				: ['+', '-', '×'];
			return operations[Math.floor(Math.random() * operations.length)];
		},
		calculateResult(num1, num2, operation) {
			switch (operation) {
				case '+': return num1 + num2;
				case '-': return num1 - num2;
				case '×': return num1 * num2;
				default: return 0;
			}
		},
		getOperationText(operation) {
			switch (operation) {
				case '+': return 'tambah';
				case '-': return 'kurang';
				case '×': return 'kali';
				default: return '';
			}
		},

		startQuestionTimer() {
			if (this.questionTimer) {
				clearTimeout(this.questionTimer);
			}

			this.questionTimer = setTimeout(() => {
				if (!this.hasAnswered) {
					this.totalQuestion++;
				}
				this.moveToNextQuestion();
			}, this.QUESTION_DURATION);
		},

		moveToNextQuestion() {
			this.cleanupQuestion();
			if (!this.isTimesUp && !this.isPause && this.isActive) {
				// Add delay before next question
				setTimeout(() => {
					this.generateQuestion();
				}, 500);
			}
		},

		generateQuestion() {
			// Ensure any previous speech is stopped
			this.stop();

			this.hasAnswered = false;
			this.startQuestionTimer();

			let [num1, num2] = this.generateNumbers();
			const operation = this.generateOperation();

			if (operation === '-' && num1 < num2) {
				[num1, num2] = [num2, num1];
			}

			const result = this.calculateResult(num1, num2, operation);
			this.audio = result;

			const operationText = this.getOperationText(operation);
			this.currentQuestion = `${num1} ${operationText} ${num2}`;

			let correctLocationIndex = Math.floor(Math.random() * 4);

			this.optionAnswerAudios = Array(4).fill().map((_, index) => {
				if (index === correctLocationIndex) {
					return { key: index + 1, value: result };
				} else {
					let wrongAnswer;
					do {
						wrongAnswer = result + (Math.floor(Math.random() * 21) - 10);
					} while (
						wrongAnswer === result ||
						wrongAnswer < 0 ||
						this.optionAnswerAudios.some(opt => opt.value === wrongAnswer)
					);
					return { key: index + 1, value: wrongAnswer };
				}
			});

			// Delay speech start slightly to ensure clean audio
			setTimeout(() => {
				this.startPlayback();
			}, 100);
		},

		startPlayback() {
			this.isCanChooseAudio = false;

			if ('speechSynthesis' in window) {
				// Cancel any existing speech
				this.stop();

				// Create new utterance
				this.currentUtterance = new SpeechSynthesisUtterance(this.currentQuestion);
				this.currentUtterance.rate = 1;
				this.currentUtterance.pitch = 1;
				this.currentUtterance.volume = 1;
				this.currentUtterance.lang = 'id-ID';

				// Set up event handlers
				this.currentUtterance.onend = () => {
					if (!this.isTimesUp && !this.isPause && this.isActive) {
						this.isCanChooseAudio = true;
					}
					this.currentUtterance = null;
				};

				this.currentUtterance.onerror = (event) => {
					console.error('Speech synthesis error:', event);
					this.isCanChooseAudio = true;
					this.currentUtterance = null;
				};

				// Start speech
				this.responseQuestion = Date.now();
				window.speechSynthesis.speak(this.currentUtterance);
			} else {
				console.error('Text-to-speech not supported');
				this.isCanChooseAudio = true;
			}
		},

		calculateResponseTime() {
			return this.responseDurations.push(this.responseTime - this.responseQuestion);
		},

		pressAnswerAudio(key) {
			if (this.isPause || this.isTimesUp || !this.isActive || !this.isCanChooseAudio || this.hasAnswered) {
				return;
			}

			let value = 0;
			for (let i = 0; i < this.optionAnswerAudios.length; i++) {
				if (this.optionAnswerAudios[i].key === key) {
					value = this.optionAnswerAudios[i].value;
					break;
				}
			}

			this.hasAnswered = true;
			this.totalQuestion++;

			if (this.audio === value) {
				this.responseTime = Date.now();
				this.calculateResponseTime();
				this.correctAnswer++;
			}

			this.isCanChooseAudio = false;
		},

		handleKeyPress(event) {
			if (this.isPause || this.isTimesUp || !this.isActive || !this.isCanChooseAudio || this.hasAnswered) {
				return;
			}

			if (event.key >= '1' && event.key <= '4') {
				this.pressAnswerAudio(parseInt(event.key));
			}
		}
	}
};
</script>
<style scoped>
.arithmetic {
	display: flex;
	flex-direction: row;
	justify-content: space-around;
	margin-top: 10px;
}

.question-container {
	border: 2px solid black;
	padding: 20px;
	margin-bottom: 20px;
	width: 100%;
	max-width: 600px;
}

.question {
	font-size: 20px;
	margin-bottom: 20px;
	text-align: center;
}

.options {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20px;
	list-style: none;
	padding: 0;
	margin: 0;
}

.option-item {
	display: flex;
	justify-content: center;
}

.option-button {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 120px;
	background-color: #f0f0f0;
	border: 2px solid #333;
	border-radius: 10px;
	transition: all 0.3s ease;
	cursor: pointer;
	padding: 10px;
}

.option-button:disabled {
	cursor: default;
	opacity: 0.7;
}

.option-answer {
	background-color: #333;
	color: white;
	padding: 5px 10px;
	border-radius: 5px;
	font-size: 18px;
	margin-bottom: 10px;
}

.option-value {
	font-size: 24px;
	font-weight: bold;
}

.clickable:not(:disabled):hover {
	background-color: #e0e0e0;
	transform: scale(1.05);
}
</style>