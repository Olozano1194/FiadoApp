import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LayoutAdmin from "./layouts/LayoutAdmin";
import Error404 from "./pages/Error404";
import ProductsPage from "./pages/ProductsPage";
import ClientsPage from "./pages/ClientsPage";

const SalesPage = () => <div className="p-8 text-center text-on-surface-variant"><h2 className="text-2xl font-bold">Venta Rápida</h2><p className="mt-2">Próximamente</p></div>;
const ReportsPage = () => <div className="p-8 text-center text-on-surface-variant"><h2 className="text-2xl font-bold">Reportes</h2><p className="mt-2">Próximamente</p></div>;
const SettingsPage = () => <div className="p-8 text-center text-on-surface-variant"><h2 className="text-2xl font-bold">Ajustes</h2><p className="mt-2">Próximamente</p></div>;

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LayoutAdmin />}>
        <Route index element={<HomePage />} />
        <Route path="inventario" element={<ProductsPage />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="ventas" element={<SalesPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
};
export default App;
