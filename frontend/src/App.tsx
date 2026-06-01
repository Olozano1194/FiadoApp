import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import LayoutAdmin from "./layouts/LayoutAdmin";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Error404 from "./pages/Error404";
import ProductsPage from "./pages/ProductsPage";
import ClientsPage from "./pages/ClientsPage";
import PosPage from "./pages/PosPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import ReportPage from "./pages/ReportPage";
import SettingsPage from "./pages/SettingsPage";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<LayoutAdmin />}>
          <Route index element={<HomePage />} />
          <Route path="inventario" element={<ProductsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="ventas/historial" element={<SalesHistoryPage />} />
          <Route path="ventas" element={<PosPage />} />
          <Route path="reportes" element={<ReportPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
};
export default App;