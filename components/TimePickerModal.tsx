import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from './ui/Button';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  anchorRef: React.RefObject<View>;
}

const minuteOptions = [0, 15, 30, 45];
const buildHourOptions = () => Array.from({ length: 24 }, (_, idx) => idx);

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  anchorRef,
}) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [layout, setLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (visible && anchorRef.current) {
      anchorRef.current.measureInWindow((x, y, width, height) => {
        setLayout({ x, y, width, height });
      });
    }
  }, [visible, anchorRef]);

  const handleConfirm = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
      onSelect(timeString);
      onClose();
    }
  };

  if (!layout) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        <View
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: layout.y + layout.height + 8,
            backgroundColor: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 15,
          }}
        >
          <View style={{ flexDirection: 'row' }}>
            {/* Hours */}
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: '#f9fafb', paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Hour</Text>
              </View>
              <ScrollView style={{ maxHeight: 220 }}>
                {buildHourOptions().map((hour) => (
                  <TouchableOpacity
                    key={`h-${hour}`}
                    onPress={() => setSelectedHour(hour)}
                    style={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f8fafc', backgroundColor: selectedHour === hour ? '#f0fdfa' : 'white' }}
                  >
                    <Text style={{ fontSize: 14, color: selectedHour === hour ? '#0d9488' : '#334155', fontWeight: selectedHour === hour ? 'bold' : 'normal' }}>
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
                <Text style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Minute</Text>
              </View>
              <ScrollView style={{ maxHeight: 220 }}>
                {minuteOptions.map((minute) => (
                  <TouchableOpacity
                    key={`m-${minute}`}
                    onPress={() => setSelectedMinute(minute)}
                    style={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f8fafc', backgroundColor: selectedMinute === minute ? '#f0fdfa' : 'white' }}
                  >
                    <Text style={{ fontSize: 14, color: selectedMinute === minute ? '#0d9488' : '#334155', fontWeight: selectedMinute === minute ? 'bold' : 'normal' }}>
                      {String(minute).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          {/* Confirm button */}
          <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: 'white', alignItems: 'flex-end' }}>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={selectedHour === null || selectedMinute === null}
              style={{ paddingHorizontal: 32, paddingVertical: 10, borderRadius: 12, backgroundColor: (selectedHour !== null && selectedMinute !== null) ? '#0d9488' : '#e2e8f0' }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};