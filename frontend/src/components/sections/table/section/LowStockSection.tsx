// icons
import { MdOutlineInventory } from "react-icons/md";


const LowStockSection = () => {
    return (
        <section className="space-y-4 md:col-span-4">
                <div className="flex items-center justify-between px-2">
                    <h5 className="font-semibold text-primary text-lg md:text-xl">Stock Bajo</h5>
                    <span className="text-text-error text-xl"><MdOutlineInventory /></span>
                </div>
                <div className="space-y-3">
                    <article className="bg-white border border-outline-variant flex gap-4 group items-center p-4 rounded-xl transition-all hover:shadow-sm">
                        <div className="bg-on-surface flex h-12 items-center justify-center overflow-hidden rounded-lg shrink-0 w-12">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBs74c5UXi4pmXqshXNU0MCi2idFwSW4f87rk8Llzjq9JqzSk_PyIIgBEvD3xvHHhVP8uGVre4IqXNXYW2-dRjDr2YeZ77dvIsGhPDWsZnnz9r176DkW8KBAR55A-2ByvLJWWAqDGGiX_eelrj4AHdnOP6RzH7XUmKp9IsC8K-0vWLCtBgjOTAOfAqv5o2oKni0gjIKJBLcR0SfrSQaZuUo4JJGUYr9nb2p6F1uSPUi_k_AjpKyUT6O40jz7R7bxGxvv7PWRJRMjAX9" className="h-full object-cover w-full" alt="" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-on-bg text-lg lg:text-xl">Leche Entera 1L</p>
                            <p className="font-mono text-on-surface-variant lg:text-lg">Lácteos</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-text-error text-lg lg:text-xl">2 uni.</p>
                            <p className="font-mono text-on-surface-variant lg:text-lg">min: 10</p>
                        </div>
                    </article>
                    <article className="bg-white border border-outline-variant flex gap-4 group items-center p-4 rounded-xl transition-all hover:shadow-sm">
                        <div className="bg-on-surface flex h-12 items-center justify-center overflow-hidden rounded-lg shrink-0 w-12">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBs74c5UXi4pmXqshXNU0MCi2idFwSW4f87rk8Llzjq9JqzSk_PyIIgBEvD3xvHHhVP8uGVre4IqXNXYW2-dRjDr2YeZ77dvIsGhPDWsZnnz9r176DkW8KBAR55A-2ByvLJWWAqDGGiX_eelrj4AHdnOP6RzH7XUmKp9IsC8K-0vWLCtBgjOTAOfAqv5o2oKni0gjIKJBLcR0SfrSQaZuUo4JJGUYr9nb2p6F1uSPUi_k_AjpKyUT6O40jz7R7bxGxvv7PWRJRMjAX9" className="h-full object-cover w-full" alt="" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-on-bg text-lg lg:text-xl">Arroz Grano 1kg</p>
                            <p className="font-mono text-on-surface-variant lg:text-lg">Abarrotes</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-text-error text-lg lg:text-xl">5 uni.</p>
                            <p className="font-mono text-on-surface-variant lg:text-lg">min: 15</p>
                        </div>
                    </article>
                    <article className="bg-white border border-outline-variant flex gap-4 group items-center p-4 rounded-xl transition-all hover:shadow-sm">
                        <div className="bg-on-surface flex h-12 items-center justify-center overflow-hidden rounded-lg shrink-0 w-12">
                            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBs74c5UXi4pmXqshXNU0MCi2idFwSW4f87rk8Llzjq9JqzSk_PyIIgBEvD3xvHHhVP8uGVre4IqXNXYW2-dRjDr2YeZ77dvIsGhPDWsZnnz9r176DkW8KBAR55A-2ByvLJWWAqDGGiX_eelrj4AHdnOP6RzH7XUmKp9IsC8K-0vWLCtBgjOTAOfAqv5o2oKni0gjIKJBLcR0SfrSQaZuUo4JJGUYr9nb2p6F1uSPUi_k_AjpKyUT6O40jz7R7bxGxvv7PWRJRMjAX9" className="h-full object-cover w-full" alt="" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-on-bg text-lg lg:text-xl">Aceite Vegetal 900ml</p>
                            <p className="font-mono text-on-surface-variant lg:text-lg">Abarrotes</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-text-error text-lg lg:text-xl">1 uni.</p>
                            <p className="font-mono text-on-surface-variant lg:text-lg">min: 8</p>
                        </div>
                    </article>
                    <button className="border border-dashed border-outline-variant cursor-pointer font-semibold py-3 rounded-xl text-outline-variant transition-colors w-full hover:bg-surface-container-high">
                        Generar pedido de stock
                    </button>
                </div>
            </section>
    );
};
export default LowStockSection;