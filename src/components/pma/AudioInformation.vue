<template>
    <div class="audio-information">
      <div v-if="showStrings" class="string-display">
        <div>{{ firstSet.join(' ') }}</div>
        <div>{{ secondSet.join(' ') }}</div>
      </div>
      <div v-else class="listening">
        Mendengarkan... Tarik pemicu jika Anda mendengar set yang cocok.
      </div>
      <div v-if="showResult" class="result">
        {{ correct ? "Benar!" : "Salah" }}
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted } from 'vue';
  
  export default {
    name: 'AudioInformation',
    emits: ['update-score'],
    setup(props, { emit }) {
      const showStrings = ref(true);
      const showResult = ref(false);
      const firstSet = ref([]);
      const secondSet = ref([]);
      const correct = ref(false);
      const score = ref(0);
      const displayDuration = ref(5000); // 5 seconds to display strings
      let joystick = null;
      let speechSynthesis = window.speechSynthesis;
      let triggerPressed = false;
  
      const generateSet = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array(4).fill().map(() => chars[Math.floor(Math.random() * chars.length)]);
      };
  
      const speakSet = (set) => {
        const utterance = new SpeechSynthesisUtterance(set.join(' '));
        utterance.lang = 'id-ID'; // Indonesian language
        utterance.rate = 0.8; // Slow down the speech rate a bit
        speechSynthesis.speak(utterance);
      };
  
      const startTest = () => {
        firstSet.value = generateSet();
        secondSet.value = generateSet();
        showStrings.value = true;
        triggerPressed = false;
  
        setTimeout(() => {
          showStrings.value = false;
          playAudioSequence();
        }, displayDuration.value);
      };
  
      const playAudioSequence = () => {
        const allSets = [firstSet.value, secondSet.value];
        const matchingSetIndex = Math.floor(Math.random() * 2);
        const matchingSet = allSets[matchingSetIndex];
        
        let currentIndex = 0;
        const intervalId = setInterval(() => {
          if (currentIndex < 4) {
            const currentSet = Math.random() < 0.5 ? matchingSet : generateSet();
            speakSet(currentSet);
            
            setTimeout(() => {
              if (currentSet === matchingSet && triggerPressed) {
                correct.value = true;
                score.value++;
                clearInterval(intervalId);
                showResult.value = true;
                emit('update-score', score.value);
                setTimeout(startTest, 2000);
              }
            }, 1900); // Check just before the next set is spoken
            
            currentIndex++;
          } else {
            clearInterval(intervalId);
            correct.value = false;
            showResult.value = true;
            setTimeout(startTest, 2000);
          }
        }, 2000);
      };
  
      const checkJoystickTrigger = () => {
        if (joystick) {
          const gamepadState = navigator.getGamepads()[joystick.index];
          if (gamepadState && gamepadState.buttons[0].pressed) {
            triggerPressed = true;
          }
        }
      };
  
      onMounted(() => {
        window.addEventListener("gamepadconnected", (e) => {
          if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
            joystick = e.gamepad;
          }
        });
        
        const triggerCheckInterval = setInterval(checkJoystickTrigger, 50); // Check trigger every 50ms
  
        startTest();
  
        return () => {
          clearInterval(triggerCheckInterval);
        };
      });
  
      onUnmounted(() => {
        speechSynthesis.cancel(); // Stop any ongoing speech
      });
  
      return {
        showStrings,
        showResult,
        firstSet,
        secondSet,
        correct,
        displayDuration
      };
    }
  };
  </script>
  
  <style scoped>
  .audio-information {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
  }
  
  .string-display {
    font-size: 2em;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .listening {
    font-size: 1.5em;
    margin-top: 20px;
  }
  
  .result {
    font-size: 1.5em;
    margin-top: 20px;
  }
  </style>