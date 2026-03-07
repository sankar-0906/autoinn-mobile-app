import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  anchorRef?: React.RefObject<View>;
}

const minuteOptions = Array.from({ length: 60 }, (_, idx) => idx);
const buildHourOptions = () => Array.from({ length: 24 }, (_, idx) => idx);

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
      onSelect(timeString);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>Select Time</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Hour & Minute Columns */}
          <View style={{ flexDirection: 'row' }}>
            {/* Hours */}
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: '#f9fafb', paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: 1 }}>Hour</Text>
              </View>
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {buildHourOptions().map((hour) => (
                  <TouchableOpacity
                    key={`h-${hour}`}
                    onPress={() => setSelectedHour(hour)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f8fafc',
                      backgroundColor: selectedHour === hour ? '#f0fdfa' : 'white',
                    }}
                  >
                    <Text style={{ fontSize: 15, color: selectedHour === hour ? '#0d9488' : '#334155', fontWeight: selectedHour === hour ? 'bold' : 'normal' }}>
                      {String(hour).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ width: 1, backgroundColor: '#f1f5f9' }} />
            {/* Minutes */}
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: '#f9fafb', paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: 1 }}>Minute</Text>
              </View>
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {minuteOptions.map((minute) => (
                  <TouchableOpacity
                    key={`m-${minute}`}
                    onPress={() => setSelectedMinute(minute)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f8fafc',
                      backgroundColor: selectedMinute === minute ? '#f0fdfa' : 'white',
                    }}
                  >
                    <Text style={{ fontSize: 15, color: selectedMinute === minute ? '#0d9488' : '#334155', fontWeight: selectedMinute === minute ? 'bold' : 'normal' }}>
                      {String(minute).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Selected Preview & Confirm */}
          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fafafa', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#64748b' }}>
              {selectedHour !== null && selectedMinute !== null
                ? `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
                : 'HH:MM'}
            </Text>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={selectedHour === null || selectedMinute === null}
              style={{
                paddingHorizontal: 28,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: (selectedHour !== null && selectedMinute !== null) ? '#0d9488' : '#e2e8f0',
              }}
            >
              <Text style={{ color: (selectedHour !== null && selectedMinute !== null) ? 'white' : '#94a3b8', fontWeight: 'bold', fontSize: 14 }}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};