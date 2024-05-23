import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import HomePage from '@/components/HomePage.vue';
import RadarVigillancePage from '@/components/RadarVigillance.vue';
import CallSignMultitask from '@/components/CallSignMultitask.vue';
import InstrumentMultitask from '@/components/InstrumentMultitask.vue';
import PFDTracking from '@/components/PFDTracking.vue';
import SpatialOrientation from '@/components/SpatialOrientation.vue';
import TestCategoryPage from '@/components/RadarVigilanceMenu.vue';
import CallSignMultitaskMenu from '@/components/CallSignMultitaskMenu.vue';
import InstrumentMultitaskingMenu from '@/components/InstrumentMultitaskingMenu.vue';
import ProfilePage from '@/components/ProfilePage.vue';
import PFDTrackingMenu from '@/components/PFDTrackingMenu.vue';
import SpatialOrientationMenu from '@/components/SpatialOrientationMenu.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage
  },
  {
    path: '/battery-test-1',
    name: 'Radar Vigilance Test',
    component: RadarVigillancePage
  },
  {
    path: '/battery-test-2',
    name: 'Call Sign Multitask Test',
    component: CallSignMultitask
  },
  {
    path: '/battery-test-3',
    name: 'Instrument Multitasking Test',
    component: InstrumentMultitask
  },
  {
    path: '/battery-test-4',
    name: 'PFD Tracking Test',
    component: PFDTracking,
  },
  {
    path: '/battery-test-5',
    name: 'Spatial Orientation Test',
    component: SpatialOrientation
  },
  {
    path: '/radar-vigilance',
    name: 'Radar Vigilance Menu',
    component: TestCategoryPage
  },
  {
    path: '/multitasking-callsign',
    name: 'Callsign Multitask Menu',
    component: CallSignMultitaskMenu
  },
  {
    path: '/multitasking-instrument',
    name: 'Instrument Multitasking Menu',
    component: InstrumentMultitaskingMenu
  },
  {
    path: '/pfdtracking-menu',
    name: 'PFD Tracking Menu',
    component: PFDTrackingMenu
  },
  {
    path: '/spatial-orientation-menu',
    name: 'Spatial Orientation Menu',
    component: SpatialOrientationMenu
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
