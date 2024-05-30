<template>
    <div ref="mazeContainer" class="maze-container"></div>
  </template>
  
  <script>
  import p5 from 'p5';
  
  export default {
    name: 'MazeGame',
    data() {
      return {
        maze: [],
        mazeSize: 10,
        cellSize: 40,
        player: {
          x: 0,
          y: 0,
          radius: 15,
          color: 'blue'
        },
        target: {
          x: 9,
          y: 9,
          radius: 15,
          color: 'green'
        },
        rotationAngle: 0,
        rotationInterval: 5000 // 5 seconds
      };
    },
    methods: {
      generateMaze(size) {
        const maze = new Array(size).fill(null).map(() => new Array(size).fill(0));
        const directions = [
          [-1, 0], // up
          [1, 0], // down
          [0, -1], // left
          [0, 1] // right
        ];
  
        const carvePath = (x, y) => {
          const stack = [[x, y]];
          maze[x][y] = 1;
  
          while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            const availableDirections = directions.filter(([dx, dy]) => {
              const nx = cx + dx;
              const ny = cy + dy;
              const mx = cx + dx / 2;
              const my = cy + dy / 2;
              return (
                nx >= 0 &&
                ny >= 0 &&
                nx < size &&
                ny < size &&
                maze[nx][ny] === 0 &&
                maze[mx][my] === 0
              );
            });
  
            if (availableDirections.length > 0) {
              const [dx, dy] = availableDirections[Math.floor(Math.random() * availableDirections.length)];
              maze[cx + dx / 2][cy + dy / 2] = 1;
              maze[cx + dx][cy + dy] = 1;
              stack.push([cx + dx, cy + dy]);
            } else {
              stack.pop();
            }
          }
        };
  
        carvePath(0, 0);
        maze[0][0] = 1;
        maze[size - 1][size - 1] = 1;
  
        return maze;
      },
      sketch(p) {
        p.setup = () => {
          const canvas = p.createCanvas(this.mazeSize * this.cellSize, this.mazeSize * this.cellSize);
          canvas.parent(this.$refs.mazeContainer);
          this.maze = this.generateMaze(this.mazeSize);
          this.drawMaze(p);
          this.drawPlayer(p);
          this.drawTarget(p);
          setInterval(() => {
            this.rotateMaze(p);
          }, this.rotationInterval);
        };
  
        p.draw = () => {};
  
        p.keyPressed = () => {
          this.handleKeydown(p);
        };
      },
      drawMaze(p) {
        p.background(240);
        p.push();
        p.translate(p.width / 2, p.height / 2);
        p.rotate(this.rotationAngle);
        p.translate(-p.width / 2, -p.height / 2);
        p.stroke(0);
        p.strokeWeight(2);
  
        for (let i = 0; i < this.maze.length; i++) {
          for (let j = 0; j < this.maze[i].length; j++) {
            if (this.maze[i][j] === 0) {
              p.fill(0);
              p.rect(j * this.cellSize, i * this.cellSize, this.cellSize, this.cellSize);
            }
          }
        }
        p.pop();
      },
      drawPlayer(p) {
        p.fill(this.player.color);
        p.noStroke();
        p.ellipse(
          this.player.x * this.cellSize + this.cellSize / 2,
          this.player.y * this.cellSize + this.cellSize / 2,
          this.player.radius * 2,
          this.player.radius * 2
        );
      },
      drawTarget(p) {
        p.fill(this.target.color);
        p.noStroke();
        p.ellipse(
          this.target.x * this.cellSize + this.cellSize / 2,
          this.target.y * this.cellSize + this.cellSize / 2,
          this.target.radius * 2,
          this.target.radius * 2
        );
      },
      handleKeydown(p) {
        const directions = {
          87: [-1, 0], // w
          65: [0, -1], // a
          83: [1, 0], // s
          68: [0, 1] // d
        };
        const direction = directions[p.keyCode];
        if (direction) {
          const [dx, dy] = direction;
          const newX = this.player.x + dx;
          const newY = this.player.y + dy;
          if (
            newX >= 0 &&
            newX < this.mazeSize &&
            newY >= 0 &&
            newY < this.mazeSize &&
            this.maze[newX][newY] === 1
          ) {
            this.player.x = newX;
            this.player.y = newY;
            this.checkForWin();
          }
        }
        this.drawMaze(p);
        this.drawPlayer(p);
        this.drawTarget(p);
      },
      rotateMaze(p) {
        this.rotationAngle += p.PI / 2; // Rotate by 90 degrees
        this.drawMaze(p);
        this.drawPlayer(p);
        this.drawTarget(p);
      },
      checkForWin() {
        if (this.player.x === this.target.x && this.player.y === this.target.y) {
          console.log('Player has reached the target!');
        }
      }
    },
    mounted() {
      new p5(this.sketch);
    }
  };
  </script>
  
  <style>
  .maze-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f0f0;
  }
  </style>
  