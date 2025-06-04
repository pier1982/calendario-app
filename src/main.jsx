// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

// Import di BrowserRouter da react-router-dom
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css"; // il tuo CSS (Tailwind, ecc.)

// Root rendering
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 
      AVVOLGI l'App dentro BrowserRouter:
      è essenziale per far funzionare <Link> e <Route> in App.jsx 
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
