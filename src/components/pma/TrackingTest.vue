<template>
  <div class="canvas-container">
    <canvas ref="canvas" width="500" height="500"></canvas>
    <!-- <div v-if="shouldShowJoystickStatus && joystickConnected" class="joystick-status connected">Joystick Connected</div>
        <div v-if="shouldShowThrusterStatus && thrusterConnected" class="joystick-status connected">Thruster Connected</div>
        <div v-if="(shouldShowJoystickStatus && !joystickConnected) || (shouldShowThrusterStatus && !thrusterConnected)"
             class="joystick-status disconnected">
            {{ getCurrentModeStatus }}
        </div> -->
  </div>
  <div
    class="centered-component"
    style="height: 120px; width: 500px; bottom: 20% !important"
  >
    <p
      v-if="
        !isActualTest &&
        (isCircleRed || isPillRed) &&
        (currentTraining == 'thruster' || currentTraining == 'all')
      "
    >
      ⚠️ Perhatian! ⚠️<br />Upayakan lingkaran potong berwarna
      <b>BIRU</b> dengan mengarahkan ke target lingkaran bergaris putus-putus
      menggunakan <b>THRUSTER</b> dan juga dot berwarna <b>KUNING</b> dengan
      mengarahkan ke target menggunakan <b>PEDAL</b>
    </p>
    <p
      v-else-if="
        !isActualTest &&
        isPointRed &&
        (currentTraining == 'joystick' || currentTraining == 'all')
      "
    >
      ⚠️ Perhatian! ⚠️<br />Upayakan titik potong berwarna <b>HIJAU</b> dengan
      mengarahkan titik ke dalam target lingkaran menggunakan <b>JOYSTICK</b>
    </p>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";

