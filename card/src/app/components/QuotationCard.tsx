import { Eye, Edit } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface QuotationCardProps {
  quotationId: string;
  leadSource: string;
  followUpDate: string;
  followUpTime: string;
  vehicle: string;
  employee: string;
  timestamp: string;
  status: 'Hot' | 'Cold' | 'Warm';
  onView?: () => void;
  onEdit?: () => void;
}

export function QuotationCard({
  quotationId,
  leadSource,
  followUpDate,
  followUpTime,
  vehicle,
  employee,
  timestamp,
  status,
  onView,
  onEdit
}: QuotationCardProps) {
  return (
    <Card className="w-full bg-white rounded-3xl shadow-xl overflow-hidden border-0 flex flex-col">
      
      {/* Header */}
      <div className="bg-teal-600 px-5 py-3 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-white font-semibold text-base">
            Quotation Activity
          </h2>
          <p className="text-teal-50 text-xs mt-0.5">{timestamp}</p>
        </div>

        <Badge
          variant="destructive"
          className="bg-red-500 hover:bg-red-500 text-white border-0 text-sm font-bold px-3 py-1 rounded-full"
        >
          {status}
        </Badge>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-3">

        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-teal-600 text-xs font-medium mb-0.5">
              Quotation ID
            </p>
            <p className="text-gray-900 text-sm font-semibold">
              {quotationId}
            </p>
          </div>

          <div>
            <p className="text-teal-600 text-xs font-medium mb-0.5">
              Lead Source
            </p>
            <p className="text-gray-900 text-sm font-semibold">
              {leadSource}
            </p>
          </div>
        </div>

        <div className="border-t border-teal-100"></div>

        {/* Follow-up Section */}
        <div className="bg-teal-50 rounded-2xl p-3">
          <p className="text-teal-600 text-xs font-medium mb-2">
            Follow-up Schedule
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Date */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-teal-600 text-xs">Date</p>
                <p className="text-gray-900 text-sm font-semibold">
                  {followUpDate}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-teal-600 text-xs">Time</p>
                <p className="text-gray-900 text-sm font-semibold">
                  {followUpTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-teal-100"></div>

        {/* Vehicle */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <div>
            <p className="text-teal-600 text-xs font-medium">Vehicle</p>
            <p className="text-gray-900 text-sm font-semibold">
              {vehicle}
            </p>
          </div>
        </div>

        {/* Employee */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {employee.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-teal-600 text-xs font-medium">Employee</p>
            <p className="text-gray-900 text-sm font-semibold">
              {employee}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="border-t border-teal-100 px-5 py-3 flex gap-2.5">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-600 font-semibold py-3 rounded-xl transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </button>

        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

    </Card>
  );
}