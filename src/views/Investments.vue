<template>
  <div style="padding-top: 100px">
    <input v-model="daysShown" />
    <button @click="renderChart()">rerender</button>
    <apexchart
      v-if="profitData !== false"
      type="line"
      height="350"
      :options="chartOptions"
      :series="profitData"
    ></apexchart>
    <div v-if="profitData == false" class="loading-div">
      <p>{{ inventoryLoadingMessage }}...</p>
      <v-progress-circular indeterminate></v-progress-circular>
    </div>
  </div>
</template>



<script>
const oneDay = 24 * 60 * 60 * 1000;
export default {
  name: "Investments",
  data() {
    return {
      inventory: {},
      inventoryLoaded: false,
      profitData: false,
      daysShown: 30,
      inventoryLoadingMessage: "Loading inventory",
      chartOptions: {
        chart: {
          height: 350,
          type: "line",
        },
        stroke: {
          width: 2,
          curve: "smooth",
        },
      },
    };
  },
  methods: {
    getInventory() {
      window.api.getInventory().then((inventory) => {
        this.inventory = inventory;
        this.$store.commit("setInventory", inventory);
        this.inventoryLoaded = true;
        this.inventoryLoadingMessage = "Rendering Chart"
        this.renderChart();
      });
    },
    renderChart() {
      let formated = this.formatItems(this.inventory);
      let profitData = this.inventory.reduce((prev, cur) => {
        if (cur.uniques == undefined || formated[cur.name] == undefined)
          return prev;
        if (prev === null) {
          let newArray = [];
          for (let i = 0; i < formated[cur.name].length; i++) {
            newArray.push(formated[cur.name][i] * cur.uniques.length);
          }
          return newArray;
        } else {
          for (let i = 0; i < formated[cur.name].length; i++) {
            if (isNaN(formated[cur.name][i])) console.log(cur.name);
            prev[i] += formated[cur.name][i] * cur.uniques.length;
          }
          return prev;
        }
      }, null);

      for (let i = 0; i < profitData.length; i++) {
        let time = new Date() - (profitData.length - 1 - i) * oneDay;
        let date = new Date(time);
        profitData[i] = {
          x: date.toLocaleDateString(),
          y: profitData[i].toFixed(2),
        };
      }
      this.profitData = [{ name: "Inventory value", data: profitData }];
    },
    formatItems(items) {
      let returnItems = {};
      items.forEach((item) => {
        if (item.price === undefined) return;
        let history = window.api.getPriceHistory(item.name);
        if (history === null) return;
        let today = new Date();
        let daysAgoList = {};
        history.forEach((point) => {
          let date = new Date(point[0]);
          let amount = point[1];
          let daysAgo = Math.round((today - date) / oneDay);
          daysAgoList[daysAgo] = amount;
        });
        let dataArray = [];
        for (let i = this.daysShown; i >= 0; i--) {
          if (daysAgoList[i]) dataArray.push(daysAgoList[i]);
          else {
            if (i == this.daysShown) {
              dataArray.push(item.price);
            } else dataArray.push(dataArray[dataArray.length - 1]);
          }
        }
        returnItems[item.name] = dataArray;
      });
      return returnItems;
    },
  },
  mounted() {
    this.getInventory();
  },
};
</script>

<style scoped lang="scss">
input {
  color: white;
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