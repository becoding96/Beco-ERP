import { useEffect } from "react";
import { auth } from "../firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import styles from "./MainContainer.module.scss";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import bannerImage from "/banner.webp";
import LottieComponent from "../components/Lottie";

function MainContainer() {
  const navigate = useNavigate();

  useEffect(() => {
    // 익명 로그인
    const anonymousLogin = async () => {
      try {
        const result = await signInAnonymously(auth);

        if (result.user) {
          localStorage.setItem("userUID", result.user.uid);
        }
      } catch (error) {
        console.error("login failed", error);
      }
    };

    // 로그아웃 or 인증 상태 변경
    onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.setItem("userUID", user.uid);
      } else {
        anonymousLogin();
      }
    });

    // 로그인 상태 확인
    const storedUID = localStorage.getItem("userUID");
    if (!storedUID) {
      anonymousLogin();
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <img src={bannerImage} alt="Banner" />
        <div>
          <h1>Beco-ERP</h1>
          <h3>간단한 생산 및 재고 관리 ERP 프로젝트입니다.</h3>
        </div>
      </div>
      <div className={styles["introduce-div"]}>
        <div className={styles.animation}>
          <LottieComponent name="ItemMaterial" />
        </div>
        <div className={styles.text} style={{ padding: "0 0 0 15rem" }}>
          <h2>자재/품목 등록</h2>
          <hr />
          <p>관리하고자 하는 자재와 품목을 등록하세요.</p>
          <Button
            id="goItemMaterial"
            value="바로가기"
            style={{
              width: "10rem",
              height: "2.5rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              margin: "1.25rem 0 0 0",
            }}
            onClick={() => navigate("/Beco-ERP/im")}
          />
        </div>
      </div>
      <div className={styles["introduce-div"]}>
        <div className={styles.text} style={{ padding: "0 15rem 0 0" }}>
          <h2>자재 입고</h2>
          <hr />
          <p>등록한 자재가 얼마나 입고되었는지 기입해주세요.</p>
          <p>입고된 자재로 품목을 만들 수 있습니다.</p>
          <Button
            id="goWarehousing"
            value="바로가기"
            style={{
              width: "10rem",
              height: "2.5rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              margin: "1.25rem 0 0 0",
            }}
            onClick={() => navigate("/Beco-ERP/wh")}
          />
        </div>
        <div className={styles.animation}>
          <LottieComponent name="Warehousing" />
        </div>
      </div>
      <div className={styles["introduce-div"]}>
        <div className={styles.animation}>
          <LottieComponent name="WorkReport" />
        </div>
        <div className={styles.text} style={{ padding: "0 0 0 15rem" }}>
          <h2>생산 실적</h2>
          <hr />
          <p>자재를 통해 품목을 생산한 실적을 입력하세요.</p>
          <p>생산한 품목은 창고에 자동 입고 처리됩니다.</p>
          <Button
            id="goWorkReport"
            value="바로가기"
            style={{
              width: "10rem",
              height: "2.5rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              margin: "1.25rem 0 0 0",
            }}
            onClick={() => navigate("/Beco-ERP/wr")}
          />
        </div>
      </div>
      <div className={styles["introduce-div"]} style={{ margin: "0 0 5rem 0" }}>
        <div className={styles.text} style={{ padding: "0 15rem 0 0" }}>
          <h2>재고 조회</h2>
          <hr />
          <p>입고된 자재, 생산된 품목의 재고를 조회할 수 있어요.</p>
          <Button
            id="goInventory"
            value="바로가기"
            style={{
              width: "10rem",
              height: "2.5rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              margin: "1.25rem 0 0 0",
            }}
            onClick={() => navigate("/Beco-ERP/iv")}
          />
        </div>
        <div className={styles.animation}>
          <LottieComponent name="Inventory" />
        </div>
      </div>
    </div>
  );
}

export default MainContainer;
