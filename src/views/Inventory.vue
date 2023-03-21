<template>
  <div class="inventory main-container">
    <div class="inventory-search">
      <v-text-field label="Suche" type="input" clearable v-model="searchString"></v-text-field>
    </div>
    <div v-if="!inventoryLoaded" class="loading-div">
      <p>{{ inventoryLoadingMessage }}...</p>
      <v-progress-circular indeterminate></v-progress-circular>
    </div>
    <template v-if="inventoryLoaded">
      <v-card
        v-for="item in inventory"
        :key="item.name"
        class="card"
        width="240px"
        @click="viewDetails(item)"
        v-if="searchString.length == 0 || item.name.toLowerCase().includes(searchString.toLowerCase())"
      >
        <v-card-title>{{ item.name }}</v-card-title>
        <img :src="imageLarge(item.name)" draggable="false" />
        <v-card-actions>
          <div>
            <span>
              <v-icon small color="grey"> mdi-crop-free </v-icon>
              {{ item.uniques.length - getAmountInBox(item) }}
            </span>
            <span>
              <v-icon small color="grey"> mdi-equal-box </v-icon>
              {{ getAmountInBox(item) }}
            </span>
          </div>
          <div>
            <span
              v-if="profits[item.name]"
              :style="{ color: profits[item.name] > 0 ? 'green' : 'red' }"
              >{{ formatProfit(profits[item.name]) }}</span
            >
            <span>{{ getPrice(item) }}</span>
            <span>{{ getTotal(item) }}</span>
          </div>
        </v-card-actions>
        <v-sparkline
          :value="sparks[item.name]"
          smooth="5"
          :gradient="['green', 'orange', 'red']"
        ></v-sparkline>
      </v-card>
    </template>

    <v-dialog
      v-if="detailItem"
      v-model="lightbox"
      width="600px"
      min-width="90%"
      max-height="90%"
    >
      <v-card class="detail-item">
        <h1>
          {{ detailItem.name }}
          <v-icon
            @click="
              openLink(
                `https://steamcommunity.com/market/listings/730/${detailItem.name}`
              )
            "
            color="grey"
          >
            mdi-link-variant
          </v-icon>
        </h1>
        <img :src="imageLarge(detailItem.name)" draggable="false" />
        <div class="bottom-wrapper">
          <div class="half">
            <div>
              <span class="amount">
                <v-icon color="grey"> mdi-crop-free </v-icon>
                {{ detailItem.uniques.length - getAmountInBox(detailItem) }}
              </span>
              <v-icon color="grey" @click="unloadItems">
                mdi-tray-arrow-up
              </v-icon>
            </div>
            <div>
              <span class="amount">
                <v-icon color="grey"> mdi-equal-box </v-icon>
                {{ getAmountInBox(detailItem) }}
              </span>
              <v-icon color="grey" @click="loadItems">
                mdi-tray-arrow-down
              </v-icon>
            </div>
          </div>
          <div class="half">
            <div class="price-line">{{ getPrice(detailItem) }}</div>
            <div class="price-line">{{ getTotal(detailItem) }}</div>
          </div>
        </div>
        <v-sparkline
          :value="sparks[detailItem.name]"
          smooth="5"
          :line-width="2"
          :gradient="['green', 'orange', 'red']"
        ></v-sparkline>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="loadingItems"
      persistent
      width="600px"
      min-width="90%"
      max-height="90%"
      class="loading-items"
    >
      <v-card class="loading-card">
        <h1>{{ loadingDirection == 1 ? "L" : "Unl" }}oading items...</h1>
        <v-progress-circular indeterminate></v-progress-circular>
        <v-progress-linear
          :value="((loadingTotal - loading) / loadingTotal) * 100"
          height="25"
          >{{ loadingTotal - loading }}/{{ loadingTotal }}</v-progress-linear
        >
      </v-card>
    </v-dialog>
    <v-snackbar v-model="hasUnloadedItems" bottom timeout="-1" app>
      {{ unloadedItems }} unloaded Items!
      <template slot="action">
        <v-btn color="red" @click="reloadInventory"> reload </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: "Inventory",
  data() {
    return {
      inventory: [],
      inventoryLoaded: false,
      inventoryLoadingMessage: "",
      detailItem: false,
      lightbox: false,
      loading: 0,
      loadingTotal: 0,
      loadingItems: false,
      loadingDirection: -1,
      unloadedItems: 0,
      hasUnloadedItems: false,
      sparks: {},
      profits: {},
      searchString: "",
    };
  },
  methods: {
    typedSomething(event){
      console.log("something was typed");
    },
    openLink(link) {
      window.api.openLink(link);
    }, //https://raw.githubusercontent.com/SteamDatabase/GameTracking-CSGO/master/csgo/pak01_dir/resource/flash/.png
    image(item) {
      return `https://raw.githubusercontent.com/SteamDatabase/GameTracking-CSGO/master/csgo/pak01_dir/resource/flash/${item.image}.png`;
    },
    imageLarge(name) {
      return `https://tradeups.tradeuphero.com/image/${name}/256fx256f`;
    },
    getPrice(item) {
      if (item.price) return this.formatter.format(item.price);
      //if (item.price) return "$" + item.price.toFixed(2);
      return "";
    },
    getAmountInBox(item) {
      return item.uniques.reduce((prev, cur) => {
        return prev + (cur.inContainer ? 1 : 0);
      }, 0);
    },
    getTotal(item) {
      if (item.price)
        return this.formatter.format(item.price * item.uniques.length);
      return "";
    },
    viewDetails(item) {
      this.detailItem = item;
      this.lightbox = true;
    },
    loadItems() {
      this.loading = window.api.loadItems(this.detailItem.uniques, true);
      this.loadingTotal = this.loading;
      this.loadingItems = true;
      this.loadingDirection = 1;
    },
    unloadItems() {
      this.loading = window.api.loadItems(this.detailItem.uniques, false);
      this.loadingTotal = this.loading;
      this.loadingItems = true;
      this.loadingDirection = 2;
    },
    reloadInventory() {
      this.inventoryLoaded = false;
      this.detailItem = false;
      this.getInventory();
    },
    formatProfit(profit) {
      if (profit === 0) return "+-0";
      return (profit > 0 ? "+" : "") + profit + "%";
    },
    getInventory() {
      window.api.getInventory().then((inventory) => {
        this.inventory = inventory;
        this.$store.commit("setInventory", inventory);
        this.inventoryLoaded = true;
        this.getPriceHistory();
      });
    },
    getPriceHistory() {
      const oneDay = 24 * 60 * 60 * 1000;
      let today = new Date();
      let items = window.api.getCachedHistory();
      let dates = items.reduce(
        (dict, item) => {
          let history = item.priceHistory;
          if (history.length > 0) {
            history = history.reduce((prev, cur) => {
              let date = new Date(cur[0]);
              let daysAgo = Math.round((today - date) / oneDay);
              prev[daysAgo] = cur[1];
              return prev;
            }, {});
            let dataPoints = [];
            for (let i = 30; i >= 0; i--) {
              if (dataPoints.length == 0 && history[i] == undefined) continue;
              dataPoints.push(history[i] || dataPoints[dataPoints.length - 1]);
            }
            dict.sparks[item.name] = dataPoints;
            let profit = dataPoints[dataPoints.length - 1] - dataPoints[0];

            let percentProfit = Math.round((profit / dataPoints[0]) * 100);

            dict.profit[item.name] = percentProfit;
          } else {
            dict.sparks[item.name] = null;
            dict.profit[item.name] = 0;
          }
          return dict;
        },
        { sparks: {}, profit: {} }
      );
      this.sparks = dates.sparks;
      this.profits = dates.profit;
    },
  },
  components: {},
  computed: {
    formatter() {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: this.$store.state.currency,
      });
    },
  },
  mounted() {
    window.api.onInventoryLoadUpdate((message) => {
      console.log(message);
      this.inventoryLoadingMessage = message;
    });
    this.getInventory();

    window.api.onInventoryReload(() => {
      this.reloadInventory();
    });

    window.api.onItemAdded((count) => {
      this.unloadedItems = count;
      this.hasUnloadedItems = count > 0;
    });

    this.inventory = Object.keys(this.$store.state.inventory);
    this.inv = this.$store.state.inventory;
    this.inventory.sort((a, b) => {
      return this.inv[b].amount - this.inv[a].amount;
    });
    window.api.onItemLoaded((amount) => {
      this.loading = amount;
    });
    window.api.onLoadingFinished(() => {
      console.log("loading finished!!!!!!!! :D");
      this.loading = 0;
      this.loadingItems = false;
      this.reloadInventory();
    });
    window.api.onLoadingStart(() => {
      this.loadingItems = true;
    });
  },
};
</script>

