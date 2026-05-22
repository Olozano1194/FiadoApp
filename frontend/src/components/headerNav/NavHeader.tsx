// icons
import { CiSearch } from "react-icons/ci";
//react-menu
import { Menu } from '@headlessui/react';
//Component
import NotificationMenu from "../../components/headerNav/NotificationMenu";
// logo
import logo from "../../assets/logo.png"

const NavHeader = () => {
    
    return (
        <nav className="flex items-center justify-between gap-x-2 w-full">
            {/* Logo y nombre - lado izquierdo */}
            <Menu>
                <div className="flex gap-2 w-auto items-center">
                    <img
                        className="rounded-lg size-9 h-8 w-auto cursor-pointer"
                        src={logo}
                        alt="logo"
                    />
                    <button className="font-bold text-xl tracking-tight text-text-primary cursor-pointer">
                        FiadoApp
                    </button>
                </div>
            </Menu>

            {/* Buscador y notificaciones - lado derecho */}
            <div className="flex items-center gap-4">
                {/* Buscador */}
                <div className="relative hidden sm:block">
                    <CiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-5" />
                    <input
                        type="search"
                        className="bg-surface-container-low border-none outline-none pl-10 pr-4 py-2 rounded-full text-xs text-nav w-64 focus:outline-none focus:ring-2 focus:ring-secondary md:text-sm"
                        placeholder="Buscar producto o cliente..."
                    />
                </div>
                {/* Menú de notificaciones */}
                <Menu>
                    <NotificationMenu />
                </Menu>
            </div>
        </nav>
    );
}
export default NavHeader;                    