# AutoCloud Mobile Application

A comprehensive React Native mobile application for automotive dealership management, built with Expo and TypeScript. This app serves as a mobile companion to the AutoCloud web platform, providing sales executives and staff with on-the-go access to customer management, quotations, bookings, and vehicle inventory.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login system with token-based authentication
- **Customer Management**: Complete customer lifecycle management with contact details, follow-ups, and activity tracking
- **Quotation System**: Create, manage, and track vehicle quotations with advanced filtering
- **Booking Management**: Handle vehicle bookings with OTP verification and authorization workflows
- **Vehicle Selection**: Interactive vehicle model, color, and pricing selection with real-time inventory
- **Follow-up System**: Comprehensive activity tracking for calls, bookings, and customer interactions
- **File Management**: Document uploads for insurance, vehicle papers, and customer documents

### Advanced Features
- **Real-time API Integration**: Seamless connectivity with AutoCloud backend services
- **Multi-media Support**: Image capture, document picker, and file uploads
- **QR Code Generation**: Generate QR codes for job orders and bookings
- **PDF Generation**: Create and share quotation and booking PDFs
- **Insurance Management**: Upload and parse insurance documents with automated data extraction
- **Cloud Telephony**: Integrated calling system with call tracking
- **GPS & Location**: Location-based services for branch operations

## 📱 Technology Stack

### Frontend Framework
- **React Native** (0.81.5) - Cross-platform mobile development
- **Expo** (~54.0.33) - Development platform and tooling
- **TypeScript** (~5.9.2) - Type-safe development

### Navigation & UI
- **React Navigation** (v7) - Stack and Tab navigation
- **NativeWind** (^4.2.2) - Tailwind CSS for React Native
- **TailwindCSS** (3.4.1) - Utility-first CSS framework
- **Lucide React Native** (^0.575.0) - Icon library

### State Management & Data
- **Axios** (^1.13.5) - HTTP client with interceptors
- **Async Storage** (^2.2.0) - Local data persistence
- **React Native Reanimated** (~4.1.1) - Smooth animations

### Device APIs & Media
- **Expo Image Picker** (~17.0.0) - Camera and photo library access
- **Expo Document Picker** (~14.0.8) - File selection
- **Expo File System** (~19.0.21) - File operations
- **Expo Media Library** (~18.0.0) - Media management
- **React Native Image Picker** (^8.2.1) - Advanced image capture

### Additional Libraries
- **React Native Calendars** (^1.1300.0) - Date selection and scheduling
- **React Native QR Code SVG** (^6.3.21) - QR code generation
- **React Native Share** (^12.2.5) - Social sharing functionality
- **QRCode** (^1.5.4) - QR code utilities
- **React Native Permissions** (^5.5.1) - Permission management

## 🏗️ Project Structure

```
autocloud-mobile-app/
├── App.tsx                     # Main application entry point
├── package.json               # Dependencies and scripts
├── app.json                   # Expo configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── global.css                 # Global styles
│
├── components/                # Reusable UI components
│   ├── AccessoryModal.tsx     # Vehicle accessory selection
│   ├── AssociatedQuotations.tsx # Quotation management
│   ├── AttachQuotationModal.tsx # Quotation attachment
│   ├── AuthenticationData.tsx # Auth components
│   ├── BulkInsuranceUpload.tsx # Insurance batch processing
│   ├── FileUpload.tsx         # File upload component
│   ├── TimePickerModal.tsx    # Time selection
│   ├── customer/              # Customer-specific components
│   └── ui/                    # General UI components
│
├── screens/                   # Application screens
│   ├── auth/                  # Authentication screens
│   │   └── LoginScreen.tsx
│   ├── account/               # User account management
│   │   └── AccountScreen.tsx
│   ├── booking/               # Booking management
│   │   ├── BookingRegisterScreen.tsx
│   │   └── AdvancedBookingScreen.tsx
│   ├── customer/              # Customer management
│   │   ├── CustomerDetailsScreen.tsx
│   │   ├── VehicleDetailsScreen.tsx
│   │   └── ConfirmBookingScreen.tsx
│   ├── quotation/             # Quotation system
│   │   ├── QuotationsListScreen.tsx
│   │   ├── QuotationDetailsScreen.tsx
│   │   ├── AddQuotationScreen.tsx
│   │   ├── QuotationFormScreen.tsx
│   │   └── QuotationViewScreen.tsx
│   ├── follow-ups/            # Activity tracking
│   │   ├── FollowUpsScreen.tsx
│   │   ├── FollowUpDetailScreen.tsx
│   │   ├── BookingActivityScreen.tsx
│   │   ├── CallActivityScreen.tsx
│   │   └── WalkInActivityScreen.tsx
│   ├── vehicle-selection/     # Vehicle configuration
│   │   ├── SelectModelScreen.tsx
│   │   ├── SelectPriceScreen.tsx
│   │   ├── SelectPaymentScreen.tsx
│   │   ├── ColorSelectionScreen.tsx
│   │   └── SelectVehicleForBookingScreen.tsx
│   └── job-cards/             # Job order management
│       └── JobCardsListScreen.tsx
│
├── navigation/                # Navigation configuration
│   ├── AppNavigator.tsx       # Main stack navigator
│   ├── TabNavigator.tsx       # Bottom tab navigation
│   └── types.ts               # Navigation type definitions
│
├── src/                       # Core application logic
│   ├── api.ts                 # API service layer
│   └── ToastContext.tsx       # Global toast notifications
│
├── constants/                 # Application constants
│   └── colors.ts              # Color scheme definitions
│
├── assets/                    # Static assets
│   ├── icon.png               # App icon
│   ├── splash-icon.png        # Splash screen
│   ├── adaptive-icon.png      # Android adaptive icon
│   └── favicon.png            # Web favicon
│
└── .env.dev                   # Environment variables
```

