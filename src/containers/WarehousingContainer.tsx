import React, { useState, useEffect } from "react";
import styles from "./WarehousingContainer.module.scss";
import { db, auth } from "../firebase";
import {
  getDocs,
  collection,
  doc,
  addDoc,
  query,
  where,
  Timestamp,
  deleteDoc,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { IMat } from "./ItemMaterialContainer";
import { IoMdAdd } from "react-icons/io";
import { MdDelete } from "react-icons/md";

interface IMatWarehousing extends IMat {
  qty: number;
  amount: number;
  date: Timestamp;
  userId?: string;
  whId: string;
}

const WarehousingContainer = () => {
  const [materials, setMaterials] = useState<IMat[]>([]);
  const [warehousingData, setWarehousingData] = useState<IMatWarehousing[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<IMat | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        fetchMaterials(currentUser.uid);
        fetchWarehousingData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchMaterials = async (uid: string) => {
    const matCollection = query(
      collection(db, "Material"),
      where("userId", "==", uid)
    );
    const matSnapshot = await getDocs(matCollection);
    const matList = matSnapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as IMat[];
    setMaterials(matList);
  };

  const fetchWarehousingData = async (uid: string) => {
    const warehousingCollection = query(
      collection(db, "Warehousing"),
      where("userId", "==", uid)
    );
    const warehousingSnapshot = await getDocs(warehousingCollection);
    const warehousingList = warehousingSnapshot.docs.map((doc) => ({
      ...doc.data(),
      whId: doc.id,
    })) as IMatWarehousing[];
    setWarehousingData(warehousingList);
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const material = materials.find((mat) => mat.name === selectedName) || null;
    setSelectedMaterial(material);
    setQty(0);
    setAmount(0);
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qtyValue = parseFloat(e.target.value) || 0;
    setQty(qtyValue);
    if (selectedMaterial) {
      setAmount(qtyValue * selectedMaterial.price);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedMaterial || qty <= 0 || !user) return;

    const newWarehousingEntry: IMatWarehousing = {
      ...selectedMaterial,
      qty,
      amount,
      date: Timestamp.now(),
      userId: user.uid,
      whId: "", // 임시로 빈 값
    };

    const docRef = await addDoc(
      collection(db, "Warehousing"),
      newWarehousingEntry
    );

    await updateDoc(docRef, { whId: docRef.id, userId: user.uid });
    newWarehousingEntry.whId = docRef.id;

    const inventoryRef = doc(db, "MatInventory", selectedMaterial.name);
    await setDoc(
      inventoryRef,
      {
        name: selectedMaterial.name,
        incomingQty: increment(qty),
        outgoingQty: 0,
        userId: user.uid,
      },
      { merge: true }
    );

    setWarehousingData([...warehousingData, newWarehousingEntry]);

    fetchMaterials(user.uid);
    fetchWarehousingData(user.uid);

    setSelectedMaterial(null);
    setQty(0);
    setAmount(0);
  };

  const handleDeleteEntry = async (entryId?: string) => {
    if (!user || !entryId) return;

    const entryToDelete = warehousingData.find(
      (entry) => entry.whId === entryId
    );
    if (!entryToDelete) return;

    const matDoc = materials.find((mat) => mat.name === entryToDelete.name);
    if (!matDoc) return;

    const inventoryRef = query(
      collection(db, "MatInventory"),
      where("name", "==", matDoc.name),
      where("userId", "==", user.uid)
    );
    const inventorySnapshot = await getDocs(inventoryRef);
    const inventoryDoc = inventorySnapshot.docs[0];

    if (!inventoryDoc.exists) {
      alert("해당 자재의 재고 정보를 찾을 수 없습니다.");
      return;
    }

    const { incomingQty, outgoingQty } = inventoryDoc.data() as {
      incomingQty: number;
      outgoingQty: number;
    };
    const currentStock = incomingQty - outgoingQty;

    if (currentStock - entryToDelete.qty < 0) {
      alert("해당 입고 내역을 삭제하면 자재의 재고가 0 미만으로 처리됩니다.");
      return;
    }

    const docRef = doc(db, "Warehousing", entryId);
    await deleteDoc(docRef);

    await updateDoc(inventoryDoc.ref, {
      incomingQty: increment(-entryToDelete.qty),
    });

    fetchMaterials(user.uid);
    fetchWarehousingData(user.uid);
  };

  return (
    <div className={styles.container}>
      <h2>자재 입고</h2>
      <p>등록한 자재의 입고 수량을 입력해주세요.</p>
      <p>입고 내역을 삭제하는 경우도 재고에 반영됩니다.</p>
      <p>
        마이너스 재고는 발생할 수 없습니다. (ex. 생산 실적에서 자재가 소요된 후
        입고 내역을 삭제하는 경우)
      </p>
      <div className={`${styles.table} ${styles["wh-table"]}`}>
        <div className={styles.header}>
          <span>자재</span>
          <span>단위</span>
          <span>단가</span>
          <span>수량</span>
          <span>금액</span>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <select
              onChange={handleMaterialChange}
              value={selectedMaterial?.name || ""}
            >
              <option value="">자재 선택</option>
              {materials.map((material) => (
                <option key={material.name} value={material.name}>
                  {material.name}
                </option>
              ))}
            </select>
            <span className={styles.disable}>
              {selectedMaterial ? selectedMaterial.unit : "-"}
            </span>
            <span className={styles.disable}>
              {selectedMaterial ? selectedMaterial.price : "-"}
            </span>
            <input
              type="number"
              min="0"
              value={qty}
              onChange={handleQtyChange}
              placeholder="수량"
              style={{ borderLeft: "none" }}
            />
            <span className={styles.disable}>
              {amount.toLocaleString("ko-KR")}
            </span>
            <div className={styles["btn-div"]}>
              <IoMdAdd onClick={handleAddEntry} />
            </div>
          </div>
        </div>
      </div>
      <h3 style={{ margin: "2rem 0 1rem 0" }}>입고 내역</h3>
      <div className={`${styles.table} ${styles["hist-table"]}`}>
        <div className={styles.header}>
          <span>자재</span>
          <span>단위</span>
          <span>단가</span>
          <span>수량</span>
          <span>금액</span>
          <span>입고 날짜</span>
        </div>
        <div className={styles.body}>
          {warehousingData.map((entry) => (
            <div key={entry.whId} className={styles.row}>
              <span>{entry.name}</span>
              <span>{entry.unit}</span>
              <span>{entry.price.toLocaleString("ko-KR")}</span>
              <span>{entry.qty.toLocaleString("ko-KR")}</span>
              <span>{entry.amount.toLocaleString("ko-KR")}</span>
              <span>{entry.date.toDate().toLocaleDateString()}</span>
              <div className={styles["btn-div"]}>
                <MdDelete onClick={() => handleDeleteEntry(entry.whId)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WarehousingContainer;
