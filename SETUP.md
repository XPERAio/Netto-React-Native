# Netto React Native – Setup Guide

## Prerequisites
- Node.js 18+
- React Native CLI (`npm install -g react-native-cli`)
- Xcode 15+ (for iOS) / Android Studio (for Android)
- CocoaPods (`brew install cocoapods`)

## 1. Install dependencies
```bash
cd "Netto-React-Native"
npm install
cd ios && pod install && cd ..
```

## 2. Firebase configuration
1. Go to your Firebase console → Project Settings → Add App → iOS/Android
2. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
3. Place them in `ios/` and `android/app/` respectively
4. Open `src/services/FirebaseService.ts` and replace `FIREBASE_CONFIG` with your actual credentials

## 3. Google Gemini API key (AI Insights)
- Open `src/screens/AIInsightsScreen.tsx`
- Replace `'YOUR_GEMINI_API_KEY'` with your actual Gemini API key

## 4. Run
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## Project Structure
```
src/
├── models/
│   └── types.ts          – All TypeScript types, enums, constants
├── services/
│   ├── SalaryCalculator.ts – Full Israeli labor law calculations
│   └── FirebaseService.ts  – Auth + Firestore CRUD
├── store/
│   └── useAppStore.ts     – Zustand global state
├── screens/
│   ├── OnboardingScreen.tsx
│   ├── TrackerScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── StatsScreen.tsx
│   ├── AIInsightsScreen.tsx
│   └── ProfileScreen.tsx
├── components/
│   ├── ManualShiftModal.tsx
│   ├── ManualPaymentModal.tsx
│   └── MonthYearPicker.tsx
├── navigation/
│   └── MainNavigator.tsx  – Bottom tab bar (floating glass style)
└── utils/
    ├── theme.ts            – Colors, spacing, typography
    └── israeliHolidays.ts  – 2025 Israeli holidays

App.tsx                    – Entry point
```

## Key Differences from Swift Version
| Feature | Swift | React Native |
|---|---|---|
| Local storage | SwiftData | Zustand + AsyncStorage |
| Database | Firestore (same) | Firestore (same) |
| State | @State / @Published | Zustand store |
| Navigation | TabView | React Navigation |
| RTL | .rightToLeft env | I18nManager.forceRTL |
| In-App Purchases | StoreKit 2 | react-native-iap (add separately) |
| PDF Export | PDFKit | react-native-pdf-lib (add separately) |

## In-App Purchases (optional)
Install `react-native-iap` and configure your product IDs in a new `SubscriptionScreen.tsx`.

## Extending
- **PDF Export**: Add `react-native-pdf-lib` and port `PDFCreator.swift` logic
- **CSV Export**: Implement in TypeScript using the `calculateShift` function already ported
- **Worker Settings**: Add a `WorkerSettingsScreen` for advanced sector/grade config