## 🔧 Configuration

### Environment Variables
Create a `.env.dev` file with:
```env
EXPO_PUBLIC_ENDPOINT=https://your-api-endpoint.com
```

### Key Configuration Files
- **app.json**: Expo app configuration, permissions, and platform settings
- **package.json**: Dependencies and npm scripts
- **tsconfig.json**: TypeScript compiler options
- **tailwind.config.js**: Tailwind CSS customization
- **babel.config.js**: Babel transpilation configuration

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd autocloud-mobile-app

# Install dependencies
npm install

# Start development server
npm start
```

### Development Scripts
```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
```

## 🔌 API Integration

The app integrates with a comprehensive REST API providing:

### Authentication Endpoints
- `POST /api/user/login` - User authentication
- `GET /api/user/currentUser` - Current user details
- `GET /api/user/count` - User statistics

### Customer Management
- `GET /api/customer/{id}` - Customer details
- `POST /api/customer` - Create customer
- `PUT /api/customer/{id}` - Update customer
- `GET /api/customer/phone-no/{phone}` - Search by phone

### Quotation System
- `POST /api/quotation/get` - List quotations
- `GET /api/quotation/{id}` - Quotation details
- `POST /api/quotation` - Create quotation
- `PUT /api/quotation/updateStatus/{id}` - Update status

### Booking Management
- `POST /api/booking/create` - Create booking
- `GET /api/booking/{id}` - Booking details
- `POST /api/booking/authorise` - Authorize booking
- `POST /api/sendSms/sendOtp` - Send OTP verification

### Vehicle Operations
- `GET /api/vehicleMaster` - Vehicle inventory
- `GET /api/manufacturer` - Vehicle manufacturers
- `GET /api/vehicle/{id}` - Vehicle details
- `POST /api/vehicle/checkRegisterNo` - Validate registration

## 📱 Platform Support

### iOS
- **Minimum Version**: iOS 12.0+
- **Bundle ID**: com.sankar-sr.autocloudmobileapp
- **Permissions**: Camera, Photo Library, Photo Library Add

### Android
- **Minimum SDK**: API 21 (Android 5.0)
- **Package**: com.sankar_sr.autocloudmobileapp
- **Permissions**: Camera, Storage, Media Access

### Web
- **Browser Support**: Modern browsers with ES6 support
- **Progressive Web App**: Enabled

## 🔐 Security Features

- **Token-based Authentication**: JWT tokens with automatic refresh
- **Secure Storage**: Encrypted AsyncStorage for sensitive data
- **API Interceptors**: Request/response interceptors for security headers
- **Permission Management**: Granular permission requests
- **Input Validation**: Client-side validation for all forms
- **HTTPS Only**: Secure API communication

## 🎨 UI/UX Features

- **Material Design**: Modern, intuitive interface
- **Dark/Light Mode**: Theme support (configured for light mode)
- **Responsive Design**: Optimized for various screen sizes
- **Smooth Animations**: React Native Reanimated for fluid transitions
- **Accessibility**: Screen reader support and semantic markup
- **Gesture Handling**: Swipe, tap, and long-press interactions

## 📊 Key Features Deep Dive

### Quotation Management
- Advanced filtering by date, status, customer, and vehicle
- Bulk operations for quotation management
- PDF generation and sharing capabilities
- Real-time status updates
- Attachment support for documents

### Customer Relationship Management
- 360-degree customer view with all interactions
- Activity timeline and follow-up scheduling
- Document management and file attachments
- Communication history and call tracking
- Merge duplicate customer records

### Vehicle Inventory
- Real-time stock availability
- Advanced search and filtering
- Image galleries and specifications
- Pricing and financing options
- Color and variant selection

### Booking System
- OTP-based verification
- Multi-level authorization workflow
- E-receipt generation
- Status tracking and notifications
- Integration with payment systems

## 🔧 Development Best Practices

- **TypeScript**: Full type safety across the application
- **Component Architecture**: Modular, reusable components
- **State Management**: Local state with Context API for global state
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: Optimized rendering and memory management
- **Testing**: Component testing and integration testing
- **Code Quality**: ESLint and Prettier for consistent code style

## 📈 Performance Optimizations

- **Lazy Loading**: Screen-level code splitting
- **Image Optimization**: Efficient image loading and caching
- **API Caching**: Response caching for frequently accessed data
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Memory Management**: Proper cleanup and garbage collection

## 🚀 Deployment

### Expo Application Services (EAS)
- **Build**: Automated builds for iOS and Android
- **Submit**: Direct store submission
- **Updates**: Over-the-air updates for instant fixes
- **Analytics**: Usage and performance metrics

### Build Configuration
```bash
# Build for production
eas build --platform all

# Preview build
eas build --profile preview

# Submit to stores
eas submit --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is proprietary software for AutoCloud internal use.

## 📞 Support

For technical support and queries:
- **Development Team**: [Contact Information]
- **Documentation**: [Internal Wiki]
- **Issue Tracking**: [Project Management Tool]

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Platform**: React Native with Expo  
**Target**: iOS, Android, Web
