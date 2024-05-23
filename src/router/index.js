import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import HomePage from '@/components/HomePage.vue';
import RadarVigillancePage from '@/components/RadarVigillance.vue';
import CallSignMultitask from '@/components/CallSignMultitask.vue';
import ProfilePage from '@/components/ProfilePage.vue';

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
  // {
  //   path: '/battery-test-3',
  //   name: 'Radar Vigilance Test',
  //   component: RadarPage
  // },
  // {
  //   path: '/battery-test-4',
  //   name: 'Radar Vigilance Test',
  //   component: RadarPage
  // },
  // {
  //   path: '/battery-test-5',
  //   name: 'Radar Vigilance Test',
  //   component: RadarPage
  // },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
