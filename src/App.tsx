"use client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const App = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      <Navbar />
      <div className="flex-grow w-full max-w-full overflow-x-hidden">{children}</div>
      <Footer />
    </div>
  );
};

export default App;
