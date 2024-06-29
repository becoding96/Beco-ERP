import InventoryContainer from "../containers/InventoryContainer";
import styles from "./pageCommon.module.scss";
import SideBar from "../components/SideBar";

function InventoryPage() {
  return (
    <div className={styles.page}>
      <SideBar />
      <InventoryContainer />
    </div>
  );
}

export default InventoryPage;
