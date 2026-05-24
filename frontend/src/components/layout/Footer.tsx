import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 text-center py-4 text-sm">
      <p>© {new Date().getFullYear()} La Tiendita — FiadoApp. Todos los derechos reservados.</p>
    </footer>
  );
};

export default Footer;
