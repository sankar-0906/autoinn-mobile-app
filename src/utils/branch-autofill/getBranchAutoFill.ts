/**
 * getBranchAutoFill.ts
 *
 * Pure (non-React) utility for the 3-priority branch auto-fill logic used
 * across Quotation forms.
 *
 *  Priority 1 – 🎯 Nearest Branch   : GPS location via react-native-permissions
 *                                      + @react-native-community/geolocation
 *  Priority 2 – 👤 Employee Branch  : Logged-in employee's assigned branch
 *                                      (read from AsyncStorage → 'userProfile')
 *  Priority 3 – 📍 First Available  : branches[0] as a guaranteed fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BranchRecord {
    id: string;
    name: string;
    lat?: number;
    lon?: number;
}

export interface AutoFillOutcome {
    branch: BranchRecord;
    priority: 'nearest' | 'employee' | 'first';
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

function haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// GPS helpers
// ---------------------------------------------------------------------------

async function requestLocationPermission(): Promise<boolean> {
    const permission =
        Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    try {
        const status = await check(permission);
        if (status === RESULTS.GRANTED) return true;

        const result = await request(permission);
        return result === RESULTS.GRANTED;
    } catch {
        return false;
    }
}

async function getCurrentGPS(): Promise<{ latitude: number; longitude: number } | null> {
    const granted = await requestLocationPermission();
    if (!granted) {
        console.log('🚫 getBranchAutoFill – Location permission denied');
        return null;
    }

    const tryGet = (highAccuracy: boolean): Promise<{ latitude: number; longitude: number } | null> =>
        new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    console.log(
                        `📍 getBranchAutoFill – GPS obtained (highAccuracy=${highAccuracy}):`,
                        { latitude, longitude },
                    );
                    resolve({ latitude, longitude });
                },
                (err) => {
                    console.warn(
                        `❌ getBranchAutoFill – GPS failed (highAccuracy=${highAccuracy}):`,
                        err.code, err.message,
                    );
                    resolve(null);
                },
                {
                    enableHighAccuracy: highAccuracy,
                    timeout: highAccuracy ? 15000 : 10000,
                    maximumAge: 30000,
                },
            );
        });

    // Try high-accuracy (GPS chip) first
    const highResult = await tryGet(true);
    if (highResult) return highResult;

    // Fallback: network/cell-tower location (works even when GPS chip disabled)
    console.log('📶 getBranchAutoFill – Retrying with network location (low accuracy)…');
    const lowResult = await tryGet(false);
    if (lowResult) return lowResult;

    // Both failed → Location Services master toggle is likely OFF
    console.warn('📍 getBranchAutoFill – Both GPS attempts failed. Location Services may be disabled.');
    Alert.alert(
        'Location Services Off',
        'Your device location is turned off. Enable it to auto-select the nearest branch.',
        [
            { text: 'Not now', style: 'cancel' },
            {
                text: 'Open Settings',
                onPress: () => {
                    if (Platform.OS === 'android') {
                        Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
                            Linking.openSettings(),
                        );
                    } else {
                        Linking.openURL('App-Prefs:Privacy&path=LOCATION');
                    }
                },
            },
        ],
    );
    return null;
}

// ---------------------------------------------------------------------------
// Employee branch helper
// ---------------------------------------------------------------------------

async function getEmployeeBranchId(): Promise<string | null> {

    try {
        const raw = await AsyncStorage.getItem('userProfile');
        if (!raw) return null;

        const profile = JSON.parse(raw);
        const branchData = profile?.branch || profile?.profile?.branch;
        if (!branchData) return null;

        const normalize = (b: any): string | null =>
            typeof b === 'string' ? b : b?.id || b?._id || null;

        return Array.isArray(branchData)
            ? normalize(branchData[0])
            : normalize(branchData);
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Nearest-branch calculator
// ---------------------------------------------------------------------------

function findNearestBranch(
    lat: number,
    lon: number,
    branches: BranchRecord[],
): BranchRecord | null {
    let nearest: BranchRecord | null = null;
    let minDist = Infinity;

    console.log('\n====================================================');
    console.log('📍 [DEBUG] MY CURRENT GPS LOCATION');
    console.log(`   Latitude  : ${lat}`);
    console.log(`   Longitude : ${lon}`);
    console.log('====================================================');
    console.log(`🏢 [DEBUG] EVALUATING ${branches.length} BRANCH(ES):`);

    for (const b of branches) {
        if (b.lat == null || b.lon == null) {
            console.log(`   ⚠️  ${b.name} – NO lat/lon stored, skipping`);
            continue;
        }
        const d = haversineKm(lat, lon, b.lat, b.lon);
        console.log(`\n   🏬 Branch : ${b.name}`);
        console.log(`      Lat    : ${b.lat}`);
        console.log(`      Lon    : ${b.lon}`);
        console.log(`      Distance from me : ${d.toFixed(3)} km`);
        if (d < minDist) {
            minDist = d;
            nearest = b;
        }
    }

    console.log('\n----------------------------------------------------');
    if (nearest) {
        console.log(`🏆 [DEBUG] NEAREST BRANCH WINNER`);
        console.log(`   Name     : ${nearest.name}`);
        console.log(`   Distance : ${minDist.toFixed(3)} km`);
    } else {
        console.log('❌ [DEBUG] No branch with coordinates found');
    }
    console.log('====================================================\n');

    return nearest;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Resolves the best branch for a Quotation form using the 3-priority chain.
 *
 * @param branches  Full list of available branches (from BranchContext or API)
 * @returns         The selected branch + which priority was used, or null if
 *                  the list is empty.
 */
export async function getBranchAutoFill(
    branches: BranchRecord[],
): Promise<AutoFillOutcome | null> {
    if (branches.length === 0) {
        console.log('🚫 getBranchAutoFill – Branch list is empty');
        return null;
    }

    // ------------------------------------------------------------------
    // Priority 1: GPS nearest branch
    // ------------------------------------------------------------------
    console.log('\n🔵 getBranchAutoFill – [Priority 1] Requesting GPS location…');
    const gps = await getCurrentGPS();

    if (gps) {
        console.log('✅ getBranchAutoFill – GPS granted, running distance calculation…');
        const nearest = findNearestBranch(gps.latitude, gps.longitude, branches);
        if (nearest) {
            console.log(`✅ getBranchAutoFill – [Priority 1 WIN] Nearest branch: ${nearest.name}`);
            return { branch: nearest, priority: 'nearest' };
        }
    } else {
        console.log('🚫 getBranchAutoFill – GPS denied or unavailable, skipping Priority 1');
    }

    // ------------------------------------------------------------------
    // Priority 2: Employee's assigned branch
    // ------------------------------------------------------------------
    console.log('👤 getBranchAutoFill – GPS unavailable, trying employee branch (Priority 2)…');
    const empBranchId = await getEmployeeBranchId();

    if (empBranchId) {
        const empBranch = branches.find((b) => b.id === empBranchId) ?? null;
        if (empBranch) {
            console.log(`👤 getBranchAutoFill – Employee branch: ${empBranch.name}`);
            return { branch: empBranch, priority: 'employee' };
        }
    }

    // ------------------------------------------------------------------
    // Priority 3: First available branch (guaranteed fallback)
    // ------------------------------------------------------------------
    console.log('📍 getBranchAutoFill – Using first available branch (Priority 3)…');
    console.log(`📍 getBranchAutoFill – Fallback: ${branches[0].name}`);
    return { branch: branches[0], priority: 'first' };
}
