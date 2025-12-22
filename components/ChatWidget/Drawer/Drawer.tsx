"use client";
import { AnimatePresence, motion } from "framer-motion"; //animatePresence for closing

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

const Drawer = ({ open, onClose, children }: DrawerProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close drawer overlay"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 cursor-pointer sm:absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="fixed left-0 top-0 z-50 h-dvh w-70 bg-[#F9FAFB] border-r border-gray-200 shadow-xl sm:absolute sm:h-full"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            <div className="p-4 border-b border-gray-200 text-sm font-semibold text-gray-800">
              Resents
            </div>
            <div className="p-3">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Drawer;
