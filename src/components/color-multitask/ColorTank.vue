<template>
	<div>
		<div class="tank-section">
			<div class="upper-tanks">
				<div v-for="(color, index) in colors" :key="index" :style="{ backgroundColor: color }"
					:id="`upper-tank-${index}`" class="tank"></div>
			</div>

			<div class="line">
				<canvas ref="lineTankCanvas" :width="lineTankCanvasWidth" :height="lineTankCanvasHeight"
					style="border: 0px;"></canvas>
			</div>

			<div class="lower-tanks">
				<div v-for="(lowerTank, index) in lowerTanks" :key="index" class="tank" :id="`lower-tank-${index}`">
					<div class="horizontal-line"></div>
					<div v-for="(tankItem, IdxColor) in lowerTank" :key="IdxColor"
						:style="{ backgroundColor: tankItem.color, height: tankItem.height, width: tankItem.color === 'black' ? '5%' : '100%' }"
						class="tank-fill fill-animation">
					</div>
				</div>
			</div>

			<div class="counter">
				<input type="text" v-model="finalScore" readonly style="text-align: center; width: 15%;">
			</div>
			<div class="keyboard">
				<VirtualKeyboard @keyPress="handleVirtualKeyDown" :activeKeys="keySequence" />
			</div>

		</div>

	</div>
</template>

<script>
import VirtualKeyboard from '../VirtualKeyboard.vue';

