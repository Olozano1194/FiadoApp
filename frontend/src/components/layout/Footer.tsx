import { useEffect } from "react";
import { useStoreConfig } from "../../stores/storeConfigStore";

const Footer: React.FC = () => {
  const { config, fetchConfig } = useStoreConfig();
  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  return (
    <footer className="bg-gray-800 text-gray-400 text-center py-4 text-sm">
      <p>© {new Date().getFullYear()} {config?.store_name || "La Tiendita"} — FiadoApp. Todos los derechos reservados.</p>
    </footer>
  );
};
export default Footer;