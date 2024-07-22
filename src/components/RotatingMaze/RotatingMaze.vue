<template>
    <div v-if="loadingGenerating" class="loadingFirstMaze">
        <div class="spinnerMaze"></div>
        <p>Preparing the maze...</p>
    </div>
    <div v-if="loadingSubmit" class="loadingContainerMaze">
        <div class="spinnerMaze"></div>
        <p class="loadingText">Your result is submitting...</p>
    </div>
    <div class="containerSettingMaze">
        <div class="settingMaze">
            <button @click="async () => { await generateGrid(); await mazeGenerator(); }">new maze</button>
            <br /> <br />
            <div>
                <button @click="changeDifficulty('easy')">Easy</button>
                <button @click="changeDifficulty('normal')">Normal</button>
                <button @click="changeDifficulty('hard')">Hard</button>
            </div>
            <div>
                <p>correct turn: {{ quizMetrics.correctTurn }}</p>
                <p>wrong turn: {{ quizMetrics.wrongTurn }}</p>
                <p>least possible move: {{ quizMetrics.leastPossibleMove }}</p>
                <p>wallHit: {{ quizMetrics.wallHit }}</p>
                <p>avgStepResponse: {{ quizMetrics.avgStepResponse.toFixed(2) }}</p>
                <p>total maze: {{ quizMetrics.total_maze }}</p>
            </div>
        </div>
    </div>
    <div id="containerMaze">
        <div class="circularBaseMaze" :style="{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
    }">
            <div id="visualizerMaze" :style="{
        width: `${mazeWidth}px`,
        height: `${mazeHeight}px`,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) rotate(${rotationDegree}deg)`
    }">
                <div id="gridMaze" :style="{ width: `${cellSize * gridSizeX}px`, height: `${cellSize * gridSizeY}px` }">
                </div>
                <div class="rotationIndicatorMaze"></div>
            </div>
        </div>
    </div>
    <div class="timerMaze">
        <p>Waktu:</p>
        <p>{{ formatTime(config.duration) }}</p>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
// import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'

export default {
    name: 'RotationMaze',
    setup() {
        const tesInterval = ref(null)
        const loadingSubmit = ref(false)
        const mazeWidth = ref(400);
        const mazeHeight = ref(400);
        const gridSizeX = ref(0)
        const gridSizeY = ref(0)
        const cellSize = ref(0)
        const grid = ref([])
        const startPos = ref([])
        const targetPos = ref([])
        const timeouts = ref([]);
        const myInterval = ref(null)
        const generating = ref(false)
        const gridClean = ref(true)
        const nodeList = ref([])
        const nodeListIndex = ref(0)
        const pathList = ref([])
        const pathListIndex = ref(0)
        const found = ref(false)
        const path = ref(false)
        const showMazeSolver = ref(false) // to show maze solver
        const totalMoves = ref(0);
        const lastMoveTime = ref(performance.now());
        const rotationDegree = ref(0);
        const isRotating = ref(false)
        const isRotationActive = ref(true);
        const loadingGenerating = ref(false)
        const config = ref({
            duration: 0,
            rotationFrequency: 0,
            size: '',
            difficulty: '',
            userId: '',
            sessionId: '',
            testId: ''
        })
        const quizMetrics = ref({
            correctTurn: 0,
            wrongTurn: 0,
            leastPossibleMove: 0,
            wallHit: 0,
            avgStepResponse: 0,
            total_maze: 1,
        })
        const arrayMetrics = ref([])

        const setGridSizeByDifficulty = () => {
            let baseSize = 15;
            switch (config.value.difficulty) {
                case 'easy':
                    return Math.floor(baseSize * 0.75); // Smaller maze
                case 'normal':
                    return baseSize; // Original size
                case 'hard':
                    return Math.floor(baseSize * 1.25); // Larger maze
                default:
                    return baseSize;
            }
        }

        const setGridProperties = () => {
            let ratio = mazeWidth.value / mazeHeight.value;
            let maxGridSize = setGridSizeByDifficulty();

            gridSizeX.value = Math.floor(maxGridSize * ratio);
            gridSizeY.value = Math.floor(maxGridSize * ratio);

            if (gridSizeX.value % 2 == 0)
                gridSizeX.value += 1;

            cellSize.value = Math.floor(mazeHeight.value / maxGridSize) - 1;
        }

        const clearGrid = () => {
            for (let i = 0; i < gridSizeX.value; i++) {
                for (let j = 0; j < gridSizeY.value; j++) {
                    grid.value[i][j] = 0;
                    const cell = placeToCell(i, j);
                    cell.classList.remove("cell_wall", "cell_algo", "cell_path", "visited_cell");
                }
            }
            gridClean.value = true;

            // Reset visualization-related variables
            nodeList.value = [];
            nodeListIndex.value = 0;
            pathList.value = [];
            pathListIndex.value = 0;
            found.value = false;
            path.value = false;

            // Clear any ongoing intervals
            if (myInterval.value) {
                clearInterval(myInterval.value);
                myInterval.value = null;
            }
        }

        const placeToCell = (x, y) => {
            return document.querySelector(".x_" + x.toString(10) + ".y_" + y.toString(10));
        }

        const getInitialStartPos = () => {
            switch (config.value.difficulty) {
                case 'easy':
                    return [1, 1];
                case 'normal':
                    return [1, 1];
                case 'hard':
                    return [1, 1];
                default:
                    return [1, 1];
            }
        }

        const getInitialTargetPos = () => {
            switch (config.value.difficulty) {
                case 'easy':
                    return [Math.floor(gridSizeX.value * 0.75), Math.floor(gridSizeY.value * 0.75)];
                case 'normal':
                    return [gridSizeX.value - 2, gridSizeY.value - 2];
                case 'hard':
                    return [gridSizeX.value - 2, gridSizeY.value - 2];
                default:
                    return [gridSizeX.value - 2, gridSizeY.value - 2];
            }
        }

        const generateGrid = async () => {
            setGridProperties();

            const table = document.createElement("table");
            table.id = "my_table";

            for (let i = 0; i < gridSizeY.value; i++) {
                const row = document.createElement("tr");
                for (let j = 0; j < gridSizeX.value; j++) {
                    let cell = document.createElement("td");
                    let class_name = "";

                    if ((i + j) % 2 == 0)
                        class_name = "cell cell_1";
                    else
                        class_name = "cell cell_2";

                    class_name += " x_" + j.toString(10) + " y_" + i.toString(10);
                    cell.className = class_name;
                    row.appendChild(cell);
                }
                table.appendChild(row);
            }

            const gridElement = document.querySelector("#gridMaze");
            if (gridElement) {
                gridElement.innerHTML = '';
                gridElement.appendChild(table);
            }
            grid.value = new Array(gridSizeX.value).fill(0).map(() => new Array(gridSizeY.value).fill(0));

            startPos.value = getInitialStartPos()
            targetPos.value = getInitialTargetPos()

            if (startPos.value[0] % 2 == 0) {
                startPos.value[0] += 1;
            }

            if (startPos.value[1] % 2 == 0) {
                startPos.value[1] -= 1;
            }

            if (targetPos.value[0] % 2 == 0) {
                targetPos.value[0] += 1;
            }

            if (targetPos.value[1] % 2 == 0) {
                targetPos.value[1] -= 1;
            }

            placeToCell(startPos.value[0], startPos.value[1]).classList.add("start");
            placeToCell(targetPos.value[0], targetPos.value[1]).classList.add("target");
        }

        const changeDifficulty = (newDifficulty) => {
            config.value.difficulty = newDifficulty;
            // loadingGenerating.value = true
            generateGrid();
            mazeGenerator();
        }

        const clear = () => {
            for (let i = 0; i < timeouts.value.length; i++) {
                clearTimeout(timeouts[i]);
            }

            timeouts.value = [];
            clearInterval(myInterval.value);
            document.querySelector("#my_table").remove();
        }

        const addWall = (x, y) => {
            const cell = placeToCell(x, y);

            if (!cell.classList.contains("start") && !cell.classList.contains("target")) {
                grid.value[x][y] = -1;
                cell.classList.add("cell_wall");
            }
        }

        const enclose = () => {
            for (let i = 0; i < grid.value.length; i++) {
                addWall(i, 0);
                addWall(i, grid.value[0].length - 1);
            }

            for (let j = 0; j < grid.value[0].length; j++) {
                addWall(0, j);
                addWall(grid.value.length - 1, j);
            }
        }

        const randomInt = (min, max) => {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        }

        const recursiveDivision = () => {
            return new Promise((resolve) => {
                enclose();
                let time = 0;
                let step = 17;
                timeouts.value = [];

                function sub_recursive_division(x_min, y_min, x_max, y_max) {
                    if (y_max - y_min > x_max - x_min) {
                        let x = randomInt(x_min + 1, x_max);
                        let y = randomInt(y_min + 2, y_max - 1);

                        if ((x - x_min) % 2 == 0) {
                            x += (randomInt(0, 2) == 0 ? 1 : -1);
                        }

                        if ((y - y_min) % 2 == 1) {
                            y += (randomInt(0, 2) == 0 ? 1 : -1);
                        }

                        for (let i = x_min + 1; i < x_max; i++) {
                            if (i != x) {
                                time += step;
                                timeouts.value.push(setTimeout(function () { addWall(i, y); }, time));
                            }
                        }

                        if (y - y_min > 2) {
                            sub_recursive_division(x_min, y_min, x_max, y);
                        }

                        if (y_max - y > 2) {
                            sub_recursive_division(x_min, y, x_max, y_max);
                        }
                    }
                    else {
                        let x = randomInt(x_min + 2, x_max - 1);
                        let y = randomInt(y_min + 1, y_max);

                        if ((x - x_min) % 2 == 1)
                            x += (randomInt(0, 2) == 0 ? 1 : -1);

                        if ((y - y_min) % 2 == 0)
                            y += (randomInt(0, 2) == 0 ? 1 : -1);

                        for (let i = y_min + 1; i < y_max; i++)
                            if (i != y) {
                                time += step;
                                timeouts.value.push(setTimeout(function () { addWall(x, i); }, time));
                            }

                        if (x - x_min > 2)
                            sub_recursive_division(x_min, y_min, x, y_max);

                        if (x_max - x > 2)
                            sub_recursive_division(x, y_min, x_max, y_max);
                    }
                }

                sub_recursive_division(0, 0, grid.value.length - 1, grid.value[0].length - 1);
                timeouts.value.push(setTimeout(function () {
                    generating.value = false;
                    timeouts.value = []
                    resolve()
                }, time));
            })
        }

        const adjustPositions = () => {
            [startPos.value, targetPos.value].forEach(pos => {
                if (pos[0] % 2 === 0) pos[0] += pos[0] === gridSizeX.value - 1 ? -1 : 1;
                if (pos[1] % 2 === 0) pos[1] += pos[1] === 0 ? 1 : -1;
            });
        }

        const updateStartTargetCells = () => {
            document.querySelectorAll('.start, .target').forEach(el => {
                el.classList.remove('start', 'target');
            });
            placeToCell(startPos.value[0], startPos.value[1]).classList.add("start");
            placeToCell(targetPos.value[0], targetPos.value[1]).classList.add("target");
        }

        const mazeGenerator = async () => {
            stopRotation()

            let solvableMaze = false;
            let attempts = 0;
            const maxAttempts = 10;

            quizMetrics.value = {
                correctTurn: 0,
                wrongTurn: 0,
                leastPossibleMove: 0,
                wallHit: 0,
                avgStepResponse: 0,
                total_maze: 1,
            };

            while (!solvableMaze && attempts < maxAttempts) {
                attempts++;
                console.log(`Attempting to generate maze: Attempt ${attempts}`);

                // Clear the old maze
                clearGrid();

                // Reset start and target positions
                startPos.value = getInitialStartPos();
                targetPos.value = getInitialTargetPos();

                // Ensure start and target positions are on odd coordinates
                adjustPositions();

                // Update start and target cell classes
                updateStartTargetCells();

                gridClean.value = false;
                generating.value = true;

                try {
                    // Generate the maze
                    await recursiveDivision();

                    // Check if the maze is solvable
                    solvableMaze = await greedyBestFirst();

                    if (!solvableMaze) {
                        console.log(`Generated maze has no solution. Attempt ${attempts}. Regenerating...`);
                    } else {
                        console.log(`Solvable maze generated on attempt ${attempts}!`);
                        updateStartTargetCells();
                        generating.value = false;
                        loadingGenerating.value = false
                        countDownTestTime()
                        restartRotation()
                    }
                } catch (error) {
                    console.error("Error during maze generation:", error);
                    break;
                }
            }

            if (!solvableMaze) {
                console.error("Failed to generate a solvable maze after maximum attempts");
            }
        }

        const distance = (point_1, point_2) => {
            return Math.sqrt(Math.pow(point_2[0] - point_1[0], 2) + Math.pow(point_2[1] - point_1[1], 2));
        }

        const getNeighbours = (cell, distance) => {
            let up = [cell[0], cell[1] - distance];
            let right = [cell[0] + distance, cell[1]];
            let down = [cell[0], cell[1] + distance];
            let left = [cell[0] - distance, cell[1]];
            return [up, right, down, left];
        }

        const getNode = (x, y) => {
            if (x >= 0 && x < gridSizeX.value && y >= 0 && y < gridSizeY.value) {
                return grid.value[x][y];
            }
            return -2;  // Out of bounds
        };

        const getDirection = (from, to) => {
            if (to[1] < from[1]) return 1;  // Up
            if (to[0] > from[0]) return 2;  // Right
            if (to[1] > from[1]) return 3;  // Down
            if (to[0] < from[0]) return 4;  // Left
            return 0;
        };

        const reconstructPath = () => {
            let current = targetPos.value;
            while (current[0] !== startPos.value[0] || current[1] !== startPos.value[1]) {
                pathList.value.unshift(current);
                let direction = grid.value[current[0]][current[1]];
                switch (direction) {
                    case 1: current = [current[0], current[1] + 1]; break;
                    case 2: current = [current[0] - 1, current[1]]; break;
                    case 3: current = [current[0], current[1] - 1]; break;
                    case 4: current = [current[0] + 1, current[1]]; break;
                }
            }
        };

        const clearVisualization = () => {
            for (let i = 0; i < gridSizeX.value; i++) {
                for (let j = 0; j < gridSizeY.value; j++) {
                    if (grid.value[i][j] !== -1) {  // Don't reset walls
                        grid.value[i][j] = 0;
                    }
                    const cell = placeToCell(i, j);
                    cell.classList.remove("cell_algo", "cell_path");
                }
            }
        };

        const greedyBestFirst = async () => {
            clearVisualization();

            nodeList.value = [];
            nodeListIndex.value = 0;
            pathList.value = [];
            pathListIndex.value = 0;
            found.value = false;
            path.value = false;

            let frontier = [startPos.value];
            grid.value[startPos.value[0]][startPos.value[1]] = 1;

            while (frontier.length > 0 && !found.value) {
                frontier.sort((a, b) => distance(a, targetPos.value) - distance(b, targetPos.value));

                let current = frontier.shift();
                nodeList.value.push(current);

                if (current[0] === targetPos.value[0] && current[1] === targetPos.value[1]) {
                    found.value = true;
                    break;
                }

                let neighbors = getNeighbours(current, 1);
                for (let neighbor of neighbors) {
                    if (getNode(neighbor[0], neighbor[1]) === 0) {
                        frontier.push(neighbor);
                        grid.value[neighbor[0]][neighbor[1]] = getDirection(current, neighbor);
                    }
                }
            }

            if (found.value) {
                reconstructPath();
                quizMetrics.value.leastPossibleMove = pathList.value.length
            }

            if (!generating.value) {
                await mazeSolversInterval();
            }

            return found.value;
        };

        const mazeSolversInterval = async () => {
            if (!showMazeSolver.value) return

            myInterval.value = window.setInterval(() => {
                if (!path.value) {
                    if (nodeListIndex.value < nodeList.value.length) {
                        const [x, y] = nodeList.value[nodeListIndex.value];
                        placeToCell(x, y).classList.add("cell_algo");
                        nodeListIndex.value++;
                    } else {
                        if (!found.value) {
                            clearInterval(myInterval.value);
                        } else {
                            path.value = true;
                            placeToCell(startPos.value[0], startPos.value[1]).classList.add("cell_path");
                        }
                    }
                } else {
                    if (pathListIndex.value < pathList.value.length) {
                        const [x, y] = pathList.value[pathListIndex.value];
                        placeToCell(x, y).classList.remove("cell_algo");
                        placeToCell(x, y).classList.add("cell_path");
                        pathListIndex.value++;
                    } else {
                        placeToCell(targetPos.value[0], targetPos.value[1]).classList.add("cell_path");
                        clearInterval(myInterval.value);
                    }
                }
            }, 10);
        };

        const movePlayer = async (direction) => {
            const [x, y] = startPos.value;
            let newX = x;
            let newY = y;

            switch (direction) {
                case 'ArrowUp':
                    newY = Math.max(0, y - 1);
                    break;
                case 'ArrowDown':
                    newY = Math.min(gridSizeY.value - 1, y + 1);
                    break;
                case 'ArrowLeft':
                    newX = Math.max(0, x - 1);
                    break;
                case 'ArrowRight':
                    newX = Math.min(gridSizeX.value - 1, x + 1);
                    break;
            }

            // Check if the new position is a wall
            if (grid.value[newX][newY] === -1) {
                quizMetrics.value.wallHit++;
                return
            }

            totalMoves.value++;

            const currentIndex = pathList.value.findIndex(cell => cell[0] === x && cell[1] === y);
            const newIndex = pathList.value.findIndex(cell => cell[0] === newX && cell[1] === newY);

            if (newIndex !== -1) {
                if (newIndex > currentIndex) {
                    quizMetrics.value.correctTurn++;
                } else if (newIndex < currentIndex) {
                    quizMetrics.value.correctTurn--
                }
            } else {
                if (newIndex < currentIndex) {
                    quizMetrics.value.correctTurn--
                } else {
                    quizMetrics.value.wrongTurn++;

                }
            }

            // Remove player from current cell
            placeToCell(x, y).classList.remove("start");

            // Update player position
            startPos.value = [newX, newY];

            // Add player to new cell
            placeToCell(newX, newY).classList.add("start");

            // Update avgStepResponse
            const currentTime = performance.now();
            const stepTime = currentTime - lastMoveTime.value;
            quizMetrics.value.avgStepResponse =
                (quizMetrics.value.avgStepResponse * (totalMoves.value - 1) + stepTime) / totalMoves.value;
            lastMoveTime.value = currentTime;

            // Check if player reached the target
            if (newX === targetPos.value[0] && newY === targetPos.value[1]) {
                console.log("Congratulations! You've reached the target!");

                // 1. Push quizMetrics to arrayMetrics
                arrayMetrics.value.push({ ...quizMetrics.value });
                localStorage.setItem('arrayMetrics', JSON.stringify(arrayMetrics.value))

                // 2. Reset quizMetrics
                quizMetrics.value = {
                    correctTurn: 0,
                    wrongTurn: 0,
                    leastPossibleMove: 0,
                    wallHit: 0,
                    avgStepResponse: 0,
                    total_maze: quizMetrics.value.total_maze + 1,
                };

                // 3. Generate new maze
                // 4. Pause the config.duration countdown
                clearInterval(tesInterval.value);

                // 5. Reset rotationDegree and stop rotating
                rotationDegree.value = 0;
                stopRotation();

                // Generate new maze
                loadingGenerating.value = true;
                await generateGrid();
                await mazeGenerator();

                // Resume the countdown
                countDownTestTime();

                // Restart rotation
                restartRotation();
            }
        };

        const handleKeyPress = (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                movePlayer(event.key);
            }
        };

        const startRotation = () => {
            if (!isRotationActive.value) return;

            isRotating.value = true;
            const startTime = Date.now();
            const initialRotation = rotationDegree.value
            const rotationSpeed = 30
            const rotationDuration = 5000

            const rotationDirection = Math.random() < 0.5 ? 1 : -1;
            const currentRotationSpeed = rotationSpeed * rotationDirection;

            const animate = () => {
                if (!isRotationActive.value) {
                    isRotating.value = false;
                    return;
                }

                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < rotationDuration) {
                    rotationDegree.value = initialRotation + currentRotationSpeed * elapsedTime / 1000
                    requestAnimationFrame(animate);
                } else {
                    isRotating.value = false;
                    setTimeout(() => {
                        startRotation();
                    }, config.value.rotationFrequency);
                }
            };
            requestAnimationFrame(animate);
        }

        const stopRotation = () => {
            isRotationActive.value = false;
            isRotating.value = false;
            rotationDegree.value = 0
        }

        const restartRotation = () => {
            isRotationActive.value = true;
            startRotation();
        }

        const initConfig = () => {
            const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
            const configRotatingMaze = scheduleData.tests.find((t) => t.testUrl === 'rotating-maze-test')
            const { duration, rotation_frequency, id } = configRotatingMaze.config

            const ROTATION_FREQUENCY_VALUE = {
                easy: 6000,
                medium: 4000,
                hard: 2000
            }

            config.value = {
                duration: duration * 10,
                rotationFrequency: ROTATION_FREQUENCY_VALUE[rotation_frequency],
                size: 'medium', // still hardcode
                difficulty: 'medium', // difficulty masih hardcode
                userId: scheduleData.userId,
                sessionId: scheduleData.sessionId,
                testId: id
            }
        }

        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
        }

        const submitResult = async () => {
            try {
                loadingSubmit.value = true;
                const API_URL = process.env.VUE_APP_API_URL;
                const payload = {
                    testSessionId: config.value.sessionId,
                    userId: config.value.userId,
                    batteryTestConfigId: config.value.testId,
                    result: arrayMetrics.value
                }

                console.log(API_URL, payload)
                // const response = await fetch(`${API_URL}api/submission`, {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify(payload),
                // });

                // if (!response.ok) {
                //     throw new Error(`Error: ${response.statusText}`);
                // }
                // removeTestByNameAndUpdateLocalStorage('Rotating Maze')
                // localStorage.removeItem('arrayMetrics')
                // this.$router.push('/module');
            } catch (error) {
                console.log(error, "<< error")
            } finally {
                loadingSubmit.value = false; // Set loading to false when the submission is complete
            }
        }

        const countDownTestTime = () => {
            tesInterval.value = setInterval(async () => {
                if (config.value.duration > 0) {
                    config.value.duration--;
                } else {
                    clearInterval(tesInterval.value);
                    await submitResult();
                }
            }, 1000)
        }

        onMounted(() => {
            loadingGenerating.value = true
            initConfig()
            generateGrid();
            mazeGenerator();

            window.addEventListener('keydown', handleKeyPress);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyPress)
            clearInterval(tesInterval.value);
        })

        return {
            mazeWidth,
            mazeHeight,
            cellSize,
            gridSizeX,
            gridSizeY,
            quizMetrics,
            loadingGenerating,
            rotationDegree,
            config,
            loadingSubmit,
            setGridProperties,
            placeToCell,
            generateGrid,
            clear,
            mazeGenerator,
            greedyBestFirst,
            changeDifficulty,
            formatTime,
        };

    }

};
</script>

<style>
#containerMaze {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

#gridMaze {
    background-color: rgb(231, 231, 233);
    position: absolute;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
    z-index: 2;
}

#visualizerMaze {
    position: fixed;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
    height: 100%;
    z-index: 1;
    transition: transform 0.3s ease;
}

#my_table {
    border-spacing: 0;
    border-collapse: collapse;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 4;
}

.circularBaseMaze {
    width: 460px;
    height: 460px;
    border-radius: 50%;
    border: 2px solid black;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 4%;
}

.rotationIndicatorMaze {
    position: absolute;
    top: 50%;
    right: -40px;
    width: 0;
    height: 0;
    transform: translateY(-50%);

    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 20px solid white;

    /* Add the black border */
    filter: drop-shadow(-2px 0 0 black) drop-shadow(0 2px 0 black) drop-shadow(2px 0 0 black) drop-shadow(0 -1px 0 black);
}

@-webkit-keyframes algo_in {
    from {
        background-size: calc(0%) calc(0%);
    }

    to {
        background-size: calc(100%) calc(100%);
    }
}

@keyframes algo_in {
    from {
        background-size: calc(0%) calc(0%);
    }

    to {
        background-size: calc(100%) calc(100%);
    }
}

.cell {
    z-index: 5;
    background-position: center;
    background-repeat: no-repeat;
}

.cell_1 {
    background-color: rgb(255, 255, 255);
}

.cell_2 {
    background-color: rgb(231, 231, 233);
}

.cell_wall {
    background-color: rgb(33, 40, 65);
}

.cell_algo {
    background-image: url(./shapes/algo.svg);
    background-size: calc(100%) calc(100%);
    -webkit-animation: algo_in 0.3s;
    animation: algo_in 0.3s;
}

.cell_1.cell_path {
    background-color: rgb(251, 244, 79);
}

.cell_2.cell_path {
    background-color: rgb(245, 238, 73);
}

.cell_1.visited_cell {
    background-color: rgb(164, 215, 246);
}

.cell_2.visited_cell {
    background-color: rgb(152, 203, 235);
}

.start {
    background-image: url(./shapes/start.svg);
    background-size: 100% 100%;
}

.target {
    background-image: url(./shapes/target.svg);
    background-size: 100% 100%;
}

.containerSettingMaze {
    position: relative;
    height: 100vh;
}

.settingMaze {
    position: absolute;
    background-color: aqua;
    height: 100%;
    width: 200px;
    padding: 20px
}

.loadingFirstMaze {
    width: 100vw;
    height: 100vh;
    background-color: white;
    z-index: 199;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}

.loadingFirstMaze p {
    margin-top: 50px;
    font-size: 24px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.spinnerMaze {
    width: 80px;
    height: 80px;
    border: 12px solid #5b4ac4;
    border-top-color: #cecece;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.timerMaze {
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

.timerMaze p {
    margin: 0;
    padding: 0;
}

.timerMaze :nth-child(1) {
    font-size: 12px;
}

.timerMaze :nth-child(2) {
    font-size: 24px;
    margin-top: 4px
}

.loadingContainerMaze {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.loadingContainerMaze p {
    margin-top: 50px;
    font-size: 24px;
}
</style>