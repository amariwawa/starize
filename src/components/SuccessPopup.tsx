"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuccessPopup = ({ isOpen, onClose }: SuccessPopupProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-surface-container-low rounded-2xl border border-primary/30 p-8 md:p-12 max-w-md w-full text-center shadow-2xl"
          >
            <span
              className="material-symbols-outlined text-primary text-7xl mb-6"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h3 className="text-2xl md:text-3xl font-black font-headline text-on-surface mb-4">
              Your transaction was successful
            </h3>
            <p className="text-on-surface-variant text-lg mb-8">
              Please check your email for further updates.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all"
            >
              OK
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessPopup;
