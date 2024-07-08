<template>
	<div class="tank-section">
		<div class="upper-tanks">
			<div v-for="(color, index) in colors" :key="index" :style="{ backgroundColor: color }" :id="`upper-tank-${index}`" class="tank"></div>
		</div>

		<div class="line">
			<canvas ref="lineTankCanvas" :width="lineTankCanvasWidth" :height="lineTankCanvasHeight" style="border: 0px;"></canvas>
		</div>

		<div class="lower-tanks">
			<div v-for="(lowerTank, index) in lowerTanks" :key="index" class="tank" :id="`lower-tank-${index}`">
				<div class="horizontal-line"> </div>
				<div v-for="(tankItem, IdxColor) in lowerTank" :key="IdxColor" 
					:style="{ backgroundColor: tankItem.color, height: tankItem.height, width: tankItem.color === 'black' ? '5%' : '100%'}"
					class="tank-fill fill-animation">
				</div>
			</div>
		</div>
		
		<div class="counter">
			<input type="text" v-model="finalScore" readonly style="text-align: center; width: 15%;">
		</div>
	</div>
</template>

<script>
	export default {
		name: 'ColorTankView',
		data() {
			return {
				isAllTankEmpty: false,
				finalScore: 120,
				keysPressed: {},
				colors: ['yellow', 'blue', 'red', 'green'],
				lowerTanks: [],
				lineTankCanvasWidth: 320,
				lineTankCanvasHeight: 250,
				lines: [
					// Q
					{ x1: 13, y1: 10, x2: 13, y2: 280 },
					{ x1: 35, y1: 25, x2: 35, y2: 50, x3: 120, y3: 220, x4: 120, y4: 230, startText: 'Q', endText: 'S', },
					{ x1: 55, y1: 10, x2: 55, y2: 50, x3: 180, y3: 220, x4: 180, y4: 280},
					// W
					{ x1: 100, y1: 10, x2: 100, y2: 50, x3: 60, y3: 220, x4: 60, y4: 280 },
					{ x1: 120, y1: 25, x2: 95, y2: 260, startText: 'W'},
					{ x1: 140, y1: 10, x2: 140, y2: 50, x3: 290, y3: 220, x4: 290, y4: 230, endText: 'F'},
					// E
					{ x1: 185, y1: 10, x2: 185, y2: 50, x3: 145, y3: 220, x4: 145, y4: 280 },
					{ x1: 205, y1: 25, x2: 205, y2: 50, x3: 230, y3: 220, x4: 230, y4: 260, startText: 'E'},
					{ x1: 225, y1: 10, x2: 225, y2: 50, x3: 315, y3: 220, x4: 315, y4: 280 },
					// R
					{ x1: 270, y1: 10, x2: 270, y2: 50, x3: 35, y3: 220, x4: 35, y4: 230, endText: 'A' },
					{ x1: 290, y1: 25, x2: 290, y2: 50, x3: 205, y3: 220, x4: 205, y4: 230, startText: 'R', endText: 'D'},
					{ x1: 310, y1: 10, x2: 310, y2: 50, x3: 265, y3: 220, x4: 265, y4: 280, },
				],
				intervalCheckFullyTank: null,
				intervalCheckEmptyTank: null,
				intervalId: null,
				continueIntervalId: null,
				tankIndex: null,
				tankItem: null,
			}
		},
		props: {
      isTimesUp: Boolean,
      speed: String,
      isPause: Boolean,
      isActive: Boolean,
      isNegativeScore: Boolean,
			startToDecreaseIn: Number,
			coloredLowerTank: Boolean,
			descendSpeed: String,
    },
		async mounted() {
			this.initLineTank();
			this.initLowerTank();

			if (this.isPause || this.isTimesUp || !this.isActive) {
        return;
      }
			
			this.runningInterval('check-fully-tank');
			this.runningInterval('check-empty-tank');
		},
		created() {
			window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    },
    beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  },
		watch: {
      isTimesUp() {
				clearInterval(this.intervalId)
				clearInterval(this.intervalCheckEmptyTank)
				clearInterval(this.intervalCheckFullyTank)

        this.$emit('getResult', {
          score: this.finalScore,
        });
      },
			isPause() {
				if (this.isPause) {
					clearInterval(this.intervalCheckEmptyTank);
					clearInterval(this.intervalCheckFullyTank);
					clearInterval(this.intervalId);
					clearInterval(this.continueIntervalId);
				} else {
					this.runningInterval('check-empty-tank');
					this.runningInterval('check-fully-tank');
					this.runningInterval('start-empty-tank');
					this.runningInterval('continue-empty-tank');
				}
			},
    },
		methods: {
			checkStopStatus() {
				setTimeout(() => {
					this.runningInterval('continue-empty-tank');
				}, 1000);
			},
			decreaseTankToEmpty() {
				for (let i = 0; i < this.lowerTanks.length; i++) {
					for (let j = 0; j < this.lowerTanks[i].length; j++) {
						const tank = this.lowerTanks[i][j];
						if (tank['status'] === 'stop') {
							if (tank['height'] != '0%' && parseFloat(tank['height'].replace('%', '')) > 5) {
								tank['height'] = this.decreaseHeight(tank['height'], j, tank['color']);
							} else {
								tank['height'] = '5%';
							}
						}
					}
				}
			},
			initLineTank() {
				const canvas = this.$refs.lineTankCanvas;
				const ctx = canvas.getContext('2d');

				ctx.clearRect(0, 0, this.lineTankCanvasWidth, this.lineTankCanvasHeight);
				ctx.save();

				for (let i = 0; i < this.lines.length; i++) {
					this.drawLine(this.lines[i]);
				}
			},
			initLowerTank() {
				if (this.coloredLowerTank) {
					this.lowerTanks = [
						[ 
							{color: 'yellow', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'green', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'blue', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
						[ 
							{color: 'blue', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'yellow', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'red', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
						[ 
							{color: 'yellow', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'green', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'red', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
						[ 
							{color: 'green', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'blue', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'red', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
					]
				} else {
					this.lowerTanks = [
						[ 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
						[ 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
						[ 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
						[ 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
							{color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight()}, 
						],
					]
				}

				this.startEmptyTank()
				this.checkStopStatus()
			},	
			setMinimumHeight() {
				return Math.floor(Math.random() * (50 - 20 + 1)) + 20 + '%';
			},
			drawLine(lines) {
				const canvas = this.$refs.lineTankCanvas;
				const ctx = canvas.getContext('2d');
				ctx.beginPath();
				ctx.moveTo(lines.x1, lines.y1);
				ctx.lineTo(lines.x2, lines.y2);

				if (lines.x3 && lines.y3) {
					ctx.lineTo(lines.x3, lines.y3);
				}
				if (lines.x4 && lines.y4) {
					ctx.lineTo(lines.x4, lines.y4);
				}

				ctx.strokeStyle = '#574e4e';
				ctx.lineWidth = 4;
				ctx.lineCap = 'round';
				ctx.stroke();

				// Add text at the beginning and end of the line
				if (lines.startText) {
					ctx.font = 'bold 16px Arial';
					ctx.fillStyle = 'black';
					ctx.fillText(lines.startText, lines.x1 - 6, lines.y1 - 5);
				}

				if (lines.endText) {
					ctx.font = 'bold 16px Arial';
					ctx.fillStyle = 'black';

					if (lines.x4) {
						ctx.fillText(lines.endText, lines.x4 - 5, lines.y4 + 20);
					} else if (lines.x3) {
						ctx.fillText(lines.endText, lines.x3 - 5, lines.y3 + 20);
					} else if (lines.x2) {	
						ctx.fillText(lines.endText, lines.x2 - 5, lines.y2 + 20);
					}
				}
				// Add text at the beginning and end of the line	
			},
			startEmptyTank() {
				this.isAllTankEmpty = false;
				const maxAttempts = 100;
				let attempts = 0;

				const findTankToEmpty = () => {
					if (attempts >= maxAttempts) {
						this.isAllTankEmpty = true;
						return;
					}

					attempts++;
					this.tankIndex = Math.floor(Math.random() * 4);
					this.tankItem = Math.floor(Math.random() * 5);

					const selectedTank = this.lowerTanks[this.tankIndex][this.tankItem];

					if (selectedTank.height === '100%' && selectedTank.color !== 'black' && selectedTank.status === 'run') {
						setTimeout(() => {
							this.runningInterval('start-empty-tank');
						}, this.startToDecreaseIn);
					} else {
						findTankToEmpty();
					}
				};

				findTankToEmpty();
			},
			decreaseTankLevels(tankIndex, tankItem) {
				const tank = this.lowerTanks[tankIndex][tankItem];
				if (tank['height'] != '0%' && parseFloat(tank['height'].replace('%', '')) > 5) {
					tank['height'] = this.decreaseHeight(tank['height']);
				} 

				if (parseFloat(tank['height'].replace('%', '')) <= parseFloat(tank['minimum_height'].replace('%', ''))) {
					tank['status'] = 'stop';
					clearInterval(this.intervalId);
					this.startEmptyTank();
				}
			},
			decreaseHeight(currentHeight) {
				const current = parseFloat(currentHeight.replace('%', ''));
				const newHeight = Math.max(0, current - this.decreaseSpeed()) + '%';
		
				return newHeight;
			},
			decreaseSpeed() {
				if (this.speed === 'slow') {
					return 5;
				} 
				if (this.speed === 'medium') {
					return 10;
				} 
				if (this.speed === 'fast') {
					return 15;
				} 
			},
			fillTank(tankIndex, tankItem) {
				const increment = 10;
				const tank = this.lowerTanks[tankIndex][tankItem];

				let currentFill = parseFloat(tank['height'].replace('%', ''));

				if (tank['height'] < '100%') {
					currentFill += increment;
					tank['height'] = currentFill + '%';
				}

				if (tank['height'] >= '100%') {
					tank['height'] = '100%';
				}

				tank['status'] = 'run';
			},
			checkEmptyTank() {
				for (let i = 0; i < this.lowerTanks.length; i++) {
					for (let j = 0; j < this.lowerTanks[i].length - 1; j++) {

						if (this.lowerTanks[i][j]['color'] === 'black') {
							continue;
						}

						if (this.lowerTanks[i][j]['height'] === '5%') {
							this.finalScore--
						}
					}
				}

				if (this.isNegativeScore && this.finalScore <= 0) {
					this.finalScore = 0;
					clearInterval(this.intervalCheckEmptyTank);
				}
			},
			handleKeyDown(event) {
				if (this.isPause || this.isTimesUp || !this.isActive) {
					return;
				}

				this.keysPressed[event.key.toUpperCase()] = true;
      
        if (this.keysPressed['Q'] && this.keysPressed['A']) {
          this.fillTank(0, 0);
        }
        if (this.keysPressed['Q'] && this.keysPressed['S']) {
          this.fillTank(1, 2);
        }
        if (this.keysPressed['Q'] && this.keysPressed['D']) {
          this.fillTank(2, 0);
        }

        if (this.keysPressed['W'] && this.keysPressed['A']) {
          this.fillTank(0, 4);
        }
        if (this.keysPressed['W'] && this.keysPressed['S']) {
          this.fillTank(1, 0);
        }
        if (this.keysPressed['W'] && this.keysPressed['F']) {
          this.fillTank(3, 2);
        }

        if (this.keysPressed['E'] && this.keysPressed['S']) {
          this.fillTank(1, 4);
        }
        if (this.keysPressed['E'] && this.keysPressed['D']) {
          this.fillTank(2, 4);
        }
        if (this.keysPressed['E'] && this.keysPressed['F']) {
          this.fillTank(3, 4);
        }

        if (this.keysPressed['R'] && this.keysPressed['A']) {
          this.fillTank(0, 2);
        }
        if (this.keysPressed['R'] && this.keysPressed['D']) {
          this.fillTank(2, 2);
        }
        if (this.keysPressed['R'] && this.keysPressed['F']) {
          this.fillTank(3, 0);
        }
      },
			handleKeyUp(event) {
				delete this.keysPressed[event.key.toUpperCase()];
			},
			runningInterval(type = null) {
				if (type === 'check-fully-tank') {
					this.intervalCheckFullyTank = setInterval(() => {
						if (this.isAllTankEmpty) {
							this.startEmptyTank();
						}
					}, 2000);
				}

				if (type === 'check-empty-tank') {
					this.intervalCheckEmptyTank = setInterval(() => {
						this.checkEmptyTank();
					}, 1000);
				}

				if (type === 'start-empty-tank') {
					this.intervalId = setInterval(() => {
						this.decreaseTankLevels(this.tankIndex, this.tankItem);
					}, this.descendingSpeed());
				}

				if (type === 'continue-empty-tank') {
					this.continueIntervalId = setInterval(() => {
						this.decreaseTankToEmpty();
					}, this.descendingSpeed());
				}
			},
			descendingSpeed() {
				if (this.descendSpeed === 'slow') {
					return 5000;
				} 
				if (this.descendSpeed === 'medium') {
					return 4000;
				} 
				if (this.descendSpeed === 'fast') {
					return 3000;
				} 
			}
		},
	};
</script>

<style scoped>
	.horizontal-line {
		height: 2px;
		width: 100%;
		background-color: black;
		position: absolute;
		margin-top: 90px;
	}
	.tank-section {
		display: flex;
		flex-direction: column;
	}
	.upper-tanks {
		margin-left: 15px;
	}
	.lower-tanks {
		margin-left: 15px;
		margin-top: 10px;
	}
	.upper-tanks, .lower-tanks {
		display: flex;
		flex-direction: row;
		margin-bottom: 10px;
	}
	.tank {
		width: 69px;
		height: 100px;
		border: 3px solid black;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 10px;
		position: relative; /* Positioning for absolute elements inside */
	}
	.tank-fill {
		height: 100%;
		width: 100%;
		top: 0%;
		bottom: 0%;
		background-color: white;
		margin-top: auto;
		margin-bottom: initial;
	}
	.fill-animation {
		transition: height 1s ease; /* Animation for height change */
	}
</style>