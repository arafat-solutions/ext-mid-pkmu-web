<template>
    <div class="maze" ref="mazeContainer">
        <canvas ref="mazeCanvas" :width="width" :height="height"></canvas>
        <canvas ref="goalCanvas" :width="width" :height="height"></canvas>
        <canvas ref="effectCanvas" :style="effectStyle" :width="width" :height="height"></canvas>
        <canvas ref="playerCanvas" :width="width" :height="height"></canvas>
        <div v-if="cache" :style="dotStyle"></div>
    </div>
</template>

<script>
import Maze from "./getMaze";
import Maze2 from "./getMaze2";
import imagePath from "../../assets/tori.png";
import goalImagePath from "../../assets/flag.png";
import Renderer from "./Renderer";
import { dijkstra } from './dijkstra'

// TODO: select strategy method, not a class
const strategy = {
    dig: Maze2,
    cluster: Maze
};

export default {
    name: "MazeComponent",
    props: {
        difficulty: {
            default: "normal",
            type: String
        },
        imagePath: {
            default: imagePath,
            type: String
        },
        goalImagePath: {
            default: goalImagePath,
            type: String
        },
        strategy: {
            default: "cluster",
            type: String
        }
    },
    data() {
        return {
            cache: null,
            dotPos: {
                offsetX: null,
                offsetY: null
            },
            width: null,
            height: null,
            margin: 5,
            image: null,
            goalImage: null,
            maze: {
                bondH: [],
                bondV: [],
                goal: {
                    x: null,
                    y: null
                }
            },
            player: {
                id: "00",
                x: 0,
                y: 0
            },
            isFinished: false,
            seed: Date.now(),
            isStarted: false,
            shortestPath: [],
            leastPossibleMove: 0
        };
    },
    computed: {
        marginTop() {
            return (this.height - this.ly * this.cellHeight) / 2;
        },
        marginLeft() {
            return (this.width - this.lx * this.cellWidth) / 2;
        },
        cellWidth() {
            switch (this.difficulty) {
                case "easy":
                    return 40;
                case "hard":
                    return 20;
                default:
                    return 30;
            }
        },
        cellHeight() {
            switch (this.difficulty) {
                case "easy":
                    return 40;
                case "hard":
                    return 20;
                default:
                    return 30;
            }
        },
        lx() {
            return Math.max(
                1,
                Math.floor((this.width - this.margin * 2) / this.cellWidth)
            );
        },
        ly() {
            return Math.max(
                1,
                Math.floor((this.height - this.margin * 2) / this.cellHeight)
            );
        },
        effectStyle() {
            if (this.isFinished) {
                return {
                    display: "inline"
                };
            }
            return {
                display: "none"
            };
        },
        dotStyle() {
            return {
                position: "absolute",
                backgroundColor: "black",
                height: "5px",
                width: "5px",
                opacity: 0.5,
                borderRadius: "50%",
                top: this.dotPos.offsetY + "px",
                left: this.dotPos.offsetX + "px"
            };
        }
    },
    mounted() {
        this.height = this.$el.offsetHeight - this.margin;
        this.width = this.$el.offsetWidth - this.margin;

        this.$refs.mazeContainer.focus();

        // Create a blue circle
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1961D5';
        ctx.beginPath();
        ctx.arc(50, 50, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        this.image = new Image();
        this.image.src = canvas.toDataURL();

        // Create a star
        const goalCanvas = document.createElement('canvas');
        goalCanvas.width = 100;
        goalCanvas.height = 100;
        const goalCtx = goalCanvas.getContext('2d');
        goalCtx.fillStyle = 'green';
        goalCtx.beginPath();
        const outerRadius = 50;
        const innerRadius = 20;
        const points = 5;
        const step = Math.PI / points;
        for (let i = 0; i < 2 * points; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const angle = i * step;
            goalCtx.lineTo(50 + r * Math.cos(angle), 50 - r * Math.sin(angle));
        }
        goalCtx.closePath();
        goalCtx.fill();
        this.goalImage = new Image();
        this.goalImage.src = goalCanvas.toDataURL();

        // will chage int back to image
        // after i create image

        // const image = new Image();
        // image.addEventListener("load", () => {
        //     this.image = image;
        // });
        // image.src = this.imagePath;

        // const goalImage = new Image();
        // goalImage.addEventListener("load", () => {
        //     this.goalImage = goalImage;
        // });
        // goalImage.src = this.goalImagePath;

        window.addEventListener("resize", () => {
            this.height = this.$el.offsetHeight;
            this.width = this.$el.offsetWidth;
        });

        window.addEventListener('keydown', this.onKeyDown);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.onKeyDown);
    },
    watch: {
        height() {
            this.renderMaze();
        },
        width() {
            this.renderMaze();
        },
        lx() {
            this.resetMaze();
        },
        ly() {
            this.resetMaze();
        },
        maze() {
            this.$emit("init");
            this.renderMaze();
        },
        player() {
            this.renderPlayer();
        },
        image() {
            this.renderPlayer();
        },
        goalImage() {
            this.renderGoal();
        },
        strategy() {
            this.$emit("init");
            this.resetMaze();
        },
        isFinished() {
            if (this.isFinished) {
                this.renderConguraturations();
                setTimeout(this.resetMaze, 800);
            }
        }
    },
    methods: {
        onKeyDown(event) {
            switch (event.keyCode) {
                case 37:
                    this.goLeft();
                    break;
                case 38:
                    this.goUp();
                    break;
                case 39:
                    this.goRight();
                    break;
                case 40:
                    this.goDown();
            }
        },
        goUp() {
            this.moveBy(0, -1);
        },
        goDown() {
            this.moveBy(0, 1);
        },
        goLeft() {
            this.moveBy(-1, 0);
        },
        goRight() {
            this.moveBy(1, 0);
        },
        moveBy(dx, dy) {
            const x = this.player.x + dx;
            const y = this.player.y + dy;
            this.moveTo(x, y);
        },
        canReach(fromX, fromY, toX, toY) {
            if (fromX === toX && fromY === toY) {
                return true;
            }

            const dx = toX > fromX ? 1 : -1;
            const dy = toY > fromY ? 1 : -1;
            const idxH =
                toX > fromX
                    ? (this.lx + 1) * fromY + fromX + dx
                    : (this.lx + 1) * fromY + fromX;
            const idxV =
                toY > fromY ? this.lx * (fromY + dy) + fromX : this.lx * fromY + fromX;

            if (
                fromX !== toX &&
                this.maze.bondH[idxH] &&
                this.canReach(fromX + dx, fromY, toX, toY)
            ) {
                return true;
            } else if (
                fromY !== toY &&
                this.maze.bondV[idxV] &&
                this.canReach(fromX, fromY + dy, toX, toY)
            ) {
                return true;
            }
            return false;
        },
        moveTo(toX, toY) {
            const fromX = this.player.x;
            const fromY = this.player.y;
            const startTime = performance.now();
            // Check if player can move

            // Players can't go outside of the maze
            if (toX < 0 || toX >= this.lx || toY < 0 || toY >= this.ly) {
                this.$emit('wallHit');
                return;
            }

            // Check if it's a correct turn
            const isCorrectTurn = this.isCorrectDirection(fromX, fromY, toX, toY);

            // Players can't go through the walls
            if (!this.canReach(fromX, fromY, toX, toY)) {
                this.$emit('wallHit');
                return;
            }

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            this.player = { x: toX, y: toY }
            this.$emit('move', {
                isCorrectTurn,
                responseTime,
                fromX,
                fromY,
                toX,
                toY
            });

            if (!this.isStarted) {
                this.isStarted = true;
                this.$emit("start");
            }
            if (
                toX === this.maze.goal.x &&
                toY === this.maze.goal.y &&
                !this.isFinished
            ) {
                this.isFinished = true;
                this.$emit("finish");
            }
        },
        isCorrectDirection(fromX, fromY, toX, toY) {
            const currentIndex = this.shortestPath.findIndex(p => p.x === fromX && p.y === fromY);
            const nextIndex = this.shortestPath.findIndex(p => p.x === toX && p.y === toY);
            return nextIndex === currentIndex + 1;
        },
        resetMaze() {
            const lx = this.lx;
            const ly = this.ly;
            const seed = this.seed++;
            if (lx > 0 && ly > 0) {
                const Maze = strategy[this.strategy];
                const maze = new Maze(lx, ly, seed);
                this.maze = maze
                this.player = { x: 0, y: 0 }
                this.isStarted = false;
                this.isFinished = false;

                console.log("Maze reset, finding shortest path");
                this.$nextTick(() => {
                    this.findShortestPath();
                });
            }
        },
        canMove(fromX, fromY, toX, toY) {
            if (toX < 0 || toX >= this.lx || toY < 0 || toY >= this.ly) return false;
            if (fromX === toX) {
                // Vertical movement
                const minY = Math.min(fromY, toY);
                return this.maze.bondV[minY * this.lx + fromX];
            } else {
                // Horizontal movement
                const minX = Math.min(fromX, toX);
                return this.maze.bondH[fromY * (this.lx + 1) + minX];
            }
        },
        findPathBFS() {
            const queue = [{ x: 0, y: 0, path: [] }];
            const visited = new Set();
            const goal = this.maze.goal;

            while (queue.length > 0) {
                const { x, y, path } = queue.shift();
                const key = `${x},${y}`;

                if (x === goal.x && y === goal.y) {
                    console.log("BFS found path:", path);
                    return path;
                }

                if (visited.has(key)) continue;
                visited.add(key);

                const neighbors = [
                    { dx: 0, dy: -1 }, // Up
                    { dx: 0, dy: 1 },  // Down
                    { dx: -1, dy: 0 }, // Left
                    { dx: 1, dy: 0 }   // Right
                ];

                for (const { dx, dy } of neighbors) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (this.canMove(x, y, newX, newY)) {
                        queue.push({ x: newX, y: newY, path: [...path, { x: newX, y: newY }] });
                    }
                }
            }

            console.log("BFS found no path");
            return null;
        },
        findShortestPath() {
            const start = { x: 0, y: 0 };
            const goal = this.maze.goal;
            console.log("Start:", start, "Goal:", goal);

            const result = dijkstra(this.maze, start, goal, this.canMove.bind(this));
            if (result.path.length <= 1) {
                console.log("Dijkstra failed, trying BFS");
                this.shortestPath = this.findPathBFS();
            } else {
                this.shortestPath = result.path;
            }

            this.leastPossibleMove = this.shortestPath ? this.shortestPath.length - 1 : Infinity;

            this.$emit('updateMetrics', { leastPossibleMove: this.leastPossibleMove });
            this.renderShortestPath();
            console.log("Shortest path:", this.shortestPath);
            console.log("Least possible moves:", this.leastPossibleMove);
        },
        renderShortestPath() {
            console.log("Rendering shortest path");
            const ctx = this.$refs.mazeCanvas.getContext("2d");
            console.log("Canvas context:", ctx);

            const renderer = new Renderer(
                ctx,
                this.cellWidth,
                this.cellHeight,
                this.marginLeft,
                this.marginTop
            );

            renderer.ctx.lineWidth = 3;
            renderer.setColor("yellow", "red");
            renderer.beginPath();

            console.log("Starting to draw path");
            for (let i = 0; i < this.shortestPath.length - 1; i++) {
                const current = this.shortestPath[i];
                const next = this.shortestPath[i + 1];
                console.log(`Drawing line from (${current.x}, ${current.y}) to (${next.x}, ${next.y})`);
                renderer.drawLine(current.x + 0.5, current.y + 0.5, next.x + 0.5, next.y + 0.5);
            }
            renderer.stroke();
            console.log("Finished drawing path");
        },
        renderPlayer() {
            const playerRenderer = new Renderer(
                this.$refs.playerCanvas.getContext("2d"),
                this.cellWidth,
                this.cellHeight,
                this.marginLeft,
                this.marginTop
            );
            const player = this.player;
            playerRenderer.clear(this.width, this.height);
            playerRenderer.ctx = this.$refs.playerCanvas.getContext("2d");
            playerRenderer.setColor("#FF9800", "#222");
            if (this.image != null) {
                playerRenderer.drawImage(player.x, player.y, this.image);
            } else {
                playerRenderer.drawCircle(player.x, player.y);
            }
        },
        renderGoal() {
            const renderer = new Renderer(
                this.$refs.goalCanvas.getContext("2d"),
                this.cellWidth,
                this.cellHeight,
                this.marginLeft,
                this.marginTop
            );
            const maze = this.maze;
            const goal = maze.goal;
            renderer.ctx = this.$refs.goalCanvas.getContext("2d");
            renderer.clear(this.width, this.height);
            renderer.setColor("#4CAF50", "#222");
            if (this.goalImage != null) {
                renderer.drawImage(goal.x, goal.y, this.goalImage);
            } else {
                renderer.drawCircle(goal.x, goal.y);
            }
        },
        renderConguraturations() {
            const effectRenderer = new Renderer(
                this.$refs.effectCanvas.getContext("2d"),
                this.cellWidth,
                this.cellHeight,
                this.marginLeft,
                this.marginTop
            );
            effectRenderer.clear(this.width, this.height);
            // TODO: data
            const texts = ["BooYah!", "Wow!", "I did it!", "Woohoo!"];
            const text = texts[Math.floor(texts.length * Math.random())];
            effectRenderer.drawText(text, this.player.x, this.player.y);
        },
        renderMaze() {
            this.$nextTick(() => {
                const renderer = new Renderer(
                    this.$refs.mazeCanvas.getContext("2d"),
                    this.cellWidth,
                    this.cellHeight,
                    this.marginLeft,
                    this.marginTop
                );
                const { lx, maze } = this;
                const bondH = maze.bondH;
                const bondV = maze.bondV;

                renderer.clear(this.width, this.height);

                // 縦線の描画
                renderer.setColor(null, "#222");
                renderer.beginPath();
                for (let i = 0; i < bondH.length; i++) {
                    if (bondH[i]) {
                        continue;
                    }
                    const x1 = i % (lx + 1);
                    const y1 = Math.floor(i / (lx + 1));
                    const x2 = x1;
                    const y2 = y1 + 1;
                    renderer.drawLine(x1, y1, x2, y2);
                }

                // 横線の描画
                for (let j = 0; j < bondV.length; j++) {
                    if (bondV[j]) {
                        continue;
                    }
                    const x1 = j % lx;
                    const y1 = Math.floor(j / lx);
                    const x2 = x1 + 1;
                    const y2 = y1;
                    renderer.drawLine(x1, y1, x2, y2);
                }
                renderer.stroke();
                this.renderPlayer();
                this.renderGoal();
                this.renderShortestPath()
                console.log("Shortest path rendered");
            });
        }
    }
};
</script>

<style scoped>
.maze {
    outline: 0;
    position: relative;
    min-height: 60px;
    min-width: 60px;
    overflow: hidden;
    width: 100%;
    height: 100%
}

canvas {
    position: absolute;
    top: 0;
    left: 0;
    margin: auto;
    border: 1px solid red;
}
</style>