import { useNavigate, Link } from "react-router-dom";
// icons
import { RiLogoutCircleLine, RiGroupLine } from "react-icons/ri";
import { IoHomeOutline } from "react-icons/io5";
import { MdOutlineInventory2, MdOutlinePointOfSale, MdOutlineAnalytics } from "react-icons/md";




export interface SubMenuState {
    menu1: boolean;
    menu2: boolean;
    menu3: boolean;
    menu4: boolean;
    menu5: boolean;
}

const SideBar = () => {
    const navigate = useNavigate();
    // const [toggleMenu, setToggleMenu] = useState(false);      

 

    // Esta función nos sirve para cerrar la sesión
    const handleLogOut = () => {
        // logout();
        navigate("/");
    };

    //función para capitalizar
    // const formatRole = (role: string): string =>
    //     role.charAt(0).toUpperCase() + role.slice(1);

    return (
        <>
            <aside
                className={`bg-on-surface border-r border-outline-variant duration-200 ease-in-out fixed flex-col hidden justify-between h-full px-3 py-6 top-0 transition-all w-64 z-50 sm:flex md:w-[40%] lg:w-[35%] xl:w-auto xl:h-screen xl:static`}
            >
                {/* Menu */}
                <div>
                    {/* logo + Name gym */}
                    <section className="px-6 py-8">
                        {/* <FormHeader logo={Logo} title="ControlFit" highlight="Colombia" /> */}
                        <h1 className="leading-9 text-4xl font-bold text-text-primary">
                            La Tiendita                            
                        </h1>
                        <span className="font-semibold leading-6 text-[16px] text-surface-variant">Gestión de Negocio</span>
                    </section>
                    <nav className="flex-1 px-2 space-y-1">
                        <Link to="#" className="flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high">
                            <span className="font-black group-hover:text-text-primary mr-3 text-outline text-lg">
                                <IoHomeOutline  />
                            </span>                            
                            Inicio
                        </Link>
                        <Link to="#" className="flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high">
                            <span className="font-black group-hover:text-text-primary mr-3 text-outline text-lg">
                                <MdOutlineInventory2 />
                            </span>                            
                            Inventario
                        </Link>
                        <Link to="#" className="flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high">
                            <span className="font-black group-hover:text-text-primary mr-3 text-outline text-lg">
                                <RiGroupLine />
                            </span>                            
                            Clientes/Fiados
                        </Link>
                        <Link to="#" className="flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high">
                            <span className="font-black group-hover:text-text-primary mr-3 text-outline text-lg">
                                <MdOutlinePointOfSale />
                            </span>                            
                            Venta Rápida
                        </Link>
                        <Link to="#" className="flex group items-center px-4 py-3 rounded-lg text-on-surface-variant transition-all hover:bg-surface-container-high">
                            <span className="font-black group-hover:text-text-primary mr-3 text-outline text-lg">
                                <MdOutlineAnalytics />
                            </span>                            
                            Reportes
                        </Link>                        
                    </nav>
                </div>
                {/* Cerrar Sesión */}
                <nav>
                    <ul className="border-t border-nav/30 flex flex-col gap-4">
                        <li>
                            <button
                                onClick={handleLogOut}
                                className="w-full flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-slate-100 text-nav font-semibold transition-colors"
                            >
                                <RiLogoutCircleLine className="text-primary" />
                                Cerrar Turno
                            </button>
                        </li>
                    </ul>
                </nav>
            </aside>
            {/* <button
                onClick={() => setToggleMenu(!toggleMenu)}
                className="cursor-pointer xl:hidden fixed bottom-4 right-4 bg-pulse-gradient text-white transition-transform p-3 rounded-full shadow-2xl z-50 hover:scale-110"
            >
                {toggleMenu ? <RiCloseLine /> : <RiMenu3Line />}
            </button> */}
        </>
    );
};
export default SideBar;
