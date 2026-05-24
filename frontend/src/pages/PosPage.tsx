import ProductSearch from '../components/pos/ProductSearch';
import CartPanel from '../components/pos/CartPanel';
import PaymentBar from '../components/pos/PaymentBar';
import SaleReceipt from '../components/pos/SaleReceipt';

const PosPage = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 min-w-0">
          <ProductSearch />
        </div>
        <div className="w-96 shrink-0">
          <CartPanel />
        </div>
      </div>
      <PaymentBar />
      <SaleReceipt />
    </div>
  );
};

export default PosPage;
