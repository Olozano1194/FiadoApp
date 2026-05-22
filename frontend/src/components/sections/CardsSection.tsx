import { MdOutlinePayments, MdOutlineAssignmentLate } from "react-icons/md";
import { CiWarning } from "react-icons/ci";

const CardsSection = () => {
    return (
        <section id="servicios" className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="bg-white border border-outline-variant p-4 rounded-xl transition-shadow hover:shadow-md lg:p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="bg-secondary-container p-2 rounded-lg text-secondary text-xl lg:text-2xl">
                        <MdOutlinePayments />
                    </span>
                    <span className="font-medium text-primary text-xs lg:text-lg 2xl:text-xl">+12% vs ayer</span>
                </div>
                <p className="font-medium text-on-surface-variant">Ventas del Día</p>
                <h4 className="font-black mt-1 text-title text-2xl">$4.250.00</h4>
            </article>
            <article className="bg-white border border-outline-variant p-4 rounded-xl transition-shadow hover:shadow-md lg:p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="bg-tertiary p-2 rounded-lg text-tertiary-container text-xl lg:text-2xl">
                        <MdOutlineAssignmentLate />
                    </span>
                    <span className="font-medium text-text-error text-xs lg:text-lg 2xl:text-xl">8 clientes pendientes</span>
                </div>
                <p className="font-medium text-on-surface-variant">Total Fiado Pendiente</p>
                <h4 className="font-black mt-1 text-title text-2xl">$1.890.50</h4>
            </article>
            <article className="bg-white border border-outline-variant p-4 rounded-xl transition-shadow hover:shadow-md lg:p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="bg-error-container p-2 rounded-lg text-text-error text-xl lg:text-2xl">
                        <CiWarning />
                    </span>
                    <span className="font-medium text-text-error text-xs lg:text-lg 2xl:text-xl">4 productos</span>
                </div>
                <p className="font-medium text-on-surface-variant">Stock Bajo</p>
                <h4 className="font-black mt-1 text-title text-2xl">Atención Requerida</h4>
            </article>            
        </section>
    );};
export default CardsSection;