export default {
	name: 'ColorTankView',
	components: {
		VirtualKeyboard,
	},
	data() {
		return {
			isAllTankEmpty: false,
			finalScore: 120,
			keysPressed: {},
			colors: ['yellow', 'blue', 'red', 'green'],
			lowerTanks: [],
			lineTankCanvasWidth: 500,
			lineTankCanvasHeight: 250,
			lines: [
				// Q
				{ x1: 30, y1: 10, x2: 30, y2: 280 },
				{ x1: 50, y1: 25, x2: 50, y2: 50, x3: 130, y3: 220, x4: 130, y4: 230, startText: 'Q', endText: 'S', },
				{ x1: 70, y1: 10, x2: 70, y2: 50, x3: 185, y3: 220, x4: 185, y4: 280 },
				// W
				{ x1: 110, y1: 10, x2: 110, y2: 50, x3: 70, y3: 220, x4: 70, y4: 280 },
				{ x1: 130, y1: 25, x2: 105, y2: 260, startText: 'W' },
				{ x1: 150, y1: 10, x2: 150, y2: 50, x3: 290, y3: 220, x4: 290, y4: 230, endText: 'F' },
				// E
				{ x1: 190, y1: 10, x2: 190, y2: 50, x3: 150, y3: 220, x4: 150, y4: 280 },
				{ x1: 210, y1: 25, x2: 210, y2: 50, x3: 230, y3: 220, x4: 230, y4: 260, startText: 'E' },
				{ x1: 230, y1: 10, x2: 230, y2: 50, x3: 310, y3: 220, x4: 310, y4: 280 },
				// R
				{ x1: 270, y1: 10, x2: 270, y2: 50, x3: 50, y3: 220, x4: 50, y4: 230, endText: 'A' },
				{ x1: 290, y1: 25, x2: 290, y2: 50, x3: 205, y3: 220, x4: 205, y4: 230, startText: 'R', endText: 'D' },
				{ x1: 310, y1: 10, x2: 310, y2: 50, x3: 265, y3: 220, x4: 265, y4: 280, },
			],
			intervalCheckFullyTank: null,
			intervalCheckEmptyTank: null,
			intervalStartEmptyTank: null,
			intervalContinueEmptyTank: null,
			tankIndex: null,
			tankItem: null,
			keySequence: [],
			sequenceResult: false,
		}
	},
	props: {
		isTimesUp: Boolean,
		speed: String,
		isPause: Boolean,
		isActive: Boolean,
		isNegativeScore: Boolean,
		coloredLowerTank: Boolean,
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
	},
	beforeUnmount() {
		window.removeEventListener('keydown', this.handleKeyDown);
	},
	watch: {
		isTimesUp() {
			clearInterval(this.intervalStartEmptyTank);
			clearInterval(this.intervalCheckEmptyTank);
			clearInterval(this.intervalCheckFullyTank);
			clearInterval(this.intervalContinueEmptyTank);

			this.$emit('getResult', {
				score: this.finalScore,
			});
		},
		isPause() {
			if (this.isPause) {
				clearInterval(this.intervalStartEmptyTank);
				clearInterval(this.intervalCheckEmptyTank);
				clearInterval(this.intervalCheckFullyTank);
				clearInterval(this.intervalContinueEmptyTank);
			} else {
				this.runningInterval('check-empty-tank');
				this.runningInterval('check-fully-tank');
				this.runningInterval('start-empty-tank');
				this.runningInterval('continue-empty-tank');
			}
		},
	},
	methods: {
		handleVirtualKeyDown(event) {
			this.handleKeyDown({ key: event.key });
		},
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
						{ color: 'yellow', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'green', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'blue', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
					[
						{ color: 'blue', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'yellow', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'red', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
					[
						{ color: 'yellow', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'green', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'red', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
					[
						{ color: 'green', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'blue', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'red', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
				]
			} else {
				this.lowerTanks = [
					[
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
					[
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
					[
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
					[
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'black', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
						{ color: 'grey', height: '100%', status: 'run', minimum_height: this.setMinimumHeight() },
					],
				]
			}

			this.startEmptyTank()
			this.checkStopStatus()
		},
		setMinimumHeight() {
			return Math.floor(Math.random() * (70 - 40 + 1)) + 40 + '%';
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
					}, 1000);
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
				clearInterval(this.intervalStartEmptyTank);
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
				return 3;
			}
			if (this.speed === 'medium') {
				return Math.random() * (5 - 3) + 3;
			}
			if (this.speed === 'fast') {
				return Math.random() * (7 - 5) + 5;
			}
		},
		async fillTank(tankIndex, tankItem) {
			if (tankIndex === undefined || tankItem === undefined) {
				return;
			}

			if (!this.lowerTanks[tankIndex] || !this.lowerTanks[tankIndex][tankItem]) {
				return;
			}

			const increment = 20;
			const tank = this.lowerTanks[tankIndex][tankItem];

			let currentFill = parseFloat(tank['height'].replace('%', ''));

			if (currentFill < 100) {
				for (let i = 0; i < 6; i++) {
					await new Promise(resolve => setTimeout(resolve, 800));

					currentFill += increment;
					tank['height'] = Math.min(currentFill, 100) + '%';

					if (currentFill >= 100) {
						break;
					}
				}
			}

			if (currentFill >= 100) {
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

			const key = event.key.toUpperCase();

			this.keysPressed[key] = true;
			this.keySequence.push(key);
			if (this.keySequence.length == 3) {
				const validSequences = {
					'Q': ['A', 'S', 'D'],
					'W': ['A', 'S', 'F'],
					'E': ['S', 'D', 'F'],
					'R': ['A', 'D', 'F']
				};
				const upper = this.keySequence[0]
				const lowerTankOption = validSequences[upper]
				if (lowerTankOption &&
					lowerTankOption.includes(this.keySequence[1]) &&
					lowerTankOption.includes(this.keySequence[2])) {
					// The key sequence matches the valid sequence (in any order)
					console.log('Valid sequence:', this.keySequence);
					this.checkKeyboardState(upper, this.keySequence[1], this.keySequence[2]);
					this.sequenceResult = true;
				} else {
					console.log('Invalid sequence:', this.keySequence);
					this.sequenceResult = false;
				}
				this.keySequence = [];
			}
		},

		checkKeyboardState(upper, lower1, lower2) {
			console.log('Checking keyboard state:', upper, lower1, lower2);
			if (upper == 'Q') {
				if ((lower1 == 'A' && lower2 == 'S') || (lower1 == 'S' && lower2 == 'A')) {
					console.log('Filling tank kuning A S');
					this.fillTank(0, 0);
					this.fillTank(1, 2);
				} else if ((lower1 == 'S' && lower2 == 'D') || (lower1 == 'D' && lower2 == 'S')) {
					console.log('Filling tank kuning S D');
					this.fillTank(1, 2);
					this.fillTank(2, 0);
				} else if ((lower1 == 'A' && lower2 == 'D') || (lower1 == 'D' && lower2 == 'A')) {
					console.log('Filling tank kuning A D');
					this.fillTank(0, 0);
					this.fillTank(2, 0);
				}
			}
			if (upper == 'W') {
				if ((lower1 == 'A' && lower2 == 'S') || (lower1 == 'S' && lower2 == 'A')) {
					console.log('Filling tank biru A S');
					this.fillTank(0, 4);
					this.fillTank(1, 0);
				} else if ((lower1 == 'S' && lower2 == 'F') || (lower1 == 'F' && lower2 == 'S')) {
					console.log('Filling tank biru S F');
					this.fillTank(1, 0);
					this.fillTank(3, 2);
				} else if ((lower1 == 'A' && lower2 == 'F') || (lower1 == 'F' && lower2 == 'A')) {
					console.log('Filling tank biru A F');
					this.fillTank(0, 4);
					this.fillTank(3, 2);
				}
			}
			if (upper == 'E') {
				if ((lower1 == 'S' && lower2 == 'F') || (lower1 == 'F' && lower2 == 'S')) {
					console.log('Filling tank merah S F');
					this.fillTank(1, 4);
					this.fillTank(3, 4);
				} else if ((lower1 == 'D' && lower2 == 'F') || (lower1 == 'F' && lower2 == 'D')) {
					console.log('Filling tank merah D F');
					this.fillTank(2, 4);
					this.fillTank(3, 4);
				} else if ((lower1 == 'S' && lower2 == 'D') || (lower1 == 'D' && lower2 == 'S')) {
					console.log('Filling tank merah S D');
					this.fillTank(1, 4);
					this.fillTank(2, 4);
				}
			}
			if (upper == 'R') {
				if ((lower1 == 'A' && lower2 == 'D') || (lower1 == 'D' && lower2 == 'A')) {
					console.log('Filling tank hijau A D');
					this.fillTank(0, 2);
					this.fillTank(2, 2);
				} else if ((lower1 == 'D' && lower2 == 'F') || (lower1 == 'F' && lower2 == 'D')) {
					console.log('Filling tank hijau D F');
					this.fillTank(2, 2);
					this.fillTank(3, 0);
				} else if ((lower1 == 'A' && lower2 == 'F') || (lower1 == 'F' && lower2 == 'A')) {
					console.log('Filling tank hijau A F');
					this.fillTank(0, 2);
					this.fillTank(3, 0);
				}
			}
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
				this.intervalStartEmptyTank = setInterval(() => {
					this.decreaseTankLevels(this.tankIndex, this.tankItem);
				}, 1000);
			}

			if (type === 'continue-empty-tank') {
				this.intervalContinueEmptyTank = setInterval(() => {
					this.decreaseTankToEmpty();
				}, 1000);
			}
		},
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
	margin-right: 10%;
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

.upper-tanks,
.lower-tanks {
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
	position: relative;
	/* Positioning for absolute elements inside */
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
	transition: height 1s ease;
	/* Animation for height change */
}

.keyboard {
	margin-left: 0px;
}
</style>
