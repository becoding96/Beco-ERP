import WarehousingContainer from "../containers/WarehousingContainer";
import styles from "./pageCommon.module.scss";
import SideBar from "../components/SideBar";

function WarehousingPage() {
  return (
    <div className={styles.page}>
      <SideBar />
      <WarehousingContainer />
    </div>
  );
}

export default WarehousingPage;
