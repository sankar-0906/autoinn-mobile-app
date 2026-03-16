import { QuotationCard } from './components/QuotationCard';

export default function App() {
  return (
    <div className="h-screen w-screen bg-teal-50 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-md h-full flex items-center p-3">
        <QuotationCard
          quotationId="QDE/25-26/2439"
          leadSource="WALK IN"
          followUpDate="02-03-2026"
          followUpTime="11:45"
          vehicle="R15M Carbon"
          employee="Asma Mubharak I"
          timestamp="01-03-2026 11:00"
          status="Hot"
          onView={() => console.log('View clicked')}
          onEdit={() => console.log('Edit clicked')}
        />
      </div>
    </div>
  );
}