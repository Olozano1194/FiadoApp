import LowStockSection from "../components/sections/table/section/LowStockSection";
import TablePage from "../components/sections/table/section/TableSection";
// icons
import { IoIosAdd } from "react-icons/io";


const TableSection = () => {
    return (
        <>
        <section id="planes" className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <section className="space-y-4 md:col-span-8">
                <TablePage />
            </section>
            <LowStockSection />            
        </section>
        <button className="bottom-20 bg-primary cursor-pointer flex fixed h-14 items-center justify-center right-6 rounded-full shadow-lg text-on-surface transition-transform w-14 active:scale-95 md:bottom-8">
            <span className="text-4xl"><IoIosAdd /></span>
        </button>
        </>
    );
};
export default TableSection;