<template>
  <div class="home">
    <v-progress-circular
      v-if="loginState == 0"
      indeterminate
    ></v-progress-circular>
    <template v-else>
      <v-card>
        <h2>Login to Steam</h2>
        <v-text-field label="Username" required v-model="username" />
        <v-text-field
          label="Password"
          required
          type="password"
          v-model="password"
        />
        <v-checkbox
          type="checkbox"
          v-model="remember"
          label="Remember me"
        ></v-checkbox>
        <v-alert v-if="loginError !== ''" color="red" dense type="error">{{
          loginError
        }}</v-alert>
        <v-btn outlined @click="login" :loading="loginState === 3">Login</v-btn>
      </v-card>
    </template>
    <v-dialog v-model="codePopup" persistent max-width="300px">
      <v-card outlined>
        <h2>SteamGuard</h2>
        <p v-if="codeDomain">
          An Email has been sent to your adress "*****@{{ codeDomain }}".
        </p>
        <v-text-field label="2fa Code" v-model="code" />
        <v-btn @click="submitCode" outlined :loading="loginState === 5"
          >Use</v-btn
        >
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      username: "",
      password: "",
      code: "",
      remember: false,
      loginError: "",
      codeCallback: null,
      codePopup: false,
      codeDomain: "",
    };
  },
  components: {},
  mounted() {
    window.api.loginFailed((username) => {
      if (this.$store.state.loginState === 0) {
        //relog try failed
        this.username = username;
        this.$store.commit("relogImpossible", username);
      } else if (this.$store.state.loginState === 3) {
        this.loginError = "Login Failed!";
        this.$store.commit("relogImpossible", username);
      }
    });

    window.api.steamguardNeeded(({ domain, callback }) => {
      this.$store.commit("steamguardNeeded");
      this.codePopup = true;
      this.codeCallback = callback;
      this.codeDomain = domain;
    });
  },
  computed: {
    loginState() {
      return this.$store.state.loginState;
    },
  },
  methods: {
    login() {
      if (this.username == "") {
        this.loginError = "Please submit an account name";
        return;
      }
      this.$store.commit("tryingToLogIn");
      this.loginError = "";
      window.api.login({
        accountName: this.username,
        password: this.password,
        //twoFactorCode: this.code,
        rememberPassword: this.remember,
      });
    },
    submitCode() {
      this.codeCallback(this.code);
      this.codeCallback = null;
      this.$store.commit("steamguardWaiting");
    },
  },
};
</script>

<style lang="scss" scoped>
.home {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .v-card {
    padding: 10px;
    width: 320px;
    h2 {
      text-align: left;
    }
  }
  label {
    display: flex;
    align-items: center;
    user-select: none;
  }
}
.v-dialog {
  display: flex;
  justify-content: center;
  align-items: center;
  .v-card {
    padding: 10px;
    width: 320px;
    h2 {
      text-align: left;
    }
  }
}
</style>