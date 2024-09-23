<template>
	<div class="arithmetic">
		<div class="question-container">
			<div class="question">
				<strong> Dengarkan dan masukkan jawaban Anda </strong>
			</div>
			<ul class="options">
				<li v-for="(option, index) in optionAnswerAudios" :key="index" class="option-item"
					@click="handleOptionClick(option.key)">
					<label>
						<span class="option-answer" :class="{ 'clickable': isCanChooseAudio }">
							{{ option.key }}
						</span>
						{{ option.value }}
					</label>
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
			audio: null,
			correctAnswer: 0,
			totalQuestion: 0,
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
		if (!this.useSound) {
			this.generateAudio();
		}
	},
	created() {
		window.addEventListener('keyup', this.handleKeyPress);
	},
	beforeUnmount() {
		window.removeEventListener('keyup', this.handleKeyPress);
	},
	watch: {
		isTimesUp() {
			if ('speechSynthesis' in window) {
				window.speechSynthesis.cancel()
			}

			this.$emit('getResult', {
				correctAnswer: this.correctAnswer,
				totalQuestion: this.totalQuestion,
				responseTime: this.averageResponseTime(),
			});
		},
	},
	methods: {
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
		generateAudio() {
			this.audio = null;
			this.answerAudio = null;
			this.responseQuestion = 0;
			this.responseTime = 0;
			console.log(this.difficulty, 'difficulty');
			if (this.difficulty === 'hard') {
				this.audio = Math.floor(Math.random() * 900) + 100;
			}
			if (this.difficulty === 'medium') {
				this.audio = Math.floor(Math.random() * 90) + 10;
			}
			if (this.difficulty === 'easy') {
				this.audio = Math.floor(Math.random() * 9) + 1;
			}

			let correctLocationIndex = Math.floor(Math.random() * 4) + 1;

			for (var i = 0; i < 4; i++) {
				if (this.optionAnswerAudios[i].key === correctLocationIndex) {
					this.optionAnswerAudios[i].value = this.audio;
				} else {
					if (this.difficulty === 'hard') {
						this.optionAnswerAudios[i].value = Math.floor(Math.random() * 900) + 100;
					}
					if (this.difficulty === 'normal') {
						this.optionAnswerAudios[i].value = Math.floor(Math.random() * 90) + 10;
					}
					if (this.difficulty === 'easy') {
						this.optionAnswerAudios[i].value = Math.floor(Math.random() * 9) + 1;
					}
				}
			}

			setTimeout(() => {
				this.startPlayback()
			}, 1000)
		},
		handleOptionClick(key) {
			if (this.isPause || this.isTimesUp || !this.isActive || !this.isCanChooseAudio) {
				return;
			}
			this.pressAnswerAudio(key);
		},

		pressAnswerAudio(key) {
			if (this.isPause || this.isTimesUp || !this.isActive) {
				return;
			}

			let value = 0;
			for (let i = 0; i < this.optionAnswerAudios.length; i++) {
				if (this.optionAnswerAudios[i].key === key) {
					value = this.optionAnswerAudios[i].value;
					break;
				}
			}

			if (value === this.audio) {
				this.responseTime = Date.now();
				this.calculateResponseTime();
				this.correctAnswer++;
			}

			this.isCanChooseAudio = false;
			this.generateAudio();
		},
		startPlayback() {
			this.totalQuestion++;

			setTimeout(() => {
				if ('speechSynthesis' in window) {
					let number = this.audio

					const utterancePart1 = new SpeechSynthesisUtterance("  ");
					const utterancePart2 = new SpeechSynthesisUtterance(number + " ");
					utterancePart2.rate = 1;
					utterancePart2.pitch = 1.2;
					utterancePart2.volume = 1;
					utterancePart2.lang = 'id-ID';

					window.speechSynthesis.speak(utterancePart1);

					utterancePart1.onend = () => {
						setTimeout(() => {
							this.responseQuestion = Date.now();
							window.speechSynthesis.speak(utterancePart2);

							setTimeout(() => {
								this.isCanChooseAudio = true;
							}, 500);
						}, 500);
					};
				} else {
					alert('Sorry, your browser does not support text-to-speech.');
				}
			}, 500);
		},
		handleKeyPress(event) {
			if (this.isPause || this.isTimesUp || !this.isActive) {
				return;
			}

			if (this.isCanChooseAudio) {
				if (event.key.toUpperCase() == 1) {
					this.pressAnswerAudio(1);
				}

				if (event.key.toUpperCase() == 2) {
					this.pressAnswerAudio(2);
				}

				if (event.key.toUpperCase() == 3) {
					this.pressAnswerAudio(3);
				}

				if (event.key.toUpperCase() == 4) {
					this.pressAnswerAudio(4);
				}
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
	cursor: default;
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

.clickable {
	cursor: pointer;
}

.clickable:hover {
	background-color: #e0e0e0;
	transform: scale(1.05);
}
</style>