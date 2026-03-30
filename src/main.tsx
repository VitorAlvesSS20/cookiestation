import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import "./styles/global.css";
import "./styles/auth.css";
import "./styles/createStory.css";
import "./styles/home.css";
import "./styles/storyDetail.css";
import "./styles/chat.css";
import "./styles/likeButton.css";
import "./styles/storyView.css";
import "./styles/notFound.css";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);