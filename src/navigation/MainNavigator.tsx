import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TrackerScreen from '../screens/TrackerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatsScreen from '../screens/StatsScreen';
import AIInsightsScreen from '../screens/AIInsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors, Spacing } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Tracker: '🏠',
  History: '🕐',
  Stats: '📊',
  AIInsights: '✨',
  Profile: '👤',
};

const TAB_LABELS: Record<string, string> = {
  Tracker: 'עוקב',
  History: 'היסטוריה',
  Stats: 'סטטיסטיקות',
  AIInsights: 'AI',
  Profile: 'פרופיל',
};

function FloatingTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={s.tabBarWrapper}>
      <View style={s.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const isCenter = index === 0; // Tracker is center focal

          function onPress() {
            navigation.navigate(route.name);
          }

          if (isCenter) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={s.centerBtn} activeOpacity={0.85}>
                <LinearGradient
                  colors={isFocused ? [Colors.primary, Colors.secondary] : ['#E2E8F0', '#CBD5E1']}
                  style={s.centerCircle}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={s.centerIcon}>{TAB_ICONS[route.name]}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={s.tabItem} activeOpacity={0.75}>
              <Text style={[s.tabIcon, isFocused && s.tabIconActive]}>{TAB_ICONS[route.name]}</Text>
              <View style={[s.tabIndicator, isFocused && s.tabIndicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Tracker"
    >
      {/* Order: left-right with Tracker in center */}
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Tracker" component={TrackerScreen} />
      <Tab.Screen name="AIInsights" component={AIInsightsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
  },
  tabBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 40, height: 70,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  tabIcon: { fontSize: 24, opacity: 0.45 },
  tabIconActive: { opacity: 1 },
  tabIndicator: { width: 0, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 2 },
  tabIndicatorActive: { width: 20 },
  centerBtn: { alignItems: 'center', justifyContent: 'center', marginTop: -24 },
  centerCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  centerIcon: { fontSize: 28 },
});
