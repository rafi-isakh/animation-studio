import type React from "react";
import styles from "@/styles/BlobButton.module.css";

const BlobButton: React.FC<{ text: React.ReactNode }> = ({ text }) => {
  return (
    <button className={styles.button}>
      <span className={styles.text} style={{ backdropFilter: "blur(10px)" }}>
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
