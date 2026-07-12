
  import { createRoot } from "react-dom/client";
  import { QueryProvider } from "./app/providers/QueryProvider";
  import { GoogleOAuthProvider } from "@react-oauth/google";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy_client_id_for_dev_if_not_set.apps.googleusercontent.com";

  createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </GoogleOAuthProvider>
  );