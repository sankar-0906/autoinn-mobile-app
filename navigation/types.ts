

export type RootStackParamList = {
    LocationGate: undefined;
    Login: undefined;
    Main: undefined;
    QuotationDetails: { id: string };
    QuotationForm: { id: string; selectedVehicle?: any; paymentDetails?: any; viewMode?: boolean };
    QuotationView: { id: string };
    SelectModel: { returnTo?: 'QuotationForm' | 'AddQuotation' | 'QuotationView'; quotationId?: string; viewMode?: boolean; viewVehicleData?: any; paymentDetails?: any } | undefined;
    SelectPrice: { vehicleId: string; vehicleData?: any; returnTo?: 'QuotationForm' | 'AddQuotation' | 'QuotationView' | 'BookingRegister'; quotationId?: string; viewMode?: boolean; paymentDetails?: any };
    SelectPayment: { vehicleId: string; vehicleData?: any; priceDetails: any; returnTo?: 'QuotationForm' | 'AddQuotation' | 'QuotationView' | 'BookingRegister'; quotationId?: string; viewMode?: boolean; paymentDetails?: any };
    SelectVehicleForBooking: { modelName?: string; customerName?: string; customerId?: string; customerPhone?: string };
    SelectVehicleForDetails: { modelName?: string };
    SelectVehicleColor: { modelName?: string; selectedColor?: any };
    ColorSelection: { modelName?: string; modelId?: string };
    AddQuotation: { selectedVehicle?: any; customerId?: string; customerName?: string; phoneNumbers?: any[]; returnToPrevious?: boolean };
    AdvancedFilters: undefined;
    FollowUpFilters: undefined;
    FollowUps: undefined;
    FollowUpDetail: { id: string };
    CustomerDetails: { customerId?: string };
    ConfirmBooking: { customerId?: string; customerName?: string; phoneNumbers?: any[] };
    AdvancedBooking: { customerId?: string; customerName?: string; phoneNumbers?: any[] };
    BookingRegister: { customerId?: string; customerName?: string; phoneNumbers?: any[]; isAdvancedBooking?: boolean };
    BookingActivity: { id?: string; customerName?: string; customerId?: string; customerPhone?: string; selectedVehicle?: any; scrollToSection?: string; isAdvancedBooking?: boolean; isConfirmBooking?: boolean; cameFrom?: string };
    BookingConfirmActivity: { id?: string; customerName?: string; customerId?: string; customerPhone?: string; selectedVehicle?: any; scrollToSection?: string; isAdvancedBooking?: boolean; isConfirmBooking?: boolean };
    WalkInActivity: { customerName?: string; customerId?: string; customerPhone?: string; quotationId?: string; selectedVehicle?: any };
    CallActivity: { customerName?: string; customerId?: string; customerPhone?: string; quotationId?: string; selectedVehicle?: any };
    ActivityViewEdit: { mode: 'view' | 'edit'; activityId: string };
    VehicleDetails: { vehicle: any; mode?: 'view' | 'edit'; selectedVehicleData?: any };
    // Job Cards
    AddJobCard: undefined;
    JobCardFilters: undefined;
    UpdateCustomer: { customerName?: string; mobileNo?: string; customerId?: string };
};

export type TabParamList = {
    Quotations: undefined;
    JobCards: undefined;
    Account: undefined;
};
