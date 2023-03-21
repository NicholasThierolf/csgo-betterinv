import Vue from "vue";
import Vuex from "vuex";
import router from "../router/index.js";

Vue.use(Vuex);

const LoginState = {
  waiting: 0,
  notLoggedIn: 1,
  loggedIn: 2,
  tryingLogin: 3,
  steamguardNeeded: 4,
  steamguardWaiting: 5,
};

const defaultState = {
  loginState: LoginState.waiting,
  gcConnected: false,
  inventory: [],
  balance: 0,
  currency: null,
};

export default new Vuex.Store({
  state: JSON.parse(JSON.stringify(defaultState)),
  mutations: {
    logOut(state) {
      router.push("/");
      state.loginState = LoginState.notLoggedIn;
      state.gcConnected = false;
      state.inventory = {};
    },
    logIn(state) {
      state.loginState = LoginState.loggedIn;
    },
    relogImpossible(state) {
      state.loginState = LoginState.notLoggedIn;
    },
    tryingToLogIn(state) {
      state.loginState = LoginState.tryingLogin;
    },
    steamguardNeeded(state) {
      state.loginState = LoginState.steamguardNeeded;
    },
    steamguardWaiting(state) {
      state.loginState = LoginState.steamguardWaiting;
    },
    setGcConnected(state, connected) {
      state.gcConnected = connected;
    },
    setInventory(state, inventory) {
      state.inventory = inventory;
    },
    setBalance(state, { balance, currency }) {
      state.balance = balance;
      state.currency = currency;
    },
  },
  actions: {
    logIn({ commit }) {
      router.push("/inventory");
      commit("logIn");
    },
  },
  getters: {
    inventoryValue(state) {
      return state.inventory.reduce((prev, cur) => {
        return prev + cur.uniques.length * cur.price;
      }, 0);
    },
    packedItems(state) {
      return state.inventory.reduce((acc, cur) => {
        return (
          acc +
          cur.uniques.reduce((acc, cur) => {
            return acc + (cur.inContainer ? 1 : 0);
          }, 0)
        );
      }, 0);
    },
    unpackedItems(state) {
      return state.inventory.reduce((acc, cur) => {
        return (
          acc +
          cur.uniques.reduce((acc, cur) => {
            return acc + (cur.inContainer ? 0 : 1);
          }, 0)
        );
      }, 0);
    },
    allUnpackedItems(state) {
      //gets all movable items that are currently not in a container
      return state.inventory.reduce((prev, cur) => {
        if (cur.movable) {
          return prev.concat(
            cur.uniques.filter((item) => {
              return !item.inContainer;
            })
          );
        }
        return prev;
      }, []);
    },
  },
  modules: {},
});
