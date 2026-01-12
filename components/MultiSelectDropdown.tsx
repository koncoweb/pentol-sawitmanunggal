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
import { ChevronDown, Search, X, Check } from 'lucide-react-native';

interface DropdownItem {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  values: string[];
  items: DropdownItem[];
  onSelect: (values: string[]) => void;
  required?: boolean;
  searchable?: boolean;
}

export default function MultiSelectDropdown({
  label,
  placeholder,
  values,
  items,
  onSelect,
  required = false,
  searchable = false,
}: MultiSelectDropdownProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItems = items.filter((item) => values.includes(item.value));
  const displayText = selectedItems.length > 0
    ? selectedItems.length === 1
      ? selectedItems[0].label
      : `${selectedItems.length} dipilih`
    : placeholder;

  const filteredItems = searchable
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const handleToggle = (itemValue: string) => {
    const newValues = values.includes(itemValue)
      ? values.filter((v) => v !== itemValue)
      : [...values, itemValue];
    onSelect(newValues);
  };

  const handleClose = () => {
    setVisible(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {values.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearButton}>Hapus Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.selector, !selectedItems.length && styles.selectorPlaceholder]}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedItems.length && styles.selectorTextPlaceholder,
          ]}
        >
          {displayText}
        </Text>
        <ChevronDown size={20} color="#999" />
      </TouchableOpacity>

      {selectedItems.length > 1 && (
        <View style={styles.selectedContainer}>
          {selectedItems.map((item) => (
            <View key={item.value} style={styles.selectedChip}>
              <Text style={styles.selectedChipText}>{item.label}</Text>
              <TouchableOpacity onPress={() => handleToggle(item.value)}>
                <X size={16} color="#2d5016" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={visible} animationType="slide">
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {searchable && (
            <View style={styles.searchContainer}>
              <Search size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          )}

          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {values.length} dipilih
            </Text>
            {values.length > 0 && (
              <TouchableOpacity onPress={handleClear}>
                <Text style={styles.clearButtonModal}>Hapus Semua</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.itemList}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Tidak ada data</Text>
              </View>
            ) : (
              filteredItems.map((item) => {
                const isSelected = values.includes(item.value);
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.item,
                      isSelected && styles.itemSelected,
                    ]}
                    onPress={() => handleToggle(item.value)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        isSelected && styles.itemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Check size={20} color="#2d5016" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleClose}
            >
              <Text style={styles.doneButtonText}>Selesai</Text>
            </TouchableOpacity>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  required: {
    color: '#e53935',
  },
  clearButton: {
    fontSize: 12,
    color: '#e53935',
    fontWeight: '500',
  },
  selector: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorPlaceholder: {
    backgroundColor: '#f5f5f5',
  },
  selectorText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectorTextPlaceholder: {
    color: '#999',
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 12,
    color: '#2d5016',
    fontWeight: '500',
  },
  modalContent: {
    backgroundColor: '#fff',
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    marginTop: 8,
  },
  selectionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  clearButtonModal: {
    fontSize: 13,
    color: '#e53935',
    fontWeight: '500',
  },
  itemList: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
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
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  doneButton: {
    backgroundColor: '#2d5016',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
