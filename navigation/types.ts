export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    QuotationDetails: { id: string };
    QuotationForm: { id: string; selectedVehicle?: any; paymentDetails?: any };
    QuotationView: { id: string };
    SelectModel: { returnTo?: 'QuotationForm' | 'AddQuotation'; quotationId?: string; viewMode?: boolean; viewVehicleData?: any; paymentDetails?: any } | undefined;
    SelectPrice: { vehicleId: string; vehicleData?: any; returnTo?: 'QuotationForm' | 'AddQuotation'; quotationId?: string; viewMode?: boolean; paymentDetails?: any };
    SelectPayment: { vehicleId: string; vehicleData?: any; priceDetails: any; returnTo?: 'QuotationForm' | 'AddQuotation'; quotationId?: string; viewMode?: boolean; paymentDetails?: any };
    AddQuotation: { selectedVehicle?: any };
    AdvancedFilters: undefined;
    FollowUpFilters: undefined;
    FollowUps: undefined;
    FollowUpDetail: { id: string };
    CustomerDetails: undefined;
    JobCardsList: undefined;
    BookingRegister: undefined;
};
