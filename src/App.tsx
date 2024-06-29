import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import MainPage from "./pages/MainPage";
import ItemMaterialPage from "./pages/ItemMaterialPage";
import WarehousingPage from "./pages/WarehousingPage";
import WorkReportPage from "./pages/WorkReportPage";
import InventoryPage from "./pages/InventoryPage";

export const base = "beco-erp";

function App() {
  return (
    <Router>
      <Routes>
        <Route path={`${base}`} element={<MainPage />} />
        <Route path={`${base}/im`} element={<ItemMaterialPage />} />
        <Route path={`${base}/wh`} element={<WarehousingPage />} />
        <Route path={`${base}/wr`} element={<WorkReportPage />} />
        <Route path={`${base}/iv`} element={<InventoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
