import Vue from "vue";
import VueRouter from "vue-router";
import Login from "../views/Login.vue";
import Inventory from "../views/Inventory.vue";
import Investments from "../views/Investments.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Login",
    component: Login,
  },
  {
    path: "/inventory",
    name: "Inventory",
    component: Inventory,
  },
  {
    path: "/investments",
    name: "Investments",
    component: Investments,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
