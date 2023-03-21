const { contextBridge, ipcRenderer } = require("electron");

const Store = require("electron-store");
const store = new Store();
const { shell } = require("electron");

const apexChart = require("apexcharts");

const SteamUser = require("steam-user");
const GlobalOffensive = require("globaloffensive");

var items = require("./case_move.js");

const { Loader } = require("./container-interfaces.js");
//const { RichInventory } = require("./rich-inventory.js");
const { Prices } = require("./prices.js");
let prices = new Prices();
let user = new SteamUser();
let userLoggedIn = false;
let loader;

let csgo;
let csgoLoaded = false;
let dispatch;
let mutate;
let testItems = new items();

function init(_dispatch, _mutate) {
  dispatch = _dispatch;
  mutate = _mutate;

  if (store.get("login_key") && store.get("username")) {
    let loginKey = store.get("login_key");
    let username = store.get("username");
    login({ accountName: username, loginKey });
  } else {
    triggerEvent("login-failed", "");
  }
}

function openLink(link) {
  shell.openExternal(link);
}

function login(data) {
  user.logOn(data);
}

function logout() {
  user.logOff();
  csgo = undefined;
  //richInventory = undefined;
}

let currentlyLoading = false;

function loadItems(items, loading) {
  console.log("Loading items...", items);
  triggerEvent("loading-started");
  currentlyLoading = true;
  let movingItems = items.filter((item) => {
    return item.inContainer !== loading;
  });
  console.log("movingItems", movingItems);
  loader
    .move(movingItems, (moved) => {
      triggerEvent("item-loaded", items.length - moved, items, moved);
      console.log("---item-loaded---", items, moved);
    })
    .then(() => {
      console.log("---loading-finished---");
      triggerEvent("loading-finished");
      currentlyLoading = false;
    });
  return movingItems.length;
}

function reloadInventory() {
  triggerEvent("inventory-reload");
}

let cbs = {};

function registerHandler(event, cb) {
  if (cbs[event]) {
    cbs[event].push(cb);
  } else {
    cbs[event] = [cb];
  }
}

let autoPacking = false;
let autopacked = 0;

function toggleAutoPacking(packing) {
  autoPacking = packing;
  autopacked = 0;
}

contextBridge.exposeInMainWorld("api", {
  login,
  logout,
  init,
  loadItems,
  reloadInventory,
  openLink,
  getInventory,
  toggleAutoPacking,
  apexChart,
  getPrice: prices.getItemPrice,
  getPriceHistory: (name) => {
    return prices.getPriceHistory(name);
  },
  getCachedHistory: () => {
    return prices.getCachedHistory();
  },
  onInventoryReload: (callback) =>
    registerHandler("inventory-reload", callback),
  onInventoryLoadUpdate: (callback) =>
    registerHandler("inventory-load-update", callback),
  loginFailed: (callback) => registerHandler("login-failed", callback),
  onSetWallet: (callback) => registerHandler("set-wallet", callback),
  onItemLoaded: (callback) => registerHandler("item-loaded", callback),
  onLoadingStart: (callback) => registerHandler("loading-started", callback),
  onItemAdded: (callback) => registerHandler("item-added", callback),
  onAutoPacked: (callback) => registerHandler("autopacked", callback),
  onLoadingFinished: (callback) =>
    registerHandler("loading-finished", callback),
  steamguardNeeded: (callback) =>
    registerHandler("steamguard-needed", callback),
});

function triggerEvent(event, val) {
  console.log("triggering Event", event, val);
  if (cbs[event] !== undefined)
    cbs[event].forEach((cb) => {
      cb(val);
    });
}

user.on("steamGuard", function (domain, callback) {
  triggerEvent("steamguard-needed", { domain, callback });
});

user.on("error", (err) => {
  console.log("login failed!", err);
  triggerEvent("login-failed", store.get("username"));
});

user.on("wallet", (hasWallet, currency, balance) => {
  triggerEvent("set-wallet", {
    balance,
    currency: SteamUser.ECurrencyCode[currency],
  });
  store.set("currency", SteamUser.ECurrencyCode[currency]);
});

