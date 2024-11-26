<template>
    <div>
        <!-- Training Start Modal -->
        <Modal v-if="showTrainingStartModal" @close="startTraining">
            <h2>Welcome to the Maze Game Training</h2>
            <p>
                Dalam sesi pelatihan ini, Anda akan berlatih menavigasi melalui labirin.
                Gunakan tombol panah untuk bergerak. Tujuannya adalah mencapai target secepat mungkin.
                Sesi ini akan membantu Anda terbiasa dengan kontrol dan tingkat kesulitan.
            </p>
            <button @click="startTraining" class="bg-[#6757dc] text-white px-4 py-2 rounded-lg mt-2">Start
                Training</button>
        </Modal>

        <!-- Actual Test Start Modal -->
        <Modal v-if="showTestStartModal" @close="startActualTest">
            <h2>Ready for the Actual Test?</h2>
            <p>
                Kerja bagus menyelesaikan pelatihan!
                Anda sekarang siap untuk memulai tes sebenarnya.
                Ingat, kinerja Anda dalam tes ini akan dicatat.
            </p>
            <button @click="startActualTest" class="bg-[#6757dc] text-white px-4 py-2 rounded-lg mt-2">Start
                Test</button>
        </Modal>

        <!-- Existing game content -->
        <div v-if="loadingSubmit" class="loadingContainerMaze">
            <div class="spinnerMaze"></div>
            <p class="loadingText">Your result is submitting...</p>
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
                    <div id="gridMaze"
                        :style="{ width: `${cellSize * gridSizeX}px`, height: `${cellSize * gridSizeY}px` }">
                    </div>
                    <div class="rotationIndicatorMaze"></div>
                </div>
            </div>
        </div>

        <div class="timerMaze">
            <p>{{ isTraining ? 'Training' : 'Test' }} Progress: </p>
            <p>{{ completedMazes }} / {{ isTraining ? trainingMazes : config.numberOfMaze }}</p>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { completeTrainingTestAndUpdateLocalStorage, removeTestByNameAndUpdateLocalStorage } from '@/utils/index'
import { useRouter } from 'vue-router'
import Modal from './ModalTraining.vue';  // Assume we have a Modal component