export default {
  name: "PMATrackingTest",
  props: {
    currentTraining: {
      type: String,
      default: "all",
      validator: (value) => ["all", "joystick", "thruster"].includes(value),
    },
  },
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
    const staticBoundaryRadius = 90; // New static boundary for dot
    let solidCircleRadius = 150;
    let referenceCircleRadius = 200;
    let expandInterval = 3000;
    let lastExpandTime = 0;
    let expanding = true;
    let dotX = centerX;
    let dotY = centerY;
    let pillAngle = 0;
    let lastPillMoveTime = 0;
    const pillMoveInterval = 2000;
    const isCircleRed = ref(false);
    const isPillRed = ref(false);
    const isPointRed = ref(false);
    const circle_correct_position = ref(0);
    const circle_wrong_position = ref(0);
    const dot_correct_position = ref(0);
    const dot_wrong_position = ref(0);
    const pill_correct_position = ref(0);
    const pill_wrong_position = ref(0);
    let targetRadius = 150;
    const smoothingFactor = 0.1;

    const shouldShowJoystickStatus = computed(
      () =>
        props.currentTraining === "joystick" || props.currentTraining === "all"
    );

    const shouldShowThrusterStatus = computed(
      () =>
        props.currentTraining === "thruster" || props.currentTraining === "all"
    );

    const getCurrentModeStatus = computed(() => {
      if (props.currentTraining === "joystick") return "Joystick Disconnected";
      if (props.currentTraining === "thruster") return "Thruster Disconnected";
      return "Devices Disconnected";
    });

    const drawCrosshair = () => {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.moveTo(centerX - 400, centerY);
      ctx.lineTo(centerX + 400, centerY);
      ctx.moveTo(centerX, centerY - 400);
      ctx.lineTo(centerX, centerY + 400);
      ctx.stroke();
    };

    const drawCircles = () => {
      // Draw static boundary circle
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "transparent";
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, staticBoundaryRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw solid circle (thruster controlled)
      ctx.beginPath();
      ctx.setLineDash([]);
      const radiusDifference = Math.abs(
        solidCircleRadius - referenceCircleRadius
      );
      ctx.strokeStyle = radiusDifference <= 20 ? "blue" : "red";
      isCircleRed.value = radiusDifference > 20;

      ctx.arc(centerX, centerY, solidCircleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw reference circle
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "lightgray";
      ctx.arc(centerX, centerY, referenceCircleRadius, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawDot = () => {
      const distanceFromCenter = Math.sqrt(
        Math.pow(dotX - centerX, 2) + Math.pow(dotY - centerY, 2)
      );
      ctx.beginPath();
      ctx.fillStyle =
        distanceFromCenter <= staticBoundaryRadius ? "green" : "red";
      isPointRed.value = distanceFromCenter > solidCircleRadius; // Changed to use staticBoundaryRadius
      ctx.arc(dotX, dotY, 10, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawPill = () => {
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

      ctx.moveTo(-pillWidth / 2 + radius, -pillHeight / 2);
      ctx.lineTo(pillWidth / 2 - radius, -pillHeight / 2);
      ctx.arc(pillWidth / 2 - radius, 0, radius, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-pillWidth / 2 + radius, pillHeight / 2);
      ctx.arc(-pillWidth / 2 + radius, 0, radius, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();

      ctx.fill();
      ctx.restore();
    };

    const getPillColor = () => {
      const absAngle = Math.abs(pillAngle % (Math.PI * 2));
      return absAngle <= Math.PI / 4 ||
        absAngle >= (Math.PI * 7) / 4 ||
        (absAngle > Math.PI / 4 && absAngle < (Math.PI * 3) / 4)
        ? "red"
        : "yellow";
    };

    const drawTrackingTest = () => {
      ctx.clearRect(0, 0, 500, 500);
      drawCrosshair();
      drawCircles();

      if (shouldShowThrusterStatus.value) {
        drawPill();
      }

      if (shouldShowJoystickStatus.value) {
        drawDot();
      }
    };

    const updateDotPosition = () => {
      if (joystick) {
        const joystickState = navigator.getGamepads()[joystick.index];
        if (joystickState) {
          const axes = joystickState.axes;
          dotX += axes[0] * 2;
          dotY += axes[1] * 2;
          const angle = Math.atan2(dotY - centerY, dotX - centerX);
          dotX += Math.cos(angle) * 0.5;
          dotY += Math.sin(angle) * 0.5;
          dotX = Math.max(0, Math.min(500, dotX));
          dotY = Math.max(0, Math.min(500, dotY));
        }
      }
    };

    // Rest of the code remains the same...
    // Include all the remaining methods (updateCircleAndPill, updateScores, etc.)

    const updateCircleAndPill = (timestamp) => {
      if (timestamp - lastExpandTime > expandInterval) {
        expanding = Math.random() < 0.5;
        lastExpandTime = timestamp;
        expandInterval = 2000 + Math.random() * 2000;
      }

      if (expanding) {
        referenceCircleRadius = Math.min(referenceCircleRadius + 0.35, 220);
      } else {
        referenceCircleRadius = Math.max(referenceCircleRadius - 0.35, 100);
      }

      if (timestamp - lastPillMoveTime > pillMoveInterval) {
        pillAngle += ((Math.random() < 0.5 ? 1 : -1) * Math.PI) / 36;
        lastPillMoveTime = timestamp;
      }

      if (thruster) {
        const thrusterState = navigator.getGamepads()[thruster.index];
        if (thrusterState) {
          const pedalValue = thrusterState.axes[5];
          pillAngle += pedalValue * 0.05;
          pillAngle = Math.atan2(Math.sin(pillAngle), Math.cos(pillAngle));

          const axisValue = thrusterState.axes[2];
          targetRadius = ((axisValue + 1) / 2) * (250 - 50) + 50;
        }
      }

      pillAngle = (pillAngle + Math.PI * 2) % (Math.PI * 2);

      const diff = targetRadius - solidCircleRadius;
      solidCircleRadius += diff * smoothingFactor;
      solidCircleRadius = Math.max(50, Math.min(250, solidCircleRadius));
    };

    const updateScores = (deltaTime) => {
      if (shouldShowThrusterStatus.value) {
        const radiusDifference = Math.abs(
          solidCircleRadius - referenceCircleRadius
        );
        if (radiusDifference <= 20) {
          circle_correct_position.value += deltaTime;
        } else {
          circle_wrong_position.value += deltaTime;
        }

        const pillColor = getPillColor();
        isPillRed.value = pillColor === "red";
        if (pillColor === "yellow") {
          pill_correct_position.value += deltaTime;
        } else {
          pill_wrong_position.value += deltaTime;
        }
      }

      if (shouldShowJoystickStatus.value) {
        const distanceFromCenter = Math.sqrt(
          Math.pow(dotX - centerX, 2) + Math.pow(dotY - centerY, 2)
        );
        if (distanceFromCenter <= staticBoundaryRadius) {
          dot_correct_position.value += deltaTime;
        } else {
          dot_wrong_position.value += deltaTime;
        }
      }
    };
    const checkGamepadConnection = () => {
      const gamepads = navigator.getGamepads();
      for (let gamepad of gamepads) {
        if (gamepad) {
          if (gamepad.id === "T.16000M (Vendor: 044f Product: b10a)") {
            joystick = gamepad;
            joystickConnected.value = true;
          } else if (
            gamepad.id === "TWCS Throttle (Vendor: 044f Product: b687)"
          ) {
            thruster = gamepad;
            thrusterConnected.value = true;
          }
        }
      }
    };

    let lastTimestamp = 0;
    const gameLoop = (timestamp) => {
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      checkGamepadConnection();

      if (typeof deltaTime === "number" && !isNaN(deltaTime)) {
        if (shouldShowThrusterStatus.value) {
          updateCircleAndPill(timestamp);
        }

        if (shouldShowJoystickStatus.value) {
          updateDotPosition();
        }

        updateScores(deltaTime);
      }

      drawTrackingTest();
      animationId = requestAnimationFrame(gameLoop);
    };

    const handleGamepadConnected = (e) => {
      if (e.gamepad.id === "T.16000M (Vendor: 044f Product: b10a)") {
        joystick = e.gamepad;
        joystickConnected.value = true;
      } else if (
        e.gamepad.id === "TWCS Throttle (Vendor: 044f Product: b687)"
      ) {
        thruster = e.gamepad;
        thrusterConnected.value = true;
      }
    };

    const handleGamepadDisconnected = (e) => {
      if (joystick && joystick.index === e.gamepad.index) {
        joystick = null;
        joystickConnected.value = false;
      } else if (thruster && thruster.index === e.gamepad.index) {
        thruster = null;
        thrusterConnected.value = false;
      }
    };

    const emitScoreUpdate = () => {
      emit("update-score", {
        circle_correct_position: circle_correct_position.value,
        circle_wrong_position: circle_wrong_position.value,
        dot_correct_position: dot_correct_position.value,
        dot_wrong_position: dot_wrong_position.value,
        pill_correct_position: pill_correct_position.value,
        pill_wrong_position: pill_wrong_position.value,
      });
    };

    watch(
      [
        circle_correct_position,
        circle_wrong_position,
        dot_correct_position,
        dot_wrong_position,
        pill_correct_position,
        pill_wrong_position,
      ],
      emitScoreUpdate
    );

    onMounted(() => {
      ctx = canvas.value.getContext("2d");
      gameLoop();
      window.addEventListener("gamepadconnected", handleGamepadConnected);
      window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
      checkGamepadConnection();
      drawCircles();
      drawDot();
    });

    onUnmounted(() => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
      window.removeEventListener(
        "gamepaddisconnected",
        handleGamepadDisconnected
      );
    });

    return {
      canvas,
      joystickConnected,
      thrusterConnected,
      shouldShowJoystickStatus,
      shouldShowThrusterStatus,
      getCurrentModeStatus,
      isCircleRed,
      isPillRed,
      isPointRed,
    };
  },
};
</script>

<style scoped>
.canvas-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.joystick-status {
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
  margin-top: 10px;
}

.connected {
  background-color: #4caf50;
  color: white;
}

.disconnected {
  background-color: #f44336;
  color: white;
}
</style>
