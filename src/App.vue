<template>
  <v-app id="app">
    <v-app-bar v-if="$router.currentRoute.name !== 'Login'" dense fixed>
      <h3>{{ $router.currentRoute.name }}</h3>
      <v-spacer></v-spacer>
      <span class="info-span">
        <v-icon small>mdi-wallet</v-icon>
        {{ balance }}
      </span>
      <span class="info-span">
        <v-icon small>mdi-chart-line-variant</v-icon>
        {{ totalInventoryValue }}
      </span>
      <span class="info-span">
        <v-icon small>mdi-crop-free</v-icon>
        {{ totalUnpackedItems }}
        <v-btn v-if="packableItemsAmount > 0" @click="packAll"
          >Pack {{ packableItemsAmount }} item{{
            packableItemsAmount > 1 ? "s" : ""
          }}</v-btn
        >
      </span>
      <span class="info-span">
        <v-icon small>mdi-equal-box</v-icon>
        {{ totalPackedItems }}
      </span>
      <span class="info-span">
        <v-icon @click="toggleAutoPacking" :class="{ rotate: autoPacking }"
          >mdi-cog</v-icon
        >
      </span>
      <span class="info-span">
        <v-icon @click="reloadInventory">mdi-refresh</v-icon>
      </span>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-icon @click="logout" v-bind="attrs" v-on="on">mdi-logout</v-icon>
        </template>
        <span>Logout</span>
      </v-tooltip>
    </v-app-bar>
    <div class="menu" v-if="$router.currentRoute.name !== 'Login'">
      <router-link to="inventory">
        <v-icon large>mdi-database</v-icon>
      </router-link>
      <router-link to="investments">
        <v-icon large>mdi-finance</v-icon>
      </router-link>
    </div>
    <v-main>
      <router-view />
    </v-main>
    <v-dialog
      v-model="autoPacking"
      persistent
      width="600px"
      min-width="90%"
      max-height="90%"
    >
      <v-card class="autopacker">
        <h2>Autopacking...</h2>
        <p>Packed {{ autopackingAmount }} Items</p>
        <v-icon large :class="{ rotate: autoPacking }"> mdi-cog </v-icon><br />
        <v-btn @click="toggleAutoPacking">Stop packing</v-btn>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      autoPacking: false,
      autopackingAmount: 0,
    };
  },
  methods: {
    logout() {
      this.$store.commit("logOut");
      window.api.logout();
    },
    packAll() {
      window.api.loadItems(this.$store.getters.allUnpackedItems, true);
    },
    reloadInventory() {
      window.api.reloadInventory();
    },
    toggleAutoPacking() {
      this.autopackingAmount = 0;
      this.autoPacking = !this.autoPacking;
      window.api.toggleAutoPacking(this.autoPacking);
      if (this.autoPacking == false) {
        window.api.reloadInventory();
      }
    },
  },
  mounted() {
    window.api.init(
      (dispatch, data) => {
        this.$store.dispatch(dispatch, data);
      },
      (mutation, data) => {
        this.$store.commit(mutation, data);
      }
    );
    window.api.onSetWallet((data) => {
      this.$store.commit("setBalance", data);
    });
    window.api.onAutoPacked((amount) => {
      this.autopackingAmount = amount;
    });
    setTimeout(() => {}, 1000);
  },
  computed: {
    formatter() {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: this.$store.state.currency,
      });
    },
    balance() {
      return this.formatter.format(this.$store.state.balance);
    },
    totalInventoryValue() {
      return this.formatter.format(this.$store.getters.inventoryValue);
    },
    totalPackedItems() {
      return this.$store.getters.packedItems;
    },
    totalUnpackedItems() {
      return this.$store.getters.unpackedItems;
    },
    packableItemsAmount() {
      return this.$store.getters.allUnpackedItems.length;
    },
  },
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: block;
  .info-span {
    margin: 0 20px;
    display: flex;
    align-items: center;
    .v-icon {
      margin-right: 2px;
    }
  }
}
html {
  ::-webkit-scrollbar {
    width: 15px;
  }

  ::-webkit-scrollbar-track {
    background: #202020;
    border-left: 1px solid #2c2c2c;
  }

  ::-webkit-scrollbar-thumb {
    background: #3e3e3e;
    border: solid 3px #202020;
    border-radius: 7px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: white;
  }
}
.rotate::before {
  animation: rotation 2s infinite linear;
}
@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.autopacker {
  h2 {
    width: auto;
  }
  h2,
  i,
  button {
    margin: 10px 0;
  }
}
.menu {
  position: fixed;
  top: 48px;
  left: 0;
  height: 100%;
  width: 50px;
  background-color: #121212;
  box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  padding-top: 10px;
  box-sizing: border-box;
  a {
    text-decoration: none;
    text-transform: uppercase;
    width: 100%;
    height: 40px;
    &.router-link-active i {
      color: #2196f3 !important;
    }
  }
}

main {
  box-sizing: border-box;
  padding-left: 100px !important;
}
</style>
