import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import MainPage from "./pages/MainPage";
import ItemMaterialPage from "./pages/ItemMaterialPage";
import WarehousingPage from "./pages/WarehousingPage";
import WorkReportPage from "./pages/WorkReportPage";
import InventoryPage from "./pages/InventoryPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Beco-ERP" element={<MainPage />} />
        <Route path="/Beco-ERP/im" element={<ItemMaterialPage />} />
        <Route path="/Beco-ERP/wh" element={<WarehousingPage />} />
        <Route path="/Beco-ERP/wr" element={<WorkReportPage />} />
        <Route path="/Beco-ERP/iv" element={<InventoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
