import React from "react";
import styles from "./SideBar.module.scss";
import { FaHome } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onClickItem =
    (ad: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      navigate(`/${ad}`);
    };

  return (
    <div className={styles.sidebar}>
      <div className={styles.content}>
        <a onClick={onClickItem("Beco-ERP")}>
          <FaHome size="1.5rem" />
        </a>
        <ul>
          <li
            className={
              location.pathname === "/Beco-ERP/im" ? styles.focus : undefined
            }
          >
            <a onClick={onClickItem("Beco-ERP/im")}>자재/품목 등록</a>
          </li>
          <li
            className={
              location.pathname === "/Beco-ERP/wh" ? styles.focus : undefined
            }
          >
            <a onClick={onClickItem("Beco-ERP/wh")}>자재 입고</a>
          </li>
          <li
            className={
              location.pathname === "/Beco-ERP/wr" ? styles.focus : undefined
            }
          >
            <a onClick={onClickItem("Beco-ERP/wr")}>생산 실적</a>
          </li>
          <li
            className={
              location.pathname === "/Beco-ERP/iv" ? styles.focus : undefined
            }
          >
            <a onClick={onClickItem("Beco-ERP/iv")}>재고 조회</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideBar;
