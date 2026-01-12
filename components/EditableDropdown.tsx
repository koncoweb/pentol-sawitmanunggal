import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

interface DropdownItem {
  label: string;
  value: string;
}

interface EditableDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  items: DropdownItem[];
  onChangeText: (value: string) => void;
  required?: boolean;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
}

export default function EditableDropdown({
  label,
  placeholder,
  value,
  items,
  onChangeText,
  required = false,
  keyboardType = 'default',
}: EditableDropdownProps) {
  const [visible, setVisible] = useState(false);

  const handleSelect = (itemValue: string) => {
    onChangeText(itemValue);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
        {items.length > 0 && (
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setVisible(true)}
          >
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.itemList}>
              {items.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Tidak ada data</Text>
                </View>
              ) : (
                items.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.item,
                      item.value === value && styles.itemSelected,
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        item.value === value && styles.itemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e53935',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
    color: '#333',
  },
  dropdownButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  itemList: {
    flex: 1,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemSelected: {
    backgroundColor: '#e8f5e9',
  },
  itemText: {
    fontSize: 15,
    color: '#333',
  },
  itemTextSelected: {
    color: '#2d5016',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
