import WorkReportContainer from "../containers/WorkReportContainer";
import styles from "./pageCommon.module.scss";
import SideBar from "../components/SideBar";

function WorkReportPage() {
  return (
    <div className={styles.page}>
      <SideBar />
      <WorkReportContainer />
    </div>
  );
}

export default WorkReportPage;
