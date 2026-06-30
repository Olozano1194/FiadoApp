import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
// icons
import { RiGroupLine, RiLogoutCircleLine } from "react-icons/ri";
import { IoHomeOutline } from "react-icons/io5";
import { MdOutlineInventory2, MdOutlinePointOfSale, MdOutlineAnalytics } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { useStoreConfig } from "../../stores/storeConfigStore";



export interface SubMenuState {
    menu1: boolean;
    menu2: boolean;
    menu3: boolean;
    menu4: boolean;
    menu5: boolean;
}

const SideBar = () => {
    const location = useLocation();
    const { config, fetchConfig } = useStoreConfig();

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            <aside
                className={`bg-on-surface border-r border-outline-variant duration-200 ease-in-out fixed flex-col hidden justify-between h-full px-3 py-6 top-0 transition-all w-64 z-50 sm:flex md:static md:h-screen lg:w-auto`}
            >
                {/* Menu */}
                <div>
                    {/* logo + Name gym */}
                    <section className="px-6 py-8">
                        {/* <FormHeader logo={Logo} title="ControlFit" highlight="Colombia" /> */}
                        <h1 className="leading-9 text-4xl font-bold text-text-primary">
                            {config?.store_name || "La Tiendita"}                            
                        </h1>
                        <span className="font-semibold leading-6 text-[16px] text-surface-variant">Gestión de Negocio</span>
                    </section>
                    <nav className="flex-1 px-2 space-y-1">
                        {/* Inicio */}
                        <Link to="/" className={`flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high${isActive('/') ? ' bg-surface-container-high' : ''}`}>
                            <span className={`font-black group-hover:text-text-primary mr-3 text-outline text-lg${isActive('/') ? ' text-text-primary' : ''}`}>
                                <IoHomeOutline  />
                            </span>                            
                            Inicio
                        </Link>
                        {/* Inventario */}
                        <Link to="/inventario" className={`flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high${isActive('/inventario') ? ' bg-surface-container-high' : ''}`}>
                            <span className={`font-black group-hover:text-text-primary mr-3 text-outline text-lg${isActive('/inventario') ? ' text-text-primary' : ''}`}>
                                <MdOutlineInventory2 />
                            </span>                            
                            Inventario
                        </Link>
                        {/* Clientes/Fiados */}
                        <Link to="/clientes" className={`flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high${isActive('/clientes') ? ' bg-surface-container-high' : ''}`}>
                            <span className={`font-black group-hover:text-text-primary mr-3 text-outline text-lg${isActive('/clientes') ? ' text-text-primary' : ''}`}>
                                <RiGroupLine />
                            </span>                            
                            Clientes/Fiados
                        </Link>
                        {/* Venta Rápida */}
                        <Link to="/ventas" className={`flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high${isActive('/ventas') ? ' bg-surface-container-high' : ''}`}>
                            <span className={`font-black group-hover:text-text-primary mr-3 text-outline text-lg${isActive('/ventas') ? ' text-text-primary' : ''}`}>
                                <MdOutlinePointOfSale />
                            </span>                            
                            Venta Rápida
                        </Link>
                        <Link to="/reportes" className={`flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high${isActive('/reportes') ? ' bg-surface-container-high' : ''}`}>
                            <span className={`font-black group-hover:text-text-primary mr-3 text-outline text-lg${isActive('/reportes') ? ' text-text-primary' : ''}`}>
                                <MdOutlineAnalytics />
                            </span>                            
                            Reportes
                        </Link>
                        <Link to="/cierre" className={`flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high${isActive('/cierre') ? ' bg-surface-container-high' : ''}`}>
                            <span className={`font-black group-hover:text-text-primary mr-3 text-outline text-lg${isActive('/cierre') ? ' text-text-primary' : ''}`}>
                                <RiLogoutCircleLine />
                            </span>                            
                            Cerrar Turno
                        </Link>
                        <Link to="/ajustes" className={`flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high${isActive('/ajustes') ? ' bg-surface-container-high' : ''}`}>
                            <span className={`font-black group-hover:text-text-primary mr-3 text-outline text-lg${isActive('/ajustes') ? ' text-text-primary' : ''}`}>
                                <CiSettings />
                            </span>                            
                            Ajustes
                        </Link>                          
                    </nav>
                </div>

            </aside>
        </>
    );
};
export default SideBar;
