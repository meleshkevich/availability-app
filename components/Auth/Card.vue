<template>
  <div>
    <el-card class="card">
      <div v-if="!showEmailConfirmMessage">
        <h3>{{ authState }}</h3>
        <div class="input-container">
          <el-input v-model="input.email" placeholder="Email" />
          <el-input
            v-model="input.password"
            placeholder="Password"
            type="password"
          />
        </div>
        <el-button type="primary" @click="handleSubmit">Submit</el-button>

        <p v-if="authError" class="error">{{ authError }}</p>
        <p @click="toggleAuthState">
          {{
            authState === "login"
              ? "Dont have an account? Create one now!"
              : "Already have an account ? go ahead and login!"
          }}
        </p>
      </div>
      <div v-else>
        <h3>Check your mail for confirmation message</h3>
      </div>
    </el-card>
  </div>
</template>
<script setup>
const authState = ref("login");
const authError = ref("");
const showEmailConfirmMessage = ref(false);
const input = reactive({
  password: "",
  email: "",
});

const router = useRouter();

const { signUp, signIn, signOut, user } = useAuth();

const toggleAuthState = () => {
  if (authState.value === "login") authState.value = "singup";
  else authState.value = "login";
  authError.value = "";
};

const handleSubmit = async () => {
  try {
    if (authState.value == "login") {
      await signIn({ email: input.email, password: input.password });
      navigateTo("/services");
      console.log("loggedin user::", user);
    } else {
      await signUp({ email: input.email, password: input.password });
      showEmailConfirmMessage.value = true;
    }
    (input.email = ""), (input.password = "");
  } catch (err) {
    authError.value = err.message;
  }
};
</script>

<style scoped>
.card {
  padding: 1rem;
  width: 25rem;
}
.card h3 {
  font-size: 2rem;
  text-transform: capitalize;
}

.input-container {
  display: flex;
  flex-direction: column;
}

.input-container input {
  margin-bottom: 0.3rem;
  padding: 0.2rem;
  outline: none;
  border: 0.1rem solid rgba(0, 0, 0, 0.1);
  border-radius: 0.2rem;
}
p {
  color: blue;
  font-size: 1rem;
  cursor: pointer;
}
.error {
  color: red;
}
</style>
