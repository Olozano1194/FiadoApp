import ReportSection from "../components/sections/reportes/HeaderSection";
import MetricsSection from "../components/sections/reportes/MetricsSection";
import RecentActivityCard from "../components/sections/reportes/RecentActivityCard";

const ReportPage = () => {
    return (
        <section className="max-w-7xl mx-auto space-y-8">
            <ReportSection />
            <MetricsSection />
            <RecentActivityCard />
        </section>
    );
};
export default ReportPage;