<style lang="scss" scoped>
.inventory {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 10px;
  margin-top: 50px;
  .inventory-search {
    width: 100%;
    flex-shrink: 0;
    border-bottom: solid 1px black;
    position: sticky;
    top: 48px;
    z-index: 5;
    background-color: rgb(18, 18, 18);
    display: flex;
    button {
      width: 100px;
    }
  }
  .v-progress-circular {
    margin: auto;
  }
  > * {
    margin-bottom: 20px;
  }
  .v-card {
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .v-card__title {
      height: 72px;
      hyphens: auto;
      align-items: start;
      word-break: break-word;
      padding: 0;
      font-size: 1rem;
      line-height: 1.5rem;
      text-align: left;
    }
    img {
      height: 128px;
      align-self: center;
      user-select: none;
    }
    .v-card__actions {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      div {
        display: flex;
        flex-direction: column;
        span {
          display: flex;
          align-items: center;
          .v-icon {
            margin-right: 2px;
          }
        }
      }
    }
  }
  .v-dialog .v-card {
    padding: 30px;
    img {
      user-select: none;
    }
  }
  h1 {
    width: 100%;
  }
  .loading-items .v-card {
    padding: 30px;
  }
}
a {
  text-decoration: none !important;
}
.loading-div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 300px;
}
</style>
<style lang="scss">
.loading-card {
  padding: 30px !important;
  > * {
    margin-bottom: 20px !important;
  }
}
.detail-item {
  padding: 20px;
  img {
    height: 200px;
  }
  .bottom-wrapper {
    display: flex;
    justify-content: space-between;
    .half {
      width: 50%;
      display: flex;
      flex-direction: column;
      div {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        span.amount {
          width: 80px;
          text-align: left;
        }
      }
      .price-line {
        height: 36px;
        justify-content: flex-end;
        font-size: 18px;
      }
    }
  }
}
</style>