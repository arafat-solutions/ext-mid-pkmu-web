export const dijkstra = (maze, start, goal, canMove) => {
    console.log("Starting Dijkstra's algorithm");
    console.log("Start:", start, "Goal:", goal);
    console.log("Maze dimensions:", maze.lx, "x", maze.ly);

    const rows = maze.ly;
    const cols = maze.lx;
    const dist = Array(rows).fill().map(() => Array(cols).fill(Infinity));
    const prev = Array(rows).fill().map(() => Array(cols).fill(null));
    const queue = [];

    dist[start.y][start.x] = 0;
    queue.push({ x: start.x, y: start.y, dist: 0 });

    while (queue.length > 0) {
        queue.sort((a, b) => a.dist - b.dist);
        const current = queue.shift();
        console.log("Exploring node:", current);

        if (current.x === goal.x && current.y === goal.y) {
            console.log("Goal reached!");
            break;
        }

        const neighbors = [
            { x: current.x, y: current.y - 1 }, // Up
            { x: current.x, y: current.y + 1 }, // Down
            { x: current.x - 1, y: current.y }, // Left
            { x: current.x + 1, y: current.y }, // Right
        ];

        for (const neighbor of neighbors) {
            console.log(`Checking neighbor: (${neighbor.x}, ${neighbor.y})`);
            if (canMove(current.x, current.y, neighbor.x, neighbor.y)) {
                const newDist = dist[current.y][current.x] + 1;
                if (newDist < dist[neighbor.y][neighbor.x]) {
                    dist[neighbor.y][neighbor.x] = newDist;
                    prev[neighbor.y][neighbor.x] = { x: current.x, y: current.y };
                    queue.push({ x: neighbor.x, y: neighbor.y, dist: newDist });
                    console.log(`Added to queue: (${neighbor.x}, ${neighbor.y}), dist: ${newDist}`);
                }
            } else {
                console.log(`Cannot move to (${neighbor.x}, ${neighbor.y})`);
            }
        }
        console.log("Queue after exploring:", queue);
    }

    // Reconstruct path
    const path = [];
    let current = goal;
    while (current) {
        path.unshift(current);
        current = prev[current.y][current.x];
    }
    console.log("Dijkstra finished. Path:", path, "Distance:", dist[goal.y][goal.x]);
    return { path, distance: dist[goal.y][goal.x] };
}