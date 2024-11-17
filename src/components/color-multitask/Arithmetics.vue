<template>
	<div class="arithmetic">
		<div class="question-container">
			<div class="question">
				<strong> Dengarkan dan masukkan jawaban Anda </strong>
			</div>
			<ul class="options">
				<li v-for="(option, index) in optionAnswerAudios" :key="index" class="option-item">
					<button 
						class="option-button"
						:class="{ 'clickable': isCanChooseAudio }"
						@click="handleOptionClick(option.key)"
						:disabled="!isCanChooseAudio"
					>
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
		this.stop();
	},
	watch: {
		isTimesUp() {
			this.stop();
			this.$emit('getResult', {
				correctAnswer: this.correctAnswer,
				totalQuestion: this.totalQuestion,
				responseTime: this.averageResponseTime(),
			});
		},
		isPause(newValue) {
			if (newValue) {
				this.stop();
			}
		}
	},
	methods: {
		stop() {
			if ('speechSynthesis' in window) {
				window.speechSynthesis.cancel();
			}
		},
		averageResponseTime() {
			if (this.responseDurations.length > 0) {
				const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);
				return (sum / this.responseDurations.length) / 1000;
			}
			return 0;
		},
		calculateResponseTime() {
			return this.responseDurations.push(this.responseTime - this.responseQuestion);
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
		generateQuestion() {
			let [num1, num2] = this.generateNumbers();
			const operation = this.generateOperation();
			
			// Ensure subtraction doesn't result in negative numbers
			if (operation === '-' && num1 < num2) {
				[num1, num2] = [num2, num1];
			}

			const result = this.calculateResult(num1, num2, operation);
			this.audio = result;
			
			// Format question for speech
			const operationText = this.getOperationText(operation);
			this.currentQuestion = `${num1} ${operationText} ${num2}`;

			let correctLocationIndex = Math.floor(Math.random() * 4);
			
			// Generate wrong answers that are close to the correct answer
			this.optionAnswerAudios = Array(4).fill().map((_, index) => {
				if (index === correctLocationIndex) {
					return { key: index + 1, value: result };
				} else {
					let wrongAnswer;
					do {
						// Generate wrong answer within ±10 of correct answer
						wrongAnswer = result + (Math.floor(Math.random() * 21) - 10);
					} while (
						wrongAnswer === result || 
						wrongAnswer < 0 || 
						this.optionAnswerAudios.some(opt => opt.value === wrongAnswer)
					);
					return { key: index + 1, value: wrongAnswer };
				}
			});

			this.startPlayback();
		},
		handleOptionClick(key) {
			this.pressAnswerAudio(key);
		},
		pressAnswerAudio(key) {
			if (this.isPause || this.isTimesUp || !this.isActive || !this.isCanChooseAudio) {
				return;
			}

			let value = 0;
			for (let i = 0; i < this.optionAnswerAudios.length; i++) {
				if (this.optionAnswerAudios[i].key === key) {
					value = this.optionAnswerAudios[i].value;
					break;
				}
			}

			if (this.audio === value) {
				this.responseTime = Date.now();
				this.calculateResponseTime();
				this.correctAnswer++;
			}

			this.isCanChooseAudio = false;
			this.stop();
			setTimeout(() => {
				this.generateQuestion();
			}, 500);
		},
		startPlayback() {
			this.totalQuestion++;

			if ('speechSynthesis' in window) {
				// Create and configure utterance
				const utterance = new SpeechSynthesisUtterance(this.currentQuestion);
				utterance.rate = 1;
				utterance.pitch = 1;
				utterance.volume = 1;
				utterance.lang = 'id-ID';

				// Start speaking
				this.responseQuestion = Date.now();
				window.speechSynthesis.speak(utterance);

				// Enable answering after speech complete
				utterance.onend = () => {
					setTimeout(() => {
						this.isCanChooseAudio = true;
					}, 500);
				};
			} else {
				console.error('Text-to-speech not supported');
				this.isCanChooseAudio = true;
			}
		},
		handleKeyPress(event) {
			if (this.isPause || this.isTimesUp || !this.isActive || !this.isCanChooseAudio) {
				return;
			}

			if (event.key >= '1' && event.key <= '4') {
				this.pressAnswerAudio(parseInt(event.key));
			}
		},
	},
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