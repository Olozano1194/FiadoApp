//Components
import NavHeader from "../headerNav/NavHeader";

const Header = () => {
    return (
        <header className="bg-surface-container-lowest backdrop-blur-(--glass-blur) border-b border-outline-variant flex items-center justify-between px-6 py-4 top-0 sticky shadow-sm w-full z-10">
            <NavHeader />
        </header>
    );
};
export default Header;