import { useState, useEffect } from "react";
import styles from "./InventoryContainer.module.scss";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface IItemInventory {
  name: string;
  incomingQty: number;
  outgoingQty: number;
}

interface IMatInventory {
  name: string;
  incomingQty: number;
  outgoingQty: number;
}

const InventoryContainer = () => {
  const [itemInventory, setItemInventory] = useState<IItemInventory[]>([]);
  const [matInventory, setMatInventory] = useState<IMatInventory[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchItemInventory(currentUser.uid);
        fetchMatInventory(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchItemInventory = async (uid: string) => {
    const itemInventoryQuery = query(
      collection(db, "ItemInventory"),
      where("userId", "==", uid)
    );

    const itemInventorySnapshot = await getDocs(itemInventoryQuery);

    const itemList = itemInventorySnapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as IItemInventory[];

    setItemInventory(itemList);
  };

  const fetchMatInventory = async (uid: string) => {
    const matInventoryQuery = query(
      collection(db, "MatInventory"),
      where("userId", "==", uid)
    );

    const matInventorySnapshot = await getDocs(matInventoryQuery);

    const matList = matInventorySnapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as IMatInventory[];

    setMatInventory(matList);
  };

  return (
    <div className={styles.container}>
      <h2>재고 조회</h2>
      <p>
        자재 입고와 생산 실적에서 반영된 품목과 자재의 재고를 조회할 수
        있습니다.
      </p>
      <div className={styles.inner}>
        <div className={styles.left}>
          <h3>품목</h3>
          <div className={`${styles.table} ${styles["item-table"]}`}>
            <div className={styles.header}>
              <span>품목명</span>
              <span>재고 수량</span>
            </div>
            <div className={styles.body}>
              {itemInventory.map((item) => (
                <div className={styles.row} key={item.name}>
                  <span>{item.name}</span>
                  <span>
                    {(item.incomingQty - item.outgoingQty).toLocaleString(
                      "ko-KR"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.right}>
          <h3>자재</h3>
          <div className={`${styles.table} ${styles["mat-table"]}`}>
            <div className={styles.header}>
              <span>자재명</span>
              <span>입고 수량</span>
              <span>출고 수량</span>
              <span>재고 수량</span>
            </div>
            <div className={styles.body}>
              {matInventory.map((mat) => (
                <div className={styles.row} key={mat.name}>
                  <span>{mat.name}</span>
                  <span>{mat.incomingQty.toLocaleString("ko-KR")}</span>
                  <span>{mat.outgoingQty.toLocaleString("ko-KR")}</span>
                  <span>
                    {(mat.incomingQty - mat.outgoingQty).toLocaleString(
                      "ko-KR"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryContainer;