export default {
    name: 'RotationMaze',
    components: { Modal },
    setup() {
        const router = useRouter()
        const loadingSubmit = ref(false)
        const mazeWidth = ref(400)
        const mazeHeight = ref(400)
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
        const isRotationActive = ref(true)
        const loadingGenerating = ref(false)
        const isTraining = ref(true);
        const showTrainingStartModal = ref(true);
        const showTestStartModal = ref(false);
        const trainingMazes = 3;  // Number of training mazes
        const config = ref({
            numberOfMaze: 10,
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
        })
        const arrayMetrics = ref([])
        const refreshCount = ref(0)
        const completedMazes = ref(0)
        // 
        const mazeCompletionTime = ref([])
        const mazeStartTime = ref(0)

        const setGridSizeByDifficulty = () => {
            let baseSize = 15;
            switch (config.value.difficulty) {
                case 'Mudah':
                    return Math.floor(baseSize * 0.75);
                case 'Sedang':
                    return baseSize;
                case 'Sulit':
                    return Math.floor(baseSize * 1.25);
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
            let x, y;
            do {
                x = Math.floor(Math.random() * (gridSizeX.value - 2)) + 1;
                y = Math.floor(Math.random() * (gridSizeY.value - 2)) + 1;
            } while (x % 2 === 0 || y % 2 === 0);
            return [x, y];
        }

        const getInitialTargetPos = () => {
            let x, y;
            const minDistance = Math.floor(Math.max(gridSizeX.value, gridSizeY.value) * 0.6); // 60% of the larger grid dimension
            do {
                x = Math.floor(Math.random() * (gridSizeX.value - 2)) + 1;
                y = Math.floor(Math.random() * (gridSizeY.value - 2)) + 1;
            } while (
                x % 2 === 0 || y % 2 === 0 ||
                (x === startPos.value[0] && y === startPos.value[1]) ||
                Math.abs(x - startPos.value[0]) + Math.abs(y - startPos.value[1]) < minDistance
            );
            return [x, y];
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

            placeToCell(startPos.value[0], startPos.value[1]).classList.add("start");
            placeToCell(targetPos.value[0], targetPos.value[1]).classList.add("target");
        }

        // const changeDifficulty = (newDifficulty) => {
        //     config.value.difficulty = newDifficulty;
        //     // loadingGenerating.value = true
        //     generateGrid();
        //     mazeGenerator();
        // }

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
            };

            while (!solvableMaze && attempts < maxAttempts) {
                attempts++;
                console.log(`Attempting to generate maze: Attempt ${attempts}`);
                mazeStartTime.value = Date.now()
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

        const startTraining = () => {
            showTrainingStartModal.value = false;
            isTraining.value = true;
            resetGame();
            generateGrid();
            mazeGenerator();
        };

        const startActualTest = () => {
            showTestStartModal.value = false;
            isTraining.value = false;
            resetGame();
            generateGrid();
            mazeGenerator();
        };

        const resetGame = () => {
            completedMazes.value = 0;
            arrayMetrics.value = [];
            mazeCompletionTime.value = [];
            quizMetrics.value = {
                correctTurn: 0,
                wrongTurn: 0,
                leastPossibleMove: 0,
                wallHit: 0,
                avgStepResponse: 0,
            };
        };

        const updateConfigForNewDifficulty = (currentDifficulty) => {
            const ROTATION_FREQUENCY_VALUE = {
                easy: 6000,
                medium: 4000,
                hard: 2000
            };

            const DIFFICULTY_PROGRESSION = {
                'Mudah': 'Sedang',
                'Sedang': 'Sulit'
            };

            const nextDifficulty = DIFFICULTY_PROGRESSION[currentDifficulty];
            if (!nextDifficulty) return false;

            const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
            const configRotatingMaze = scheduleData.tests.find((t) => t.testUrl === 'rotating-maze-test');
            const nextConfig = configRotatingMaze.configs.find((c) => c.difficulty_level === nextDifficulty);

            if (!nextConfig) return false;

            const { rotation_frequency, size, duration, difficulty_level } = nextConfig;

            completedMazes.value = 0

            config.value = {
                numberOfMaze: Number(duration) ?? 10,
                rotationFrequency: ROTATION_FREQUENCY_VALUE[rotation_frequency] ??
                    (difficulty_level === 'Sulit' ? 2000 : 4000),
                size: size ?? "medium",
                difficulty: difficulty_level ?? nextDifficulty,
                userId: scheduleData.userId,
                sessionId: scheduleData.sessionId,
                testId: configRotatingMaze.id
            };

            return true;
        };

        const movePlayer = async (direction) => {
            // prevent user move when generating maze
            if (loadingGenerating.value) return

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
                ((quizMetrics.value.avgStepResponse * (totalMoves.value - 1) + stepTime) / totalMoves.value).toFixed(2)
            lastMoveTime.value = currentTime;

            // Check if player reached the target
            if (newX === targetPos.value[0] && newY === targetPos.value[1]) {
                const completeTime = Date.now() - mazeStartTime.value;

                if (!isTraining.value) {
                    mazeCompletionTime.value.push({
                        type: 'correct',
                        responseTime: completeTime,
                        timestamp: Date.now(),
                    });

                    arrayMetrics.value.push({ ...quizMetrics.value, completionTime: completeTime });
                    localStorage.setItem('arrayMetrics', JSON.stringify(arrayMetrics.value));
                }

                quizMetrics.value = {
                    correctTurn: 0,
                    wrongTurn: 0,
                    leastPossibleMove: 0,
                    wallHit: 0,
                    avgStepResponse: 0,
                };

                completedMazes.value++;

                if (isTraining.value && completedMazes.value >= trainingMazes) {
                    completeTrainingTestAndUpdateLocalStorage('Rotating Maze')
                    showTestStartModal.value = true;
                } else if (!isTraining.value && completedMazes.value >= config.value.numberOfMaze && config.value.difficulty === "Sulit") {
                    await submitResult();
                } else {
                    stopRotation();
                    loadingGenerating.value = true;

                    // change the config
                    if (config.value.numberOfMaze === completedMazes.value) {
                        updateConfigForNewDifficulty(config.value.difficulty);
                    }

                    await generateGrid();
                    await mazeGenerator();
                    restartRotation();
                }
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
            const rotationDuration = 1000

            let maxRotation;
            switch (config.value.difficulty) {
                case 'Mudah':
                    maxRotation = 90;
                    break;
                case 'Sedang':
                    maxRotation = 180;
                    break;
                case 'Sulit':
                    maxRotation = 270;
                    break;
                default:
                    maxRotation = 90;
            }

            const rotationDirection = Math.random() < 0.5 ? 1 : -1;
            const targetRotation = rotationDirection * (Math.random() * maxRotation);

            const animate = () => {
                if (!isRotationActive.value) {
                    isRotating.value = false;
                    return;
                }

                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < rotationDuration) {
                    const progress = elapsedTime / rotationDuration;
                    rotationDegree.value = initialRotation + targetRotation * progress;
                    requestAnimationFrame(animate);
                } else {
                    rotationDegree.value = initialRotation + targetRotation;
                    isRotating.value = false;
                    setTimeout(() => {
                        startRotation();
                    }, 10000); // 5 seconds longer interval
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

            if (configRotatingMaze.trainingCompleted) {
                showTrainingStartModal.value = false;
                showTestStartModal.value = true;
            }
            const configMudah = configRotatingMaze.configs.find((c) => c.difficulty_level === "Mudah")
            const { rotation_frequency, size, number_of_question, difficulty_level } = configMudah

            const ROTATION_FREQUENCY_VALUE = {
                easy: 6000,
                medium: 4000,
                hard: 2000
            }

            config.value = {
                numberOfMaze: Number(number_of_question) ?? 10,
                rotationFrequency: ROTATION_FREQUENCY_VALUE[rotation_frequency] ?? 4000,
                size: size ?? "medium",
                difficulty: difficulty_level ?? "Mudah",
                userId: scheduleData.userId,
                sessionId: scheduleData.sessionId,
                testId: configRotatingMaze.id
            }
        }

        const submitResult = async () => {
            try {
                loadingSubmit.value = true;
                const API_URL = process.env.VUE_APP_API_URL;
                const payload = {
                    testSessionId: config.value.sessionId,
                    userId: config.value.userId,
                    batteryTestId: config.value.testId,
                    result: {
                        mazecompletions: arrayMetrics.value,
                        graph_data: mazeCompletionTime.value
                    },
                    refreshCount: refreshCount.value
                }

                const response = await fetch(`${API_URL}/api/submission`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                removeTestByNameAndUpdateLocalStorage('Rotating Maze')
                localStorage.removeItem('arrayMetrics')
                localStorage.removeItem('refreshCountRotatingMaze')
                router.push('/module');
            } catch (error) {
                console.log(error, "<< error")
            } finally {
                loadingSubmit.value = false;
            }
        }

        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
        }

        const handleBeforeUnload = () => {
            // Save the current refresh count to localStorage before the page unloads
            localStorage.setItem('refreshCountRotatingMaze', refreshCount.value.toString());
        }

        onMounted(() => {
            loadingGenerating.value = true;
            initConfig();
            window.addEventListener('keyup', handleKeyPress)
            // Don't generate grid or start maze here, wait for user to start training
        });

        onUnmounted(() => {
            window.removeEventListener('keyup', handleKeyPress)
            window.removeEventListener('beforeunload', handleBeforeUnload);

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
            formatTime,
            completedMazes,
            isTraining,
            showTrainingStartModal,
            showTestStartModal,
            startTraining,
            startActualTest,
            trainingMazes,
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
    top: -10%;
    right: 50%;
    width: 0;
    height: 0;
    transform: translateX(50%) rotate(-90deg);

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