import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import RadarVigillancePage from '@/components/RadarVigillance.vue';
import CallSignMultitask from '@/components/CallSignMultitask.vue';
import InstrumentMultitask from '@/components/InstrumentMultitask.vue';
import PFDTracking from '@/components/PFDTracking.vue';
import SpatialOrientation from '@/components/SpatialOrientation.vue';
import RotatingMaze from '@/components/RotatingMaze.vue';
import OperativeMultitasking from '@/components/OperativeMultitasking.vue';
import TestModule from '@/components/TestModule.vue';
import ProfilePage from '@/components/ProfilePage.vue';
import ColorMultitask from '@/components/ColorMultitask.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage
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
    component: RotatingMaze
  },
  {
    path: '/operative-multitasking-test',
    name: 'Operative Multitasking Test',
    component: OperativeMultitasking
  },
  {
    path: '/module',
    name: 'Test Module',
    component: TestModule
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
