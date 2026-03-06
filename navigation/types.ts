export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    QuotationDetails: { id: string };
    QuotationForm: { id: string; selectedVehicle?: any; paymentDetails?: any; viewMode?: boolean };
    QuotationView: { id: string };
    SelectModel: { returnTo?: 'QuotationForm' | 'AddQuotation' | 'QuotationView'; quotationId?: string; viewMode?: boolean; viewVehicleData?: any; paymentDetails?: any } | undefined;
    SelectPrice: { vehicleId: string; vehicleData?: any; returnTo?: 'QuotationForm' | 'AddQuotation' | 'QuotationView' | 'BookingRegister'; quotationId?: string; viewMode?: boolean; paymentDetails?: any };
    SelectPayment: { vehicleId: string; vehicleData?: any; priceDetails: any; returnTo?: 'QuotationForm' | 'AddQuotation' | 'QuotationView'; quotationId?: string; viewMode?: boolean; paymentDetails?: any };
    SelectVehicleForBooking: { modelName?: string; customerName?: string; customerId?: string; customerPhone?: string };
    AddQuotation: { selectedVehicle?: any; customerId?: string; customerName?: string; phoneNumbers?: any[]; returnToPrevious?: boolean };
    AdvancedFilters: undefined;
    FollowUpFilters: undefined;
    FollowUps: undefined;
    FollowUpDetail: { id: string };
    CustomerDetails: { customerId?: string };
    CustomerEdit: { customerId?: string; customerName?: string };
    ConfirmBooking: { customerId?: string; customerName?: string; phoneNumbers?: any[] };
    AdvancedBooking: { customerId?: string; customerName?: string; phoneNumbers?: any[] };
    JobCardsList: undefined;
    BookingRegister: { customerId?: string; customerName?: string; phoneNumbers?: any[]; isAdvancedBooking?: boolean };
    BookingActivity: { id?: string; customerName?: string; customerId?: string; customerPhone?: string; selectedVehicle?: any; scrollToSection?: string; isAdvancedBooking?: boolean };
    WalkInActivity: { customerName?: string; customerId?: string; customerPhone?: string };
    CallActivity: { customerName?: string; customerId?: string; customerPhone?: string };
    ActivityViewEdit: { mode: 'view' | 'edit'; activityId: string };
};

export type TabParamList = {
    Quotations: undefined;
    JobCards: undefined;
    Account: undefined;
};
