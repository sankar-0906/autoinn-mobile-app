import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { Edit, Download, Trash2, Phone, Calendar, User, Share2, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import type { JobCardRecord } from '../../types/job-cards';
import moment from 'moment';
import { deleteJobCard } from '../../src/api/job-cards/jobCardApi';
import { savePDFToDevice, sharePDF } from '../../src/utils/pdfDownloadUtils';
import { useToast } from '../../src/ToastContext';

interface JobCardItemProps {
    item: JobCardRecord;
    onPress: (id: string) => void;
    onEdit?: (item: JobCardRecord) => void;
    onDelete?: (id: string) => void;
}

/** Maps jobStatus → progress step (0 = Pending, 1 = In Progress, 2 = Completed) */
const getProgress = (status: string): number => {
    const pending = ['Vehicle Received', 'Estimation', 'Estimation Approved'];
    const inProgress = ['Mechanic Allocated', 'Spares Ordered', 'Material Issued', 'Work In Progress', 'Final Inspection'];
    if (pending.includes(status)) return 0;
    if (inProgress.includes(status)) return 50;
    return 100;
};

const StatusDot = ({ filled }: { filled: boolean }) => (
    <View className={`w-3 h-3 rounded-full ${filled ? 'bg-teal-600' : 'bg-gray-300'}`} />
);

import { useRoleBasedAccess } from '../../src/hooks/useRoleBasedAccess';
import { MOBILE_MODULES } from '../../src/constants/modules';

export const JobCardItem: React.FC<JobCardItemProps> = ({ item, onPress, onEdit, onDelete }) => {
    const { canUpdate, canDelete, canPrint } = useRoleBasedAccess();
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const toast = useToast();

    const progress = getProgress(item.jobStatus);
    const dateStr = item.createdAt
        ? moment(item.createdAt).format('DD-MM-YYYY')
        : '-';
    const timeStr = item.createdAt
        ? moment(item.createdAt).format('hh:mm A')
        : '-';

    const handleDelete = () => {
        Alert.alert(
            'Delete Job Card',
            `Are you sure you want to delete ${item.jobNo}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteJobCard(item.id);
                            onDelete?.(item.id);
                        } catch {
                            Alert.alert('Error', 'Failed to delete job card.');
                        }
                    },
                },
            ]
        );
    };

    const handleDownloadPDF = () => {
        if (!canPrint(MOBILE_MODULES.JOB_CARDS)) {
            toast.error("You don't have permission to print/download job cards.");
            return;
        }
        setShowDownloadModal(true);
    };

    const handleSaveToDevice = async () => {
        setPdfDownloading(true);
        setShowDownloadModal(false);

        await savePDFToDevice({
            id: item.id,
            documentId: item.jobNo,
            documentType: 'Job Card',
            apiEndpoint: 'jobOrder',
            onSuccess: (message) => toast.success(message),
            onError: (message) => toast.error(message),
        });

        setPdfDownloading(false);
    };

    const handleSharePDF = async () => {
        setPdfDownloading(true);
        setShowDownloadModal(false);

        await sharePDF({
            id: item.id,
            documentId: item.jobNo,
            documentType: 'Job Card',
            apiEndpoint: 'jobOrder',
            onSuccess: (message) => toast.success(message),
            onError: (message) => toast.error(message),
        });

        setPdfDownloading(false);
    };

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onPress(item.id)}
                className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-3 mx-4 shadow-sm"
            >
                {/* Job No + Reg No */}
                <View className="flex-row items-start">
                    <View className="flex-1 pr-3">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-teal-600 font-bold text-base">{item.jobNo}</Text>
                            <View className="items-end">
                                <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Reg. No</Text>
                                <Text className="text-gray-900 font-bold text-sm">{item.vehicle?.registerNo || '-'}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center mt-2">
                            <User size={14} color={COLORS.gray[600]} />
                            <Text className="text-gray-700 ml-1.5 font-medium" numberOfLines={1}>
                                {item.customer?.name || '-'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="h-[1px] bg-gray-100 my-3" />

                {/* Details */}
                <View className="space-y-1">
                    <View className="flex-row items-start py-0.5">
                        <Text className="text-gray-500 text-xs">Model</Text>
                        <Text className="text-gray-900 text-xs font-semibold flex-1 text-right ml-4">
                            {item.vehicle?.vehicle?.modelName || '-'}
                        </Text>
                    </View>
                    <View className="flex-row items-center py-0.5">
                        <Text className="text-gray-500 text-xs">Service Type</Text>
                        <Text className="text-gray-900 text-xs font-semibold flex-1 text-right ml-4">
                            {item.serviceType || '-'}
                        </Text>
                    </View>
                    <View className="flex-row items-center py-0.5">
                        <Text className="text-gray-500 text-xs">Mechanic / Supervisor</Text>
                        <Text className="text-gray-900 text-xs font-medium flex-1 text-right ml-4">
                            {item.mechanic?.profile?.employeeName || '-'} / {item.supervisor?.name || '-'}
                        </Text>
                    </View>
                    <View className="flex-row items-center py-0.5">
                        <Text className="text-gray-500 text-xs">Service No. / KMs</Text>
                        <Text className="text-gray-900 text-xs font-medium flex-1 text-right ml-4">
                            {item.serviceNo || '-'} / {item.kms ?? '-'} km
                        </Text>
                    </View>
                    {item.vehicle?.batteryNo ? (
                        <View className="flex-row items-center py-0.5">
                            <Text className="text-gray-500 text-xs">Battery No</Text>
                            <Text className="text-gray-900 text-xs font-medium flex-1 text-right ml-4">
                                {item.vehicle.batteryNo}
                            </Text>
                        </View>
                    ) : null}
                    {/* Insurance expiry warning */}
                    {item.vehicle?.insuranceExpiryDate && (() => {
                        const expiryDate = moment(item.vehicle.insuranceExpiryDate);
                        const daysLeft = expiryDate.diff(moment(), 'days');
                        const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
                        return (
                            <View className="flex-row items-center py-0.5">
                                <Text className={`text-xs ${isExpiringSoon ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                    Insurance Renewal On
                                </Text>
                                <Text className={`text-xs font-medium flex-1 text-right ml-4 ${isExpiringSoon ? 'text-red-500 font-bold' : 'text-gray-900'}`}>
                                    {expiryDate.format('DD-MM-YYYY')}
                                    {isExpiringSoon ? ` (${daysLeft}d)` : ''}
                                </Text>
                            </View>
                        );
                    })()}
                    <View className="flex-row items-center py-0.5">
                        <View className="flex-row items-center">
                            <Calendar size={12} color={COLORS.gray[400]} />
                            <Text className="text-gray-500 text-xs ml-1">Date / Time</Text>
                        </View>
                        <Text className="text-gray-900 text-xs font-medium flex-1 text-right ml-4">
                            {dateStr} | {timeStr}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View className="mt-4 pt-4 border-t border-gray-100">
                    <View className="flex-row items-center justify-center">
                        <View className="items-center">
                            <StatusDot filled={progress >= 0} />
                            <Text className="text-[10px] text-gray-500 mt-1">Pending</Text>
                        </View>
                        <View className={`h-0.5 w-12 mb-4 ${progress >= 50 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                        <View className="items-center">
                            <StatusDot filled={progress >= 50} />
                            <Text className="text-[10px] text-gray-500 mt-1 text-center">In Progress</Text>
                        </View>
                        <View className={`h-0.5 w-12 mb-4 ${progress >= 100 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                        <View className="items-center">
                            <StatusDot filled={progress >= 100} />
                            <Text className="text-[10px] text-gray-500 mt-1">Completed</Text>
                        </View>
                    </View>
                </View>

                {/* Actions Row — Status badge LEFT, Action icons RIGHT */}
                <View className="flex-row gap-2 mt-4 pt-3 border-t border-gray-100 items-center justify-between">
                    <View className="bg-teal-50 px-3 py-1 rounded-full">
                        <Text className="text-teal-700 text-[10px] font-bold uppercase">{item.jobStatus}</Text>
                    </View>

                    <View className="flex-row gap-4">
                        {canUpdate(MOBILE_MODULES.JOB_CARDS) && (
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onEdit?.(item); }}>
                                <Edit size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                        {canPrint(MOBILE_MODULES.JOB_CARDS) && (
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDownloadPDF(); }} disabled={pdfDownloading}>
                                <Download size={18} color={pdfDownloading ? '#93c5fd' : COLORS.primary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); /* call customer */ }}>
                            <Phone size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        {canDelete(MOBILE_MODULES.JOB_CARDS) && (
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(); }}>
                                <Trash2 size={18} color={COLORS.red?.[600] || '#DC2626'} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            {/* PDF Download Options Modal ──────────────────────────────── */}
            <Modal
                visible={showDownloadModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDownloadModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowDownloadModal(false)}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
                >
                    <TouchableOpacity activeOpacity={1}>
                        <View style={{
                            backgroundColor: '#fff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            paddingTop: 12,
                            paddingBottom: 36,
                            paddingHorizontal: 20,
                        }}>
                            {/* Handle bar */}
                            <View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
                                Download Job Card PDF
                            </Text>
                            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                                {item.jobNo}
                            </Text>

                            {/* Save to Device */}
                            <TouchableOpacity
                                onPress={handleSaveToDevice}
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: '#eff6ff', borderRadius: 14,
                                    padding: 16, marginBottom: 12,
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Download size={22} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e40af' }}>Save to Device</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Download PDF to your phone's storage</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Share — Google Drive / email / etc. */}
                            <TouchableOpacity
                                onPress={handleSharePDF}
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: '#f0fdf4', borderRadius: 14,
                                    padding: 16, marginBottom: 12,
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Share2 size={22} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#15803d' }}>Share / Save to Drive</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Google Drive, email, WhatsApp, and more</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Cancel */}
                            <TouchableOpacity
                                onPress={() => setShowDownloadModal(false)}
                                style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4 }}
                            >
                                <Text style={{ fontSize: 15, color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
};
