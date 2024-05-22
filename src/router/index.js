import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import HomePage from '@/components/HomePage.vue';
import RadarPage from '@/components/RadarVigillance.vue';

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
    path: '/battery-test-1',
    name: 'Radar Vigilance Test',
    component: RadarPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
