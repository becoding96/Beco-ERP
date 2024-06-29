import React, { CSSProperties } from "react";
import styles from "./Button.module.scss";

interface ButtonProps {
  id: string;
  value: string;
  style?: CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function Button({ id, value, style, onClick }: ButtonProps) {
  return (
    <button id={id} className={styles.button} style={style} onClick={onClick}>
      {value}
    </button>
  );
}

export default Button;
