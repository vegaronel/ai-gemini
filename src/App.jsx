import React from "react";
import "./App.css";
import { Chat } from "./pages/Chat";
import Credits from "./pages/Credits";
function App() {
  return (
    <div className="bg-slate-950">
      <div className="h-screen flex-col text-slate-50 flex justify-center md:items-center">
        <Chat />
      </div>
      <Credits />
    </div>
  );
}

export default App;
