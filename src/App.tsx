"use client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const App = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden relative">
      <Navbar />
      <main className="w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
};

export default App;
