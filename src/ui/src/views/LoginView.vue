<template>
  <div class="login-page">
    <div class="login-container">
      <div class="left-section">
        <div class="logo-container">
          <img :src="mndyNameLogo" alt="My Icon" class="mndy-icon" />
        </div>
        <q-btn @click="handleSignInClick" class="sign-in-btn" label="Sign in with " no-caps>
          <img :src="oktaLogo" alt="Okta Logo" class="okta-logo" />
        </q-btn>
      </div>
      <div class="right-section">
        <img :src="loginIllustration" alt="Login Illustration" class="illustration" />
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from "vue";
import { storeToRefs } from "pinia";
import { useLoadingStore } from "@/stores/loading.store";
import mndyNameLogo from '@/assets/mndy_name_logo.svg';
import loginIllustration from '@/assets/login_page_illustration.svg';
import oktaLogo from '@/assets/okta_logo.svg';

export default {
  name: "LoginView",
  setup() {
    const loadingStore = useLoadingStore();
    const { loading } = storeToRefs(loadingStore);
    const authService = inject("authService");

    async function handleSignInClick() {
      loading.value = true;
      await authService.signIn();
    }

    return { 
      handleSignInClick, 
      mndyNameLogo,
      loginIllustration,
      oktaLogo,
    };
  },
};
</script>

<style lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px; /* Add padding for smaller screens */
}

.login-container {
  display: flex;
  width: 80%;
  max-width: 1200px;
  height: 70%;
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-direction: row; /* Default to row layout */
}

.left-section, .right-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.left-section {
  padding: 36px 0 36px 36px;
  text-align: center;
}

.right-section {
  background-color: #4682b4;
  margin: 36px;
  border-radius: 16px;
}

.logo-container {
  margin-bottom: 8px;
}

.mndy-icon {
  width: 65%; /* Adjust the size as needed */
  height: auto;
  margin-left: 12px;
}

.sign-in-btn {
  background-color: #4682b4;
  color: #ffffff;
  font-size: 18px;
  padding: 12px 24px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #545F71;
  }
}

.okta-logo {
  width: 48px;
  height: auto;
  margin-left: 8px;
  padding-bottom: 4px;
}

.illustration {
  width: 70%;
  height: auto;
  filter: invert(1); /* Make the illustration white */
}

/* Media Queries for Responsive Design */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column; /* Stack sections vertically */
    height: auto; /* Adjust height for smaller screens */
  }

  .right-section {
    margin: 0;
    border-radius: 0;
    width: 100%;
    padding: 20px; /* Add padding for smaller screens */
  }

  .left-section {
    padding: 20px; /* Adjust padding for smaller screens */
  }

  .mndy-icon {
    width: 80%; /* Adjust size for smaller screens */
  }

  .sign-in-btn {
    font-size: 16px; /* Adjust font size for smaller screens */
    padding: 10px 20px; /* Adjust padding for smaller screens */
  }

  .okta-logo {
    width: 32px; /* Adjust size for smaller screens */
  }

  .illustration {
    width: 90%; /* Adjust size for smaller screens */
  }
}

@media (max-width: 480px) {
  .login-container {
    width: 100%; /* Full width for very small screens */
  }

  .mndy-icon {
    width: 90%; /* Adjust size for very small screens */
  }

  .sign-in-btn {
    font-size: 14px; /* Adjust font size for very small screens */
    padding: 8px 16px; /* Adjust padding for very small screens */
  }

  .okta-logo {
    width: 24px; /* Adjust size for very small screens */
  }

  .illustration {
    width: 80%; /* Full width for very small screens */
  }
}
</style>
