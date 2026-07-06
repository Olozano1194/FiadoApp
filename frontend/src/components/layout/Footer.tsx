const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="text-center py-6 text-sm text-on-surface-variant border-t border-outline-variant mt-8">
      <p>© {year} FiadoApp. Todos los derechos reservados.</p>
    </footer>
  );
};
export default Footer;