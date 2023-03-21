const fetch = require("node-fetch").default;
const Store = require("electron-store");
const store = new Store();

const Prices = class Prices {
  constructor() {
    this.prices;
    this.currency = store.get("currency") || "USD";
    this.currencyFactor;
    this.history;
    this.historyPrice;
    this.cachedHistory;
    fetch("https://tradeups.tradeuphero.com/allprices")
      .then((data) => data.json())
      .then((data) => {
        console.log(data);
        this.prices = data;
      });
    fetch(`https://misc.tradeuphero.com/currency/${this.currency}`)
      .then((data) => data.text())
      .then((data) => {
        this.currencyFactor = data;
        console.log("currencydata", data);
      });
  }

  getItemPrice(name, pricing = "customMedian") {
    if (this.prices[name] == undefined) return null;
    //if (this.prices[name].price == undefined)
    return Math.round(this.prices[name][pricing] * this.currencyFactor) / 100;
    //return this.prices[name].price[pricing];
  }

  getHistoryPrice(name) {
    if (this.historyPrice[name] == undefined) return null;
    return this.historyPrice[name];
  }

  getPriceHistory(name) {
    console.log(this.history, name);
    if (this.history[name] == undefined) return null;
    return this.history[name];
  }

  getCachedHistory() {
    return this.cachedHistory;
  }

  setNames(names) {
    return new Promise((resolve, reject) => {
      fetch(`https://tradeups.tradeuphero.com/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ names }),
        redirect: "follow",
      })
        .then((data) => data.json())
        .then((received) => {
          if (received.success) {
            this.items = received.items;
            let dict = {};
            let historyDict = {};
            this.cachedHistory = received.items;
            received.items.forEach((history) => {
              let jsonHistory = history.priceHistory;
              let latest;
              try {
                latest = jsonHistory[jsonHistory.length - 1][1];
              }catch(err){
                console.log("failed!", latest, history.priceHistory, history.name);
              }
              
              dict[history.name] =
                Math.round(latest * this.currencyFactor * 100) / 100;
              let currencyHistory = jsonHistory.map((cur) => {
                cur[1] = Math.round(cur[1] * this.currencyFactor * 100) / 100;
                return cur;
              });
              historyDict[history.name] = currencyHistory;
            });
            this.historyPrice = dict;
            this.history = historyDict;
            resolve();
          } else reject();
        });
    });
  }
};

exports.Prices = Prices;
