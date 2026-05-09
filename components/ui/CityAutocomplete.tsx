import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle, ScrollView,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { Input } from './Input';
import { Colors } from '@/constants/colors';
import { searchCities } from '@/constants/cities';

interface CityAutocompleteProps {
  value: string;
  onSelect: (city: string) => void;
  placeholder?: string;
  label?: string;
  containerStyle?: ViewStyle;
}

export function CityAutocomplete({ value, onSelect, placeholder, label, containerStyle }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const results = searchCities(query);
  const showDropdown = open && query.length > 0 && results.length > 0;

  useEffect(() => {
    setQuery(value);
    setOpen(false);
  }, [value]);

  const handleSelect = (city: string) => {
    setQuery(city);
    onSelect(city);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelect('');
    setOpen(false);
  };

  return (
    <View style={containerStyle}>
      <Input
        label={label}
        value={query}
        onChangeText={(t) => { setQuery(t); setOpen(t.length > 0); }}
        onFocus={() => { if (query.length > 0) setOpen(true); }}
        onBlur={() => {
          // Malo odlaganje da onPress na item stigne pre zatvaranja
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder ?? 'Unesite grad'}
        leftIcon={<MapPin size={18} stroke={Colors.gray400} />}
        rightIcon={query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <X size={16} stroke={Colors.gray500} />
          </TouchableOpacity>
        ) : undefined}
      />
      {showDropdown && (
        <View style={styles.dropdown}>
          {results.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.item}
              onPress={() => handleSelect(item.name)}
              activeOpacity={0.7}
            >
              <MapPin size={14} stroke={Colors.accent} />
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemText: { color: Colors.white, fontSize: 14 },
});
