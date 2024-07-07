import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import RadarVigillancePage from '@/components/RadarVigillance.vue';
import VisualMemoryTest from '@/components/VisualMemoryTest.vue';
import CallSignMultitask from '@/components/CallSignMultitask.vue';
import InstrumentMultitask from '@/components/InstrumentMultitask.vue';
import PFDTracking from '@/components/PFDTracking.vue';
import SpatialOrientation from '@/components/SpatialOrientation.vue';
import NewRotatingMaze from '@/components/NewRotatingMaze/Parent.vue';
import OperativeMultitasking from '@/components/OperativeMultitasking.vue';
import MultidimensionalCoordination from '@/components/MultidimensionalCoordination.vue';
import ShapeRecognition from '@/components/ShapeRecognition.vue';
import TimeSharing from '@/components/TimeSharing.vue';
import TestModule from '@/components/TestModule.vue';
import ProfilePage from '@/components/ProfilePage.vue';
import ColorMultitask from '@/components/ColorMultitask.vue';
import ConfigPage from '@/components/ConfigPage.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/config',
    name: 'Config',
    component: ConfigPage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage
  },
  {
    path: '/visual-memory-test',
    name: 'Visual Memory Test',
    component: VisualMemoryTest
  },
  {
    path: '/radar-vigilance-test',
    name: 'Radar Vigilance Test',
    component: RadarVigillancePage
  },
  {
    path: '/call-sign-multitask-test',
    name: 'Call Sign Multitask Test',
    component: CallSignMultitask
  },
  {
    path: '/color-multitask-test',
    name: 'Color Multitask Test',
    component: ColorMultitask
  },
  {
    path: '/instrument-multitask-test',
    name: 'Instrument Multitasking Test',
    component: InstrumentMultitask
  },
  {
    path: '/pfd-tracking-test',
    name: 'PFD Tracking Test',
    component: PFDTracking,
  },
  {
    path: '/spatial-orientation-test',
    name: 'Spatial Orientation Test',
    component: SpatialOrientation
  },
  {
    path: '/rotating-maze-test',
    name: 'Rotating Maze',
    component: NewRotatingMaze
  },
  {
    path: '/operative-multitasking-test',
    name: 'Operative Multitasking Test',
    component: OperativeMultitasking
  },
  {
    path: '/multidimensional-coordination-test',
    name: 'Multidimensional Coordination Test',
    component: MultidimensionalCoordination
  },
  {
    path: '/module',
    name: 'Test Module',
    component: TestModule
  },
  {
    path: '/time-sharing-test',
    name: 'Time Sharing Test',
    component: TimeSharing
  },
  {
    path: '/shape-recognition-test',
    name: 'Shape Recognition Test',
    component: ShapeRecognition
  },

];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
