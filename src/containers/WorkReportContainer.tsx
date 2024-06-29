import React, { useState, useEffect } from "react";
import styles from "./WorkReportContainer.module.scss";
import Button from "../components/Button";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { IItem, IMat } from "./ItemMaterialContainer";
import { MdDelete } from "react-icons/md";

interface IItemProd extends IItem {
  prodQty: number;
  goodQty: number;
  defectiveQty: number;
  workTime: number;
}

export interface IMatUsage {
  name: string;
  qty: number;
}

interface IWorkReport extends IItemProd {
  materials: IMatUsage[];
  wrId: string;
  date: Timestamp;
}

const WorkReportContainer = () => {
  const [productionData, setProductionData] = useState<IItemProd>({
    name: "",
    prodQty: 0,
    goodQty: 0,
    defectiveQty: 0,
    workTime: 0,
  });

  const [materialUsages, setMaterialUsages] = useState<IMatUsage[]>([
    { name: "", qty: 0 },
    { name: "", qty: 0 },
    { name: "", qty: 0 },
    { name: "", qty: 0 },
    { name: "", qty: 0 },
  ]);

  const [materials, setMaterials] = useState<IMat[]>([]);
  const [items, setItems] = useState<IItem[]>([]);
  const [workReports, setWorkReports] = useState<IWorkReport[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        fetchMaterials(currentUser.uid);
        fetchItems(currentUser.uid);
        fetchWorkReports(currentUser.uid);
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

  const fetchItems = async (uid: string) => {
    const itemCollection = query(
      collection(db, "Item"),
      where("userId", "==", uid)
    );

    const itemSnapshot = await getDocs(itemCollection);

    const itemList = itemSnapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as IItem[];

    setItems(itemList);
  };

  const fetchWorkReports = async (uid: string) => {
    const workReportsQuery = query(
      collection(db, "WorkReport"),
      where("userId", "==", uid)
    );

    const workReportsSnapshot = await getDocs(workReportsQuery);

    const workReportsList = workReportsSnapshot.docs.map((doc) => ({
      wrId: doc.id,
      ...doc.data(),
    })) as IWorkReport[];

    setWorkReports(workReportsList);
  };

  const handleProductionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "name") {
      const selectedItem = items.find((item) => item.name === value);
      if (selectedItem) {
        setProductionData({
          ...productionData,
          name: selectedItem.name,
          defectiveQty: productionData.prodQty - productionData.goodQty,
        });
      }
    } else {
      setProductionData({
        ...productionData,
        [name]: Number(value),
        defectiveQty:
          name === "goodQty"
            ? productionData.prodQty - Number(value)
            : productionData.defectiveQty,
      });
    }
  };

  const handleMaterialChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const updatedMaterials = [...materialUsages];
    if (name === "name") {
      const selectedMaterial = materials.find((mat) => mat.name === value);
      if (selectedMaterial) {
        updatedMaterials[index] = {
          name: selectedMaterial.name,
          qty: updatedMaterials[index].qty,
        };
      }
    } else {
      updatedMaterials[index] = {
        ...updatedMaterials[index],
        [name]: Number(value),
      };
    }

    setMaterialUsages(updatedMaterials);
  };

  const handleAddMaterials = () => {
    setMaterialUsages([
      ...materialUsages,
      { name: "", qty: 0 },
      { name: "", qty: 0 },
      { name: "", qty: 0 },
      { name: "", qty: 0 },
      { name: "", qty: 0 },
    ]);
  };

  const handleAddProduction = async () => {
    if (!user) return;

    // 재고 부족 확인
    for (const material of materialUsages) {
      if (material.name.trim() === "") continue;

      const matInventoryQuery = query(
        collection(db, "MatInventory"),
        where("name", "==", material.name),
        where("userId", "==", user.uid)
      );
      const matInventorySnapshot = await getDocs(matInventoryQuery);
      const matInventoryDoc = matInventorySnapshot.docs[0];

      if (!matInventoryDoc) {
        alert(`자재 ${material.name}의 입고 내역이 없습니다.`);
        return;
      }

      const matInventoryData = matInventoryDoc.data();
      const currentStock =
        matInventoryData.incomingQty - matInventoryData.outgoingQty;

      if (currentStock < material.qty) {
        alert(
          `자재 - ${material.name}의 재고가 부족합니다. 현재 재고: ${currentStock}, 필요한 수량: ${material.qty}`
        );
        return;
      }
    }

    const newWorkReport: IWorkReport = {
      ...productionData,
      materials: materialUsages.filter(
        (material) => material.name.trim() !== ""
      ),
      wrId: "", // 임시로 빈 값
      date: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "WorkReport"), {
      ...newWorkReport,
      userId: user.uid,
    });

    await updateDoc(docRef, { wrId: docRef.id });
    newWorkReport.wrId = docRef.id;

    for (const material of materialUsages) {
      if (material.name.trim() === "") continue;

      const matInventoryRef = collection(db, "MatInventory");
      const matInventoryQuery = query(
        matInventoryRef,
        where("name", "==", material.name),
        where("userId", "==", user.uid)
      );
      const matInventorySnapshot = await getDocs(matInventoryQuery);
      const matInventoryDoc = matInventorySnapshot.docs[0];

      if (matInventoryDoc) {
        const matInventoryData = matInventoryDoc.data();
        await updateDoc(matInventoryDoc.ref, {
          outgoingQty: matInventoryData.outgoingQty + material.qty,
        });
      }
    }

    const itemInventoryRef = collection(db, "ItemInventory");
    const itemInventoryQuery = query(
      itemInventoryRef,
      where("name", "==", productionData.name),
      where("userId", "==", user.uid)
    );
    const itemInventorySnapshot = await getDocs(itemInventoryQuery);
    const itemInventoryDoc = itemInventorySnapshot.docs[0];

    if (itemInventoryDoc) {
      const itemInventoryData = itemInventoryDoc.data();
      await updateDoc(itemInventoryDoc.ref, {
        incomingQty: itemInventoryData.incomingQty + productionData.prodQty,
      });
    } else {
      await addDoc(collection(db, "ItemInventory"), {
        name: productionData.name,
        incomingQty: productionData.prodQty,
        outgoingQty: 0,
        userId: user.uid,
      });
    }

    setWorkReports([...workReports, newWorkReport]);

    setProductionData({
      name: "",
      prodQty: 0,
      goodQty: 0,
      defectiveQty: 0,
      workTime: 0,
    });
    setMaterialUsages([
      { name: "", qty: 0 },
      { name: "", qty: 0 },
      { name: "", qty: 0 },
      { name: "", qty: 0 },
      { name: "", qty: 0 },
    ]);
  };

  const handleDeleteWorkReport = async (wrId: string) => {
    if (!user) return;

    const workReportRef = doc(db, "WorkReport", wrId);
    const workReportDoc = await getDoc(workReportRef);
    if (!workReportDoc.exists()) return;

    const workReportData = workReportDoc.data() as IWorkReport;

    const itemInventoryQuery = query(
      collection(db, "ItemInventory"),
      where("name", "==", workReportData.name),
      where("userId", "==", user.uid)
    );
    const itemInventorySnapshot = await getDocs(itemInventoryQuery);
    if (!itemInventorySnapshot.empty) {
      const itemInventoryDoc = itemInventorySnapshot.docs[0];
      const itemInventoryData = itemInventoryDoc.data();
      const newIncomingQty =
        itemInventoryData.incomingQty - workReportData.goodQty;
      await updateDoc(itemInventoryDoc.ref, { incomingQty: newIncomingQty });
    }

    for (const material of workReportData.materials) {
      const matInventoryQuery = query(
        collection(db, "MatInventory"),
        where("name", "==", material.name),
        where("userId", "==", user.uid)
      );
      const matInventorySnapshot = await getDocs(matInventoryQuery);
      if (!matInventorySnapshot.empty) {
        const matInventoryDoc = matInventorySnapshot.docs[0];
        const matInventoryData = matInventoryDoc.data();
        const newOutgoingQty = matInventoryData.outgoingQty - material.qty;
        await updateDoc(matInventoryDoc.ref, { outgoingQty: newOutgoingQty });
      }
    }

    await deleteDoc(workReportRef);

    fetchWorkReports(user.uid);
  };

  return (
    <div className={styles.container}>
      <h2>생산 실적</h2>
      <p>자재를 소요해 품목을 생산해주세요.</p>
      <p>등록된 자재와 품목만 입력할 수 있습니다.</p>
      <div className={styles.inner}>
        <div className={styles.left}>
          <h3>생산 품목</h3>
          <div className={`${styles.table} ${styles["item-table"]}`}>
            <div className={styles.header}>
              <span>품목명</span>
              <span>생산 수량</span>
              <span>양품 수량</span>
              <span>불량 수량</span>
              <span>작업 시간</span>
            </div>
            <div className={styles.row}>
              <select
                name="name"
                value={productionData.name}
                onChange={handleProductionChange}
              >
                <option value="">품목 선택</option>
                {items.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="prodQty"
                value={productionData.prodQty}
                onChange={handleProductionChange}
              />
              <input
                type="number"
                name="goodQty"
                value={productionData.goodQty}
                onChange={handleProductionChange}
              />
              <input
                type="number"
                name="defectiveQty"
                value={productionData.prodQty - productionData.goodQty}
                readOnly
                style={{ backgroundColor: "rgb(245, 245, 245)" }}
              />
              <input
                type="number"
                name="workTime"
                value={productionData.workTime}
                onChange={handleProductionChange}
              />
            </div>
          </div>
          <h3 style={{ margin: "3rem 0 1rem 0" }}>투입 자재</h3>
          <div className={`${styles.table} ${styles["mat-table"]}`}>
            <div className={styles.header}>
              <span>자재명</span>
              <span>수량</span>
            </div>
            {materialUsages.map((material, index) => (
              <div className={styles.row} key={index}>
                <select
                  name="name"
                  value={material.name}
                  onChange={(e) => handleMaterialChange(index, e)}
                >
                  <option value="">자재 선택</option>
                  {materials.map((mat) => (
                    <option key={mat.name} value={mat.name}>
                      {mat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  name="qty"
                  value={material.qty}
                  onChange={(e) => handleMaterialChange(index, e)}
                />
              </div>
            ))}
            <Button
              id="row"
              value="행 추가"
              style={{ width: "100%", height: "1.5rem", lineHeight: "1.5rem" }}
              onClick={handleAddMaterials}
            />
          </div>
          <Button
            id="create"
            value="생산"
            style={{
              margin: "1rem 0 0 0",
              width: "5rem",
              height: "2rem",
              lineHeight: "2rem",
              fontSize: "1rem",
            }}
            onClick={handleAddProduction}
          ></Button>
        </div>
        <div className={styles.right}>
          <h3>생산 실적 내역</h3>
          <div className={`${styles.table} ${styles["hist-table"]}`}>
            <div className={styles.header}>
              <span>생산품목명</span>
              <span>생산 수량</span>
              <span>양품 수량</span>
              <span>불량 수량</span>
              <span>작업 시간</span>
              <span>생산 일자</span>
            </div>
            {workReports.map((report) => (
              <div className={styles.row} key={report.wrId}>
                <span>{report.name}</span>
                <span>{report.prodQty.toLocaleString("ko-KR")}</span>
                <span>{report.goodQty.toLocaleString("ko-KR")}</span>
                <span>{report.defectiveQty.toLocaleString("ko-KR")}</span>
                <span>{report.workTime.toLocaleString("ko-KR")}</span>
                <span>{report.date.toDate().toLocaleDateString()}</span>
                <div className={styles["btn-div"]}>
                  <MdDelete
                    onClick={() => handleDeleteWorkReport(report.wrId)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkReportContainer;
