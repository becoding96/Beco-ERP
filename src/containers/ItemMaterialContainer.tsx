import React, { useState, useEffect } from "react";
import styles from "./ItemMaterialContainer.module.scss";
import { HiPencilSquare } from "react-icons/hi2";
import { MdDelete, MdSave } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface IItem {
  name: string;
}

export interface IMat extends IItem {
  price: number;
  unit: string;
}

const ItemMaterialContainer = () => {
  const [tab, setTab] = useState<number>(0);
  const [matData, setMatData] = useState<IMat[]>([]);
  const [newMatEntry, setNewMatEntry] = useState<IMat>({
    name: "",
    unit: "",
    price: 0,
  });
  const [itemData, setItemData] = useState<IItem[]>([]);
  const [newItemEntry, setNewItemEntry] = useState<IItem>({
    name: "",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<IItem | IMat | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        fetchData(currentUser.uid);
      }
    });
  }, []);

  const fetchData = async (uid: string) => {
    // 자재 데이터 가져오기
    const matCollection = query(
      collection(db, "Material"),
      where("userId", "==", uid)
    );
    const matSnapshot = await getDocs(matCollection);
    const matList = matSnapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as IMat[];
    setMatData(matList);

    // 품목 데이터 가져오기
    const itemCollection = query(
      collection(db, "Item"),
      where("userId", "==", uid)
    );
    const itemSnapshot = await getDocs(itemCollection);
    const itemList = itemSnapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as IItem[];
    setItemData(itemList);
  };

  const handleClickTab = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTab(parseInt(e.currentTarget.value));
    setEditIndex(null);
    setEditEntry(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean,
    index?: number
  ) => {
    const { name, value } = e.target;

    if (isEdit) {
      if (editEntry && typeof index !== "undefined") {
        const updatedEntry = {
          ...editEntry,
          [name]: name === "price" ? Number(value) : value,
        };

        setEditEntry(updatedEntry);
      }
    } else {
      if (tab === 0) {
        setNewMatEntry({
          ...newMatEntry,
          [name]: name === "price" ? Number(value) : value,
        });
      } else if (tab === 1) {
        setNewItemEntry({ ...newItemEntry, [name]: value });
      }
    }
  };

  const handleAddEntry = async () => {
    if (!user) return;

    if (tab === 0) {
      if (matData.some((mat) => mat.name === newMatEntry.name)) {
        alert("중복된 자재명입니다.");
        return;
      }

      const entryWithUser = { ...newMatEntry, userId: user.uid };
      await addDoc(collection(db, "Material"), entryWithUser);

      setMatData([...matData, entryWithUser]);
      setNewMatEntry({ name: "", unit: "", price: 0 });
    } else if (tab === 1) {
      if (itemData.some((item) => item.name === newItemEntry.name)) {
        alert("이미 존재하는 품목명입니다.");
        return;
      }

      const entryWithUser = { ...newItemEntry, userId: user.uid };
      await addDoc(collection(db, "Item"), entryWithUser);

      setItemData([...itemData, entryWithUser]);
      setNewItemEntry({ name: "" });
    }
  };

  const handleEditEntry = (index: number) => {
    setEditIndex(index);
    if (tab === 0) {
      setEditEntry(matData[index]);
    } else if (tab === 1) {
      setEditEntry(itemData[index]);
    }
  };

  const handleSaveEntry = async () => {
    if (editEntry !== null && typeof editIndex !== "undefined") {
      if (tab === 0) {
        const updatedData = [...matData];
        updatedData[editIndex!] = editEntry as IMat;
        setMatData(updatedData);
        const docRef = doc(db, "Material", updatedData[editIndex!].name);
        await updateDoc(docRef, editEntry as any);
      } else if (tab === 1) {
        const updatedData = [...itemData];
        updatedData[editIndex!] = editEntry as IItem;
        setItemData(updatedData);
        const docRef = doc(db, "Item", updatedData[editIndex!].name);
        await updateDoc(docRef, editEntry as any);
      }
    }
    setEditIndex(null);
    setEditEntry(null);
  };

  const handleDeleteEntry = async (index: number) => {
    if (!user) return;

    if (tab === 0) {
      const entryToDelete = matData[index];
      const warehousingQuery = query(
        collection(db, "Warehousing"),
        where("userId", "==", user.uid),
        where("name", "==", entryToDelete.name)
      );
      const warehousingSnapshot = await getDocs(warehousingQuery);

      if (!warehousingSnapshot.empty) {
        alert("해당 자재는 입고 내역이 있어 삭제할 수 없습니다.");
        return;
      }

      const updatedData = matData.filter((_, i) => i !== index);
      setMatData(updatedData);
      const matQuery = query(
        collection(db, "Material"),
        where("userId", "==", user.uid),
        where("name", "==", entryToDelete.name)
      );
      const matSnapshot = await getDocs(matQuery);
      if (!matSnapshot.empty) {
        const docRef = doc(db, "Material", matSnapshot.docs[0].id);
        await deleteDoc(docRef);
      }

      const matInventoryQuery = query(
        collection(db, "MatInventory"),
        where("userId", "==", user.uid),
        where("name", "==", entryToDelete.name)
      );
      const matInventorySnapshot = await getDocs(matInventoryQuery);
      if (!matInventorySnapshot.empty) {
        const matInventoryDocRef = doc(
          db,
          "MatInventory",
          matInventorySnapshot.docs[0].id
        );
        await deleteDoc(matInventoryDocRef);
      }
    } else if (tab === 1) {
      const entryToDelete = itemData[index];
      const workReportQuery = query(
        collection(db, "WorkReport"),
        where("userId", "==", user.uid),
        where("name", "==", entryToDelete.name)
      );
      const workReportSnapshot = await getDocs(workReportQuery);

      if (!workReportSnapshot.empty) {
        alert("해당 품목은 생산 실적이 있어 삭제할 수 없습니다.");
        return;
      }

      const updatedData = itemData.filter((_, i) => i !== index);
      setItemData(updatedData);
      const itemQuery = query(
        collection(db, "Item"),
        where("userId", "==", user.uid),
        where("name", "==", entryToDelete.name)
      );
      const itemSnapshot = await getDocs(itemQuery);
      if (!itemSnapshot.empty) {
        const docRef = doc(db, "Item", itemSnapshot.docs[0].id);
        await deleteDoc(docRef);
      }

      const itemInventoryQuery = query(
        collection(db, "ItemInventory"),
        where("userId", "==", user.uid),
        where("name", "==", entryToDelete.name)
      );
      const itemInventorySnapshot = await getDocs(itemInventoryQuery);
      if (!itemInventorySnapshot.empty) {
        const itemInventoryDocRef = doc(
          db,
          "ItemInventory",
          itemInventorySnapshot.docs[0].id
        );
        await deleteDoc(itemInventoryDocRef);
      }
    }

    setEditIndex(null);
    setEditEntry(null);
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditEntry(null);
  };

  return (
    <div className={styles.container}>
      <h2>자재/품목 등록</h2>
      <p>수량을 관리할 자재와 품목을 등록하는 화면입니다.</p>
      <p>입고와 생산 내역이 있는 경우 삭제할 수 없습니다.</p>
      <div className={styles.tab} style={{ width: "34rem" }}>
        <button
          value={0}
          onClick={handleClickTab}
          className={tab === 0 ? styles.active : ""}
        >
          자재
        </button>
        <button
          value={1}
          onClick={handleClickTab}
          className={tab === 1 ? styles.active : ""}
        >
          품목
        </button>
      </div>
      {tab === 0 && (
        <div className={`${styles.table} ${styles["mat-table"]}`}>
          <div className={styles.header}>
            <span>자재명</span>
            <span>단위</span>
            <span>단가</span>
          </div>
          <div className={styles.body}>
            {matData.map((entry, index) => (
              <div key={entry.name} className={styles.row}>
                {editIndex === index ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={(editEntry as IMat).name}
                      onChange={(e) => handleInputChange(e, true, index)}
                    />
                    <input
                      type="text"
                      name="unit"
                      value={(editEntry as IMat).unit}
                      onChange={(e) => handleInputChange(e, true, index)}
                    />
                    <input
                      type="number"
                      name="price"
                      value={(editEntry as IMat).price}
                      onChange={(e) => handleInputChange(e, true, index)}
                    />
                    <div className={styles["btn-div"]}>
                      <MdSave
                        style={{ marginRight: "0.5rem" }}
                        onClick={handleSaveEntry}
                      />
                      <IoMdClose onClick={handleCancelEdit} />
                    </div>
                  </>
                ) : (
                  <>
                    <span>{entry.name}</span>
                    <span>{entry.unit}</span>
                    <span>{entry.price.toLocaleString("ko-KR")}</span>
                    <div className={styles["btn-div"]}>
                      <HiPencilSquare
                        style={{ marginRight: "0.5rem" }}
                        onClick={() => handleEditEntry(index)}
                      />
                      <MdDelete onClick={() => handleDeleteEntry(index)} />
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className={styles.row}>
              <input
                type="text"
                name="name"
                value={newMatEntry.name}
                onChange={(e) => handleInputChange(e, false)}
                placeholder="자재명"
              />
              <input
                type="text"
                name="unit"
                value={newMatEntry.unit}
                onChange={(e) => handleInputChange(e, false)}
                placeholder="단위"
              />
              <input
                type="number"
                name="price"
                value={newMatEntry.price}
                onChange={(e) => handleInputChange(e, false)}
                placeholder="단가"
              />
              <div className={styles["btn-div"]}>
                <IoMdAdd onClick={handleAddEntry} />
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === 1 && (
        <div className={`${styles.table} ${styles["item-table"]}`}>
          <div className={styles.header}>
            <span>품목명</span>
          </div>
          <div className={styles.body}>
            {itemData.map((entry, index) => (
              <div key={entry.name} className={styles.row}>
                {editIndex === index ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={(editEntry as IItem).name}
                      onChange={(e) => handleInputChange(e, true, index)}
                    />
                    <div className={styles["btn-div"]}>
                      <MdSave onClick={handleSaveEntry} />
                      <IoMdClose onClick={handleCancelEdit} />
                    </div>
                  </>
                ) : (
                  <>
                    <span>{entry.name}</span>
                    <div className={styles["btn-div"]}>
                      <HiPencilSquare
                        style={{ marginRight: "0.5rem" }}
                        onClick={() => handleEditEntry(index)}
                      />
                      <MdDelete onClick={() => handleDeleteEntry(index)} />
                    </div>
                  </>
                )}
              </div>
            ))}
            <div className={styles.row}>
              <input
                type="text"
                name="name"
                value={newItemEntry.name}
                onChange={(e) => handleInputChange(e, false)}
                placeholder="품목명"
              />
              <div className={styles["btn-div"]}>
                <IoMdAdd onClick={handleAddEntry} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemMaterialContainer;
