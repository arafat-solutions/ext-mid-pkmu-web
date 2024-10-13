<template>
    <div class="canvas-container">
        <canvas ref="canvas" width="500" height="500"></canvas>
        <div v-if="joystickConnected" class="joystick-status connected">Joystick Connected</div>
        <div v-if="thrusterConnected" class="joystick-status connected">Thruster Connected</div>
        <div v-else class="joystick-status disconnected">Joystick Disconnected</div>
        <div class="score-display">
            <div>Circle Time - Blue: {{ circle_correct_position.toFixed(1) }}s, Red: {{ circle_wrong_position.toFixed(1)
                }}s</div>
            <div>Dot Time - Green: {{ dot_correct_position.toFixed(1) }}s, Red: {{ dot_wrong_position.toFixed(1) }}s
            </div>
            <div>Pill Time - Green: {{ pill_correct_position.toFixed(1) }}s, Yellow: {{ pill_wrong_position.toFixed(1)
                }}s</div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';

export default {
    name: 'PMATrackingTest',
    setup(props, { emit }) {
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
        let lastPillMoveTime = 0;
        const pillMoveInterval = 2000; // 2 seconds

        // Scoring variables
        const circle_correct_position = ref(0);
        const circle_wrong_position = ref(0);
        const dot_correct_position = ref(0);
        const dot_wrong_position = ref(0);
        const pill_correct_position = ref(0);
        const pill_wrong_position = ref(0);
        let targetRadius = 150; // Initial target radius
        const smoothingFactor = 0.1; // Adjust this value to control smoothness (0.05 to 0.2 recommended)

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
            ctx.fillStyle = getPillColor();
            const pillX = centerX + Math.cos(pillAngle) * solidCircleRadius;
            const pillY = centerY + Math.sin(pillAngle) * solidCircleRadius;
            const pillWidth = 20;
            const pillHeight = 10;
            const radius = pillHeight / 2;

            ctx.save();
            ctx.translate(pillX, pillY);
            ctx.rotate(pillAngle);

            // Draw the rounded rectangle
            ctx.moveTo(-pillWidth / 2 + radius, -pillHeight / 2);
            ctx.lineTo(pillWidth / 2 - radius, -pillHeight / 2);
            ctx.arc(pillWidth / 2 - radius, 0, radius, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(-pillWidth / 2 + radius, pillHeight / 2);
            ctx.arc(-pillWidth / 2 + radius, 0, radius, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();

            ctx.fill();
            ctx.restore();

            // Draw dot (changes color based on position)
            const distanceFromCenter = Math.sqrt(Math.pow(dotX - centerX, 2) + Math.pow(dotY - centerY, 2));
            ctx.beginPath();
            ctx.fillStyle = distanceFromCenter <= solidCircleRadius ? 'green' : 'red';
            ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
            ctx.fill();
        };

        const getPillColor = () => {
            const absAngle = Math.abs(pillAngle % (Math.PI * 2));
            if (absAngle <= Math.PI / 4 || absAngle >= Math.PI * 7 / 4) {
                return 'red';
            } else if (absAngle > Math.PI / 4 && absAngle < Math.PI * 3 / 4) {
                return 'red';
            } else {
                return 'yellow';
            }
        };

        const updateGameState = (timestamp, deltaTime) => {
            if (typeof deltaTime !== 'number' || isNaN(deltaTime)) {
                console.error('Invalid deltaTime:', deltaTime);
                return;
            }
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

            // Update pill position at intervals
            if (timestamp - lastPillMoveTime > pillMoveInterval) {
                pillAngle += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 36; // 5 degree movement
                lastPillMoveTime = timestamp;
            }

            // Update pill position based on thruster pedals
            if (thruster) {
                const thrusterState = navigator.getGamepads()[thruster.index];
                if (thrusterState) {
                    const pedalValue = thrusterState.axes[5];
                    pillAngle += pedalValue * 0.05; // Adjust sensitivity as needed

                    // Keep pillAngle within -PI to PI
                    pillAngle = Math.atan2(Math.sin(pillAngle), Math.cos(pillAngle));
                }
            }

            // Keep pillAngle within 0 to 2PI
            pillAngle = (pillAngle + Math.PI * 2) % (Math.PI * 2);

            // Update solid circle radius based on thruster input
            if (thruster) {
                updateSolidCircleRadius()
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
                circle_correct_position.value += deltaTime;
            } else {
                console.log('Wrong position');
                circle_wrong_position.value += deltaTime;
            }

            const distanceFromCenter = Math.sqrt(Math.pow(dotX - centerX, 2) + Math.pow(dotY - centerY, 2));
            if (distanceFromCenter <= solidCircleRadius) {
                dot_correct_position.value += deltaTime;
            } else {
                dot_wrong_position.value += deltaTime;
            }

            const pillColor = getPillColor();
            if (pillColor === 'yellow') {
                pill_correct_position.value += deltaTime;
            } else if (pillColor === 'red') {
                pill_wrong_position.value += deltaTime;
            }
        };

        // Update solid circle radius based on thruster input
        const updateSolidCircleRadius = () => {
            if (thruster) {
                const thrusterState = navigator.getGamepads()[thruster.index];
                if (thrusterState) {
                    const axisValue = thrusterState.axes[2];
                    // Map the axis value (-1 to 1) to a radius range (50 to 250)
                    targetRadius = ((axisValue + 1) / 2) * (250 - 50) + 50;
                }
            }

            // Smoothly interpolate between current radius and target radius
            const diff = targetRadius - solidCircleRadius;
            solidCircleRadius += diff * smoothingFactor;

            // Ensure the radius stays within bounds
            solidCircleRadius = Math.max(50, Math.min(250, solidCircleRadius));
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
            } else if (thruster && thruster.index === e.gamepad.index) {
                thruster = null;
                thrusterConnected.value = false;
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

        const emitScoreUpdate = () => {
            emit('update-score', {
                circle_correct_position: circle_correct_position.value,
                circle_wrong_position: circle_wrong_position.value,
                dot_correct_position: dot_correct_position.value,
                dot_wrong_position: dot_wrong_position.value,
                pill_correct_position: pill_correct_position.value,
                pill_wrong_position: pill_wrong_position.value
            });
        };

        // Use watch to emit score updates whenever any of the time values change
        watch([circle_correct_position, circle_wrong_position, dot_correct_position, dot_wrong_position, pill_correct_position, pill_wrong_position], emitScoreUpdate);

        watch(circle_wrong_position, (newVal, oldVal) => {
            console.log('circle_wrong_position changed:', oldVal, '->', newVal);
        });
        return {
            canvas,
            joystickConnected,
            thrusterConnected,
            circle_correct_position,
            circle_wrong_position,
            dot_correct_position,
            dot_wrong_position,
            pill_correct_position,
            pill_wrong_position
        };
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