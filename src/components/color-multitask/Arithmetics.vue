<template>
	<div class="arithmetic">
		<div class="question-container">
			<div class="question">
				<strong> Listen to task and enter your answer </strong>
			</div>
			<ul class="options">
				<div v-for="(option, index) in optionAnswerAudios" :key="index">
					<li>
							<label>
								<span class="option-answer">
									{{ option.key }}
								</span>
								
								{{ option.value }}
							</label>
					</li>
				</div>
			</ul>
		</div>  
	</div>
</template>

<script>
	export default {
		name: 'ArithmeticsView',
		data() {
			return {
				isPlayAudio: false,
				audio: null,
				correctAnswer: 0,
				totalQuestion: 0,
				optionAnswerAudios: [
					{ key: 7, value: ''},
					{ key: 8, value: ''},
					{ key: 9, value: ''},
					{ key: 0, value: ''},
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
			this.generateAudio();
		},
		created() {
      window.addEventListener('keyup', this.handleKeyPress);
    },
    beforeUnmount() {
      window.removeEventListener('keyup', this.handleKeyPress);
    },
		watch: {
      isTimesUp() {
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
				this.isPlayAudio = true;
				this.responseQuestion = 0;
				this.responseTime = 0;
				
				if (this.difficulty === 'hard') {
					this.audio = Math.floor(Math.random() * 900) + 100;
				}
				if (this.difficulty === 'normal') {
					this.audio = Math.floor(Math.random() * 90) + 10;
				}
				if (this.difficulty === 'easy') {
					this.audio = Math.floor(Math.random() * 9) + 1;
				}

				let correctLocationIndex = Math.floor(Math.random() * 4) + 6;
				if (correctLocationIndex >= 9) {
					correctLocationIndex = 9
				}
				if (correctLocationIndex <= 7) {
					correctLocationIndex = 7
				}

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
			},
			pressAnswerAudio(key) {
				if (this.isPause || this.isTimesUp || !this.isActive) {
          return;
        }

				let value = 0;
				for (let i = 0; i < this.optionAnswerAudios.length; i++) {
					if (this.optionAnswerAudios[i].key === key) {
						value = this.optionAnswerAudios[i].value;

						break
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

				if (this.isPlayAudio && this.audio) {
					setTimeout(() => {
						this.startPlayback();
					}, 500);
					this.isPlayAudio = false;
				}
				
				if (this.isCanChooseAudio) {
					if (event.key.toUpperCase() == 7) {
						this.pressAnswerAudio(7);
					}

					if (event.key.toUpperCase() == 8) {
						this.pressAnswerAudio(8);
					}

					if (event.key.toUpperCase() == 9) {
						this.pressAnswerAudio(9);
					}

					if (event.key.toUpperCase() == 0) {
						this.pressAnswerAudio(0);
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
	}
	.question {
		font-size: 18px;
		margin-bottom: 10px;
	}
	.options {
		list-style-type: none;
		padding: 0;
	}
	.options li {
		margin-bottom: 8px;
	}
	.option-answer {
		background-color: grey;
		padding: 10px;
		border-radius: 5px;
		display: inline-block;
		padding: 4px 7px;
		color: white;
		border: 2px solid black;
		text-align: center;
		font-size: 11px;
		transition: background-color 0.3s ease;
	}
</style>