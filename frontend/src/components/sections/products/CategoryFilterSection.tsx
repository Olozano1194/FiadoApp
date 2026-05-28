import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
// Components
import ProductsSection from "./ProductsSection";

interface CategoryFilterSectionProps {
    query: string;
}

const CategoryFilterSection = ({ query }: CategoryFilterSectionProps) => {
  return (
    <TabGroup>
      <TabList className="flex gap-2 lg:justify-end">
        <Tab className="bg-surface-container-high cursor-pointer font-medium px-4 py-2 rounded-full text-on-surface-variant transition-colors hover:bg-surface-container data-selected:text-on-surface data-selected:bg-primary-container/60">
          Todo
        </Tab>
        <Tab className="bg-surface-container-high cursor-pointer font-medium px-4 py-2 rounded-full text-on-surface-variant transition-colors hover:bg-surface-container data-selected:text-on-surface data-selected:bg-primary-container/60">
          Bebidas
        </Tab>
        <Tab className="bg-surface-container-high cursor-pointer font-medium px-4 py-2 rounded-full text-on-surface-variant transition-colors hover:bg-surface-container data-selected:text-on-surface data-selected:bg-primary-container/60">
          Snacks
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel className="mt-8">
          <ProductsSection query={query} />
        </TabPanel>
        <TabPanel className="w-full flex justify-center items-center mt-8 text-2xl text-violet-950 font-bold">
          Tipos
        </TabPanel>
        <TabPanel className="w-full flex justify-center items-center mt-8 text-2xl text-violet-950 font-bold">            
          Filtros
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
};
export default CategoryFilterSection;