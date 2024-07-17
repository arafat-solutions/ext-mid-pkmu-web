export const dijkstra = (maze, start, goal, canMove) => {
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

        if (current.x === goal.x && current.y === goal.y) {
            break;
        }

        const neighbors = [
            { x: current.x, y: current.y - 1 }, // Up
            { x: current.x, y: current.y + 1 }, // Down
            { x: current.x - 1, y: current.y }, // Left
            { x: current.x + 1, y: current.y }, // Right
        ];

        for (const neighbor of neighbors) {
            if (canMove(current.x, current.y, neighbor.x, neighbor.y)) {
                const newDist = dist[current.y][current.x] + 1;
                if (newDist < dist[neighbor.y][neighbor.x]) {
                    dist[neighbor.y][neighbor.x] = newDist;
                    prev[neighbor.y][neighbor.x] = { x: current.x, y: current.y };
                    queue.push({ x: neighbor.x, y: neighbor.y, dist: newDist });
                }
            }
        }
    }

    // Reconstruct path
    const path = [];
    let current = goal;
    while (current) {
        path.unshift(current);
        current = prev[current.y][current.x];
    }

    return { path, distance: dist[goal.y][goal.x] };
}