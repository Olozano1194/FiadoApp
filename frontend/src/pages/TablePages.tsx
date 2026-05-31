import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LowStockSection from "../components/sections/table/section/LowStockSection";
import TablePage from "../components/sections/table/section/TableSection";
// icons
import { IoIosAdd } from "react-icons/io";
import { MdOutlinePointOfSale, MdOutlineInventory2, MdPersonAddAlt } from "react-icons/md";

const actions = [
    { icon: <MdOutlinePointOfSale />, label: 'Nueva Venta', path: '/ventas' },
    { icon: <MdOutlineInventory2 />, label: 'Agregar Producto', path: '/inventario?create=true' },
    { icon: <MdPersonAddAlt />, label: 'Agregar Cliente', path: '/clientes?create=true' },
];

const TableSection = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const fabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleAction = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    return (
        <>
            <section id="planes" className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <section className="space-y-4 md:col-span-8">
                    <TablePage />
                </section>
                <LowStockSection />
            </section>

            {/* FAB Speed Dial */}
            <div ref={fabRef} className="fixed bottom-20 right-6 z-40 flex flex-col items-end gap-3 md:bottom-8">
                {/* Acciones desplegables */}
                {isOpen && (
                    <div className="flex flex-col items-end gap-3">
                        {actions.map((action) => (
                            <button
                                key={action.path}
                                onClick={() => handleAction(action.path)}
                                className="bg-primary text-on-surface flex items-center gap-2 pl-4 pr-5 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all cursor-pointer"
                            >
                                <span className="text-xl">{action.icon}</span>
                                <span className="font-medium whitespace-nowrap text-sm">{action.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Botón FAB principal */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-primary cursor-pointer flex h-14 items-center justify-center rounded-full shadow-lg text-on-surface transition-all w-14 hover:bg-primary/90 active:scale-95"
                >
                    <span className={`text-4xl transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                        <IoIosAdd />
                    </span>
                </button>
            </div>
        </>
    );
};
export default TableSection;
