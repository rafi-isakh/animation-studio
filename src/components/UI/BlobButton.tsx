import type React from "react";
import styles from "@/styles/BlobButton.module.css";

const BlobButton: React.FC<{ text: React.ReactNode }> = ({ text }) => {
  return (
    <button
    // ${styles.button} 
    className={` ${styles.button} `}
    //  flex-shrink-1 w-full relative inline-flex items-center justify-center md:text-base font-medium text-white transition-all duration-200 bg-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
    >
        <span className={`${styles.text} backdrop-blur-sm`}>
          {text}
         </span>
         <span className={styles.blob}></span>
         <span className={styles.blob}></span>
         <span className={styles.blob}></span>
         <span className={styles.blob}></span>
    </button>
  );
};

export default BlobButton;
