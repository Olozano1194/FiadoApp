import { Outlet } from "react-router-dom"; //el outlet nos sirve para agregarle un componente dentro de este componente

import SideBar from "../components/layout/SideBar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function LayoutAdmin() {
    return (
        <section className="min-h-screen grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr]">
            <SideBar />            
            <div className="flex flex-col min-h-0">
                <Header />
                <div className="h-[90vh] max-w-7xl mx-auto overflow-y-scroll p-4 space-y-8 lg:p-6">
                    <Outlet />
                    <Footer />
                </div>
            </div>
        </section>
    );
}
export default LayoutAdmin;