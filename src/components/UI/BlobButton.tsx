import type React from "react";
import styles from "@/styles/BlobButton.module.css";

const BlobButton: React.FC<{ text: React.ReactNode }> = ({ text }) => {
  return (
    <div className={` ${styles.button}  `} >
        <span className={`${styles.text} backdrop-blur-sm`}>
          {text}
         </span>
         <span className={styles.blob}></span>
         <span className={styles.blob}></span>
         <span className={styles.blob}></span>
         <span className={styles.blob}></span>
    </div>
  );
};

export default BlobButton;
