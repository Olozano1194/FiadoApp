import { useNavigate } from "react-router-dom";
import { MdPersonAddAlt, MdAddShoppingCart } from "react-icons/md";

const HeroSection = () => {
    const navigate = useNavigate();
    return (
        <section className="flex flex-col gap-6 justify-between py-5 px-3.5 md:flex-row md:items-end md:px-5 lg:px-16">
            <div>
                <h3 className="font-bold text-primary text-2xl">¡Hola de nuevo!</h3>
                <p className="font-semibold mt-1 text-on-surface-variant text-lg">Hoy es un buen día para vender en <span className="text-primary text-xl">La Tiendita</span>.</p>
            </div>
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/clientes')}
                    className="bg-secondary-container flex font-mono gap-2 items-center px-6 py-3 rounded-xl text-secondary transition-all hover:bg-opacity-90 active:scale-95"
                >
                    <span><MdPersonAddAlt /></span>Agregar Cliente
                </button>
                <button
                    onClick={() => navigate('/ventas')}
                    className="bg-primary flex font-mono gap-2 items-center px-6 py-3 rounded-xl shadow-sm text-on-surface transition-all hover:bg-opacity-90 active:scale-95"
                >
                    <span><MdAddShoppingCart /></span>Nueva Venta
                </button>
            </div>            
        </section>
    );
};
export default HeroSection;