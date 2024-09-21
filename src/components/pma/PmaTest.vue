<template>
    <div class="canvas-container">
        <canvas ref="canvas" width="500" height="500"></canvas>
        <div v-if="joystickConnected" class="joystick-status connected">Joystick Connected</div>
        <div v-else class="joystick-status disconnected">Joystick Disconnected</div>
        <div class="score-display">
            <div>Circle Time - Blue: {{ blueTime.toFixed(1) }}s, Red: {{ redTime.toFixed(1) }}s</div>
            <div>Dot Time - Green: {{ greenTime.toFixed(1) }}s, Red: {{ dotRedTime.toFixed(1) }}s</div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
    name: 'PMATrackingTest',
    setup() {
        const canvas = ref(null);
        const joystickConnected = ref(false);
        const thrusterConnected = ref(false);
        let ctx;
        let animationId;
        let joystick = null;
        let thruster = null;

        const centerX = 250;
        const centerY = 250;
        let solidCircleRadius = 150;
        let referenceCircleRadius = 200;
        let expandInterval = 3000; // 3 seconds
        let lastExpandTime = 0;
        let expanding = true;
        let dotX = centerX;
        let dotY = centerY;
        let pillAngle = 0;
        let pillSpeed = 0.02;
        let pillDirection = 1;
        let pillMoveTimer = 0;
        let pillPauseDuration = 0;

        // Scoring variables
        const blueTime = ref(0);
        const redTime = ref(0);
        const greenTime = ref(0);
        const dotRedTime = ref(0);

        const drawTrackingTest = () => {
            ctx.clearRect(0, 0, 500, 500);

            // Draw crosshair
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.moveTo(centerX - 400, centerY);
            ctx.lineTo(centerX + 400, centerY);
            ctx.moveTo(centerX, centerY - 400);
            ctx.lineTo(centerX, centerY + 400);
            ctx.stroke();

            // Draw solid circle (changes color based on size comparison)
            ctx.beginPath();
            ctx.setLineDash([]);
            const radiusDifference = Math.abs(solidCircleRadius - referenceCircleRadius);
            ctx.strokeStyle = radiusDifference <= 20 ? 'blue' : 'red';
            ctx.arc(centerX, centerY, solidCircleRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw reference (dotted) circle
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'lightgray';
            ctx.arc(centerX, centerY, referenceCircleRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw pill
            ctx.beginPath();
            ctx.fillStyle = 'orange';
            const pillX = centerX + Math.cos(pillAngle) * solidCircleRadius;
            const pillY = centerY + Math.sin(pillAngle) * solidCircleRadius;
            ctx.save();
            ctx.translate(pillX, pillY);
            ctx.rotate(pillAngle);
            ctx.fillRect(-5, -10, 30, 10);  // Longer pill
            ctx.restore();

            // Draw dot (changes color based on position)
            const distanceFromCenter = Math.sqrt(Math.pow(dotX - centerX, 2) + Math.pow(dotY - centerY, 2));
            ctx.beginPath();
            ctx.fillStyle = distanceFromCenter <= solidCircleRadius ? 'green' : 'red';
            ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
            ctx.fill();
        };

        const updateGameState = (timestamp, deltaTime) => {
            // Update reference circle size at random intervals
            if (timestamp - lastExpandTime > expandInterval) {
                expanding = Math.random() < 0.5;
                lastExpandTime = timestamp;
                expandInterval = 2000 + Math.random() * 2000; // Random interval between 2-4 seconds
            }

            if (expanding) {
                referenceCircleRadius = Math.min(referenceCircleRadius + 0.35, 220);
            } else {
                referenceCircleRadius = Math.max(referenceCircleRadius - 0.35, 100);
            }

            // Update pill position with random pauses
            if (pillMoveTimer <= 0) {
                if (pillPauseDuration > 0) {
                    pillPauseDuration--;
                } else {
                    pillAngle += pillSpeed * pillDirection;
                    if (pillAngle > Math.PI * 2) pillAngle -= Math.PI * 2;
                    if (pillAngle < 0) pillAngle += Math.PI * 2;

                    // Randomly change pill direction and set new pause
                    if (Math.random() < 0.02) {
                        pillDirection = Math.random() < 0.5 ? 1 : -1;
                        pillPauseDuration = Math.floor(Math.random() * 120) + 60;
                        pillMoveTimer = Math.floor(Math.random() * 300) + 300;
                    }
                }
            } else {
                pillMoveTimer--;
            }

            // Update solid circle radius based on thruster input
            if (thruster) {
                const thrusterState = navigator.getGamepads()[thruster.index];
                if (thrusterState) {
                    // Assuming the thruster uses axis[2] for control, adjust if needed
                    solidCircleRadius += thrusterState.axes[2] * 2;
                    solidCircleRadius = Math.max(50, Math.min(250, solidCircleRadius)); // Keep radius within bounds
                }
            }

            // Update dot position based on joystick input
            if (joystick) {
                const joystickState = navigator.getGamepads()[joystick.index];
                if (joystickState) {
                    const axes = joystickState.axes;
                    dotX += axes[0] * 2;
                    dotY += axes[1] * 2;

                    // Add a slight tendency to move outwards
                    const angle = Math.atan2(dotY - centerY, dotX - centerX);
                    dotX += Math.cos(angle) * 0.5;
                    dotY += Math.sin(angle) * 0.5;

                    // Keep dot within canvas bounds
                    dotX = Math.max(0, Math.min(500, dotX));
                    dotY = Math.max(0, Math.min(500, dotY));
                }
            }

            // Update scores
            const radiusDifference = Math.abs(solidCircleRadius - referenceCircleRadius);
            if (radiusDifference <= 20) {
                blueTime.value += deltaTime;
            } else {
                redTime.value += deltaTime;
            }

            const distanceFromCenter = Math.sqrt(Math.pow(dotX - centerX, 2) + Math.pow(dotY - centerY, 2));
            if (distanceFromCenter <= solidCircleRadius) {
                greenTime.value += deltaTime;
            } else {
                dotRedTime.value += deltaTime;
            }
        };

        let lastTimestamp = 0;
        const gameLoop = (timestamp) => {
            const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
            lastTimestamp = timestamp;

            updateGameState(timestamp, deltaTime);
            drawTrackingTest();
            animationId = requestAnimationFrame(gameLoop);
        };

        const handleGamepadConnected = (e) => {
            console.log('Connected:', e);
            if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
                console.log("Correct gamepad connected:", e.gamepad);
                joystick = e.gamepad;
                joystickConnected.value = true;
            } else if (e.gamepad.id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
                console.log("Correct thruster connected:", e.gamepad);
                thruster = e.gamepad;
                thrusterConnected.value = true;
            }
        };

        const handleGamepadDisconnected = (e) => {
            console.log("Gamepad disconnected:", e.gamepad);
            if (joystick && joystick.index === e.gamepad.index) {
                joystick = null;
                joystickConnected.value = false;
            }
        };

        onMounted(() => {
            ctx = canvas.value.getContext('2d');
            gameLoop();

            window.addEventListener("gamepadconnected", handleGamepadConnected);
            window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
        });

        onUnmounted(() => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("gamepadconnected", handleGamepadConnected);
            window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
        });

        return { canvas, joystickConnected, blueTime, redTime, greenTime, dotRedTime };
    }
};
</script>

<style scoped>
.canvas-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.joystick-status,
.score-display {
    margin-top: 10px;
}

.joystick-status {
    padding: 5px 10px;
    border-radius: 5px;
    font-weight: bold;
}

.connected {
    background-color: #4CAF50;
    color: white;
}

.disconnected {
    background-color: #f44336;
    color: white;
}

.score-display {
    font-family: Arial, sans-serif;
    font-size: 14px;
}
</style>