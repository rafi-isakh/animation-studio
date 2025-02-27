import type React from "react";
import styles from "@/styles/BlobButton.module.css";

const BlobButton: React.FC<{ text: React.ReactNode }> = ({ text }) => {
  return (
    <div className="relative inline-flex group w-[50px] h-[50px]">
      <div className="absolute transition-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-xl filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
      </div>
      <button className={`${styles.button} self-center`}>
        <span className={`${styles.text} backdrop-blur-sm`}>
          {text}
        </span>
        <span className={styles.blob}></span>
        <span className={styles.blob}></span>

      </button>
    </div>
  );
};

export default BlobButton;