user.on("loggedOn", async () => {
  if (userLoggedIn) return;
  userLoggedIn = true;
  console.log(user);
  //richInventory = new RichInventory(user);
  console.log("account name:", user._logOnDetails);
  store.set("username", user._logOnDetails.account_name);
  console.log("starting csgo...");
  csgo = new GlobalOffensive(user);
  console.log(csgo);
  csgo.on("connectedToGC", () => {
    if (!csgoLoaded) {
      csgoLoaded = true;
      loader = new Loader(csgo, getAllContainers());
      dispatch("logIn");
      mutate("setGcConnected", true);
    }
  });
  csgo.on("disconnectedFromGC", () => {
    console.log("[CS:GO GC] Disconnected!");
  });
  csgo.on("itemAcquired", (item) => {
    if (autoPacking) {
      autopacked++;
      loader.move([{ inContainer: false, id: item.id }]);
      triggerEvent("autopacked", autopacked);
    }
  });
  user.gamesPlayed([730]);
});

user.on("loginKey", (key) => {
  console.log(key);
  store.set("login_key", key);
});

let cachedInventory = false;

async function getInventory() {
  if (cachedInventory) return cachedInventory;
  console.time("getInventory");
  triggerEvent("inventory-load-update", "Loading main inventory");
  let inventory = csgo.inventory;
  console.log("set Inventory");
  console.timeLog("getInventory");
  triggerEvent(
    "inventory-load-update",
    "Getting all items in storage containers"
  );
  let casketItems = await getAllItemsInContainers();
  console.log("gotCasket Items");
  console.timeLog("getInventory");
  triggerEvent("inventory-load-update", "Formating items");
  let formatedItems = testItems.inventoryConverter(inventory, false); //formatInventory(inventory, false);
  let formatedCasketItems = testItems.inventoryConverter(casketItems, true); //formatInventory(casketItems, true);
  console.log("formated Items");
  console.timeLog("getInventory");
  let combined = formatedItems.concat(formatedCasketItems);
  console.log("concated Items");
  console.timeLog("getInventory");
  triggerEvent("inventory-load-update", "Loading price History");
  await getItemHistory(combined);
  console.log("history loaded");
  let formated = formatInventory(combined);
  console.timeEnd("getInventory");
  return formated;
  //triggerEvent("inventory-load", formated);
}

async function getItemHistory(inventory) {
  let names = inventory.reduce((prev, cur) => {
    if (prev.includes(cur.market_hash_name)) return prev;
    prev.push(cur.market_hash_name);
    return prev;
  }, []);
  await prices.setNames(names);
}

async function formatInventory(inventory) {
  let seen = [];
  let newInv = [];
  for (let i = 0; i < inventory.length; i++) {
    let item = inventory[i];
    if (!seen.includes(item.market_hash_name)) {
      let items = inventory.filter((current) => {
        return current.market_hash_name === item.market_hash_name;
      });
      let itemsShort = items.map((current) => {
        return {
          id: current.item_id,
          inContainer: current.in_container,
          containerID: current.container_id,
        };
      });
      newInv.push({
        uniques: itemsShort,
        name: item.market_hash_name,
        movable: item.item_moveable,
        image: item.item_url,
        price: prices.getHistoryPrice(item.market_hash_name),
      });
      seen.push(item.market_hash_name);
    }
  }
  console.log(newInv);
  newInv.sort((a, b) => {
    return b.uniques.length * b.price - a.uniques.length * a.price;
  });
  return newInv;
}

function getAllItemsInContainers() {
  return new Promise((resolve, reject) => {
    let allItems = [];
    let containers = getAllContainers();
    console.log("containers!", containers);
    let promises = [];
    containers.forEach((container) => {
      promises.push(getContainerItems(container.id));
    });
    Promise.all(promises).then((results) => {
      results.forEach((items) => {
        allItems = allItems.concat(items);
      });
      resolve(allItems);
    });
  });
}

function getContainerItems(container) {
  return new Promise((resolve, reject) => {
    csgo.getCasketContents(container, (err, items) => {
      if (err) {
        //todo: handle err
        console.log("Something went wrong");
        console.log(err);
        reject();
      } else {
        resolve(items);
      }
    });
  });
}

function getAllContainers() {
  let inventory = csgo.inventory;
  let containers = [];
  inventory.forEach((item) => {
    if (item.def_index == 1201) containers.push(item);
  });
  return containers;
}
