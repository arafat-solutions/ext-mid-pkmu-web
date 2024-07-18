<template>
    <button @click="() => { generateGrid(); mazeGenerator(); }">new maze</button>
    <button @click="greedyBestFirst">View solution</button>
    <div id="containerMaze">
        <div id="visualizerMaze" :style="{ width: `${mazeWidth}px`, height: `${mazeHeight}px` }">
            <div id="gridMaze" :style="{ width: `${cellSize * gridSizeX}px`, height: `${cellSize * gridSizeY}px` }">
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
    name: 'RotationMaze',
    setup() {
        const initialMaxGridSize = 20;
        const initialStartPos = [1, 1]
        const initialTargetPos = [19, 18]
        const mazeWidth = ref(500);
        const mazeHeight = ref(500);
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

        const setGridProperties = () => {
            let ratio = mazeWidth.value / mazeHeight.value

            gridSizeX.value = Math.floor(initialMaxGridSize * ratio);
            gridSizeY.value = Math.floor(initialMaxGridSize * ratio)

            if (gridSizeX.value % 2 == 0)
                gridSizeX.value += 1;

            cellSize.value = Math.floor(mazeHeight.value / initialMaxGridSize);
        }

        const placeToCell = (x, y) => {
            return document.querySelector(".x_" + x.toString(10) + ".y_" + y.toString(10));
        }

        const generateGrid = () => {
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

            startPos.value = initialStartPos
            targetPos.value = initialTargetPos

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
            }, time));
        }

        const mazeGenerator = () => {
            let startTemp = startPos.value;
            let targetTemp = targetPos.value;
            generating.value = true;

            if (startTemp[0] % 2 == 0) {
                if (startTemp[0] == grid.value.length - 1)
                    startTemp[0] -= 1;
                else
                    startTemp[0] += 1;
            }

            if (startTemp[1] % 2 == 0) {
                if (startTemp[1] == 0)
                    startTemp[1] += 1;
                else
                    startTemp[1] -= 1;
            }

            if (targetTemp[0] % 2 == 0) {
                if (targetTemp[0] == grid.value.length - 1)
                    targetTemp[0] -= 1;
                else
                    targetTemp[0] += 1;
            }

            if (targetTemp[1] % 2 == 0) {
                if (targetTemp[1] == 0)
                    targetTemp[1] += 1;
                else
                    targetTemp[1] -= 1;
            }

            placeToCell(startPos.value[0], startPos.value[1]).classList.remove("start");
            placeToCell(startTemp[0], startTemp[1]).classList.add("start");
            placeToCell(targetPos.value[0], targetPos.value[1]).classList.remove("target");
            placeToCell(targetTemp[0], targetTemp[1]).classList.add("target");
            startPos.value = startTemp;
            targetPos.value = targetTemp;

            gridClean.value = false;
            recursiveDivision();

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
            if (x >= 0 && x < grid.value.length && y >= 0 && y < grid.value[0].length)
                return grid.value[x][y];

            return -2;
        }

        const mazeSolversInterval = () => {
            myInterval.value = window.setInterval(function () {
                if (!path.value) {
                    placeToCell(nodeList.value[nodeListIndex.value][0], nodeList.value[nodeListIndex.value][1]).classList.add("cell_algo");
                    nodeListIndex.value++;

                    if (nodeListIndex.value == nodeList.value.length) {
                        if (!found.value)
                            clearInterval(myInterval.value);

                        else {
                            path.value = true;
                            placeToCell(startPos.value[0], startPos.value[1]).classList.add("cell_path");
                        }
                    }
                }

                else {
                    if (pathListIndex.value == pathList.value.length) {
                        placeToCell(targetPos.value[0], targetPos.value[1]).classList.add("cell_path");
                        clearInterval(myInterval.value);
                        return;
                    }

                    placeToCell(pathList.value[pathListIndex.value][0], pathList.value[pathListIndex.value][1]).classList.remove("cell_algo");
                    placeToCell(pathList.value[pathListIndex.value][0], pathList.value[pathListIndex.value][1]).classList.add("cell_path");
                    pathListIndex.value++;
                }
            }, 10);
        }

        const greedyBestFirst = () => {
            nodeList.value = [];
            nodeListIndex.value = 0;
            pathList.value = [];
            pathListIndex.value = 0;
            found.value = false;
            path.value = false;
            let frontier = [startPos.value];
            grid.value[startPos.value[0]][startPos.value[1]] = 1;

            do {
                frontier.sort(function (a, b) {
                    return distance(a, targetPos.value) - distance(b, targetPos);
                });

                let list = getNeighbours(frontier[0], 1);
                frontier.splice(0, 1);

                for (let i = 0; i < list.length; i++)
                    if (getNode(list[i][0], list[i][1]) == 0) {
                        frontier.push(list[i]);
                        grid.value[list[i][0]][list[i][1]] = i + 1;

                        if (list[i][0] == targetPos.value[0] && list[i][1] == targetPos.value[1]) {
                            found.value = true;
                            break;
                        }

                        nodeList.value.push(list[i]);
                    }
            }
            while (frontier.length > 0 && !found.value)

            if (found.value) {
                let current_node = targetPos.value;

                while (current_node[0] != startPos.value[0] || current_node[1] != startPos.value[1]) {
                    switch (grid.value[current_node[0]][current_node[1]]) {
                        case 1: current_node = [current_node[0], current_node[1] + 1]; break;
                        case 2: current_node = [current_node[0] - 1, current_node[1]]; break;
                        case 3: current_node = [current_node[0], current_node[1] - 1]; break;
                        case 4: current_node = [current_node[0] + 1, current_node[1]]; break;
                        default: break;
                    }

                    pathList.value.push(current_node);
                }

                pathList.value.pop();
                pathList.value.reverse();
            }

            mazeSolversInterval();
        }

        onMounted(() => {
            console.log('Component mounted');
            generateGrid();
            mazeGenerator();
        });

        return {
            mazeWidth,
            mazeHeight,
            cellSize,
            gridSizeX,
            gridSizeY,
            setGridProperties,
            placeToCell,
            generateGrid,
            clear,
            mazeGenerator,
            greedyBestFirst
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
    box-shadow: 0px 0px 30px rgba(6, 13, 29, 0.692);
}

#visualizerMaze {
    position: fixed;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
    height: 100%;
    z-index: 1;
    background-color: rgb(197, 198, 211);
}

#my_table {
    border-spacing: 0;
    border-collapse: collapse;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 4;
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
</style>