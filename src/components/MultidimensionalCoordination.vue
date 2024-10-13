<template>
  <div ref="container" class="coordination-test">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

export default {
  name: 'PilotCoordinationTest',
  setup() {
    const container = ref(null);
    const canvas = ref(null);
    let scene, camera, renderer, box, airplaneGroup, marker;
    const perspectiveOffset = ref(0);
    let originalVertices;
    const BACKWARD_SPEED = 0.05;
    const MAX_BACKWARD_POSITION = 5.5;
    const MIN_FORWARD_POSITION = -4.5;

    const initScene = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true });
      renderer.setSize(container.value.clientWidth, container.value.clientHeight);

      // Box creation code remains the same...

      // Create improved marker
      const geometry = new THREE.BufferGeometry();
      originalVertices = new Float32Array([
        -5, -5, -5, 5, -5, -5, 5, 5, -5, -5, 5, -5, // back
        -5, -5, 5, 5, -5, 5, 5, 5, 5, -5, 5, 5, // sides and top
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(originalVertices.slice(), 3));
      const indices = [
        0, 1, 2, 0, 2, 3,  // back
        1, 5, 6, 1, 6, 2,  // right
        4, 0, 3, 4, 3, 7,  // left
        3, 2, 6, 3, 6, 7,  // top
        4, 5, 1, 4, 1, 0   // bottom
      ];
      geometry.setIndex(indices);

      const colors = new Float32Array(originalVertices.length);
      for (let i = 0; i < colors.length; i += 3) {
        const z = originalVertices[i + 2];
        const t = 1 - (z + 5) / 10; // Normalize z from [-5, 5] to [1, 0]
        colors[i] = 0.529 + 0.471 * t; // R: from white to sky blue
        colors[i + 1] = 0.808 + 0.192 * t; // G: from white to sky blue
        colors[i + 2] = 0.922 + 0.078 * t; // B: from white to sky blue
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: false });
      box = new THREE.Mesh(geometry, material);
      scene.add(box);

      const markerShape = new THREE.Shape();
      markerShape.moveTo(0, 0);
      markerShape.lineTo(0.5, -1);
      markerShape.lineTo(1, 0);
      markerShape.lineTo(0.5, 0.5);
      markerShape.lineTo(0, 0);

      const markerGeometry = new THREE.ShapeGeometry(markerShape);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
      marker = new THREE.Mesh(markerGeometry, markerMaterial);

      const markerOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(markerGeometry),
        new THREE.LineBasicMaterial({ color: 0x000000 })
      );

      const markerGroup = new THREE.Group();
      markerGroup.add(marker);
      markerGroup.add(markerOutline);
      markerGroup.position.set(0, -4.5, 0);
      markerGroup.scale.set(0.5, 0.5, 0.5);
      scene.add(markerGroup);

      // Create a group to hold all airplane parts
      airplaneGroup = new THREE.Group();

      // Plane body (cylinder)
      const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.z = Math.PI / 2;
      airplaneGroup.add(body);

      // Plane wings (boxes)
      const wingGeometry = new THREE.BoxGeometry(3, 0.1, 0.5);
      const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
      const wings = new THREE.Mesh(wingGeometry, wingMaterial);
      airplaneGroup.add(wings);

      // Plane tail (cone)
      const tailGeometry = new THREE.ConeGeometry(0.5, 1, 32);
      const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const tail = new THREE.Mesh(tailGeometry, tailMaterial);
      tail.position.set(-1.5, 0, 0);
      tail.rotation.z = -Math.PI / 2;
      airplaneGroup.add(tail);

      // Red nose cone
      const noseGeometry = new THREE.ConeGeometry(0.5, 1, 4);
      const noseMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
      const nose = new THREE.Mesh(noseGeometry, noseMaterial);
      nose.rotation.z = Math.PI / 2;
      nose.position.set(1.5, 0, 0);
      airplaneGroup.add(nose);

      airplaneGroup.position.set(0, 0, 0);
      scene.add(airplaneGroup);

      camera.position.z = 15;
    };

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update perspective
      perspectiveOffset.value = Math.sin(Date.now() * 0.001) * 2;
      const positions = box.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        if (originalVertices[i + 2] > 0) {
          positions[i] = originalVertices[i] + perspectiveOffset.value;
        } else {
          positions[i] = originalVertices[i];
        }
      }
      box.geometry.attributes.position.needsUpdate = true;

      // Move airplane backward constantly
      if (airplaneGroup.position.z < MAX_BACKWARD_POSITION) {
        airplaneGroup.position.z += BACKWARD_SPEED;
      }

      // Scale airplane based on its Z position
      const scale = 0.1 - (-airplaneGroup.position.z + 4.5) / 10; // 1 at z=-4.5, 0.5 at z=5.5
      airplaneGroup.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    const handleKeyDown = (e) => {
      const speed = 0.1;
      switch (e.key) {
        case 'ArrowUp': airplaneGroup.position.y = Math.min(4.5, airplaneGroup.position.y + speed); break;
        case 'ArrowDown': airplaneGroup.position.y = Math.max(-4.5, airplaneGroup.position.y - speed); break;
        case 'ArrowLeft': airplaneGroup.position.x = Math.max(-4.5, airplaneGroup.position.x - speed); break;
        case 'ArrowRight': airplaneGroup.position.x = Math.min(4.5, airplaneGroup.position.x + speed); break;
        case 'w': airplaneGroup.position.z = Math.max(MIN_FORWARD_POSITION, airplaneGroup.position.z - speed); break;
        case 's': airplaneGroup.position.z = Math.min(MAX_BACKWARD_POSITION, airplaneGroup.position.z + speed); break;
        case 'q': airplaneGroup.rotation.z += 0.1; break;
        case 'e': airplaneGroup.rotation.z -= 0.1; break;
      }
    };

    onMounted(() => {
      initScene();
      animate();
      window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });

    return {
      container,
      canvas,
    };
  }
}
</script>

<style scoped>
.coordination-test {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>