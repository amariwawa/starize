"use client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const App = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">{children}</div>
      <Footer />
    </div>
  );
};

export default App;
