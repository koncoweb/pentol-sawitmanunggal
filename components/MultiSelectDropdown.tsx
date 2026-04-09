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
import { useTranslation } from 'react-i18next';

interface DropdownItem {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  value: string[];
  items: DropdownItem[];
  onSelect: (value: string[]) => void;
  required?: boolean;
  searchable?: boolean;
}

export default function MultiSelectDropdown({
  label,
  placeholder,
  value = [],
  items,
  onSelect,
  required = false,
  searchable = false,
}: MultiSelectDropdownProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItems = items.filter((item) => value.includes(item.value));
  
  const getDisplayText = () => {
    if (selectedItems.length === 0) return placeholder;
    if (selectedItems.length === 1) return selectedItems[0].label;
    return `${selectedItems.length} item dipilih`;
  };

  const filteredItems = searchable
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  const handleToggle = (itemValue: string) => {
    const newValue = value.includes(itemValue)
      ? value.filter((v) => v !== itemValue)
      : [...value, itemValue];
    onSelect(newValue);
  };

  const handleClose = () => {
    setVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.selector, selectedItems.length === 0 && styles.selectorPlaceholder]}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            selectedItems.length === 0 && styles.selectorTextPlaceholder,
          ]}
        >
          {getDisplayText()}
        </Text>
        <ChevronDown size={20} color="#999" />
      </TouchableOpacity>

      {/* Selected chips preview */}
      {selectedItems.length > 0 && (
        <View style={styles.chipsContainer}>
          {selectedItems.map((item) => (
            <View key={item.value} style={styles.chip}>
              <Text style={styles.chipText}>{item.label}</Text>
              <TouchableOpacity onPress={() => handleToggle(item.value)}>
                <X size={14} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={visible} animationType="slide">
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.doneText}>Selesai</Text>
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
              />
            </View>
          )}

          <ScrollView style={styles.itemsList}>
            {filteredItems.map((item) => {
              const isSelected = value.includes(item.value);
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
                  {isSelected && <Check size={20} color="#2d5016" />}
                </TouchableOpacity>
              );
            })}
            {filteredItems.length === 0 && (
              <Text style={styles.noItemsText}>{t('dropdown.noData')}</Text>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
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
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  required: {
    color: '#d32f2f',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorPlaceholder: {
    borderColor: '#ddd',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  selectorTextPlaceholder: {
    color: '#999',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    color: '#2d5016',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  doneText: {
    color: '#2d5016',
    fontWeight: '600',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  itemsList: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemSelected: {
    backgroundColor: '#f9fbe7',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  itemTextSelected: {
    color: '#2d5016',
    fontWeight: '500',
  },
  noItemsText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});
