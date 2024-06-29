import ItemMaterialContainer from "../containers/ItemMaterialContainer";
import styles from "./pageCommon.module.scss";
import SideBar from "../components/SideBar";

function ItemMaterialPage() {
  return (
    <div className={styles.page}>
      <SideBar />
      <ItemMaterialContainer />
    </div>
  );
}

export default ItemMaterialPage;
