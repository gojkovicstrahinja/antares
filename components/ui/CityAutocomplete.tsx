import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import { MapPin, X, TrendingUp } from 'lucide-react-native';
import { Input } from './Input';
import { Colors } from '@/constants/colors';
import { searchCities } from '@/constants/cities';

const POPULAR = ['Beograd', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Čačak'];

interface CityAutocompleteProps {
  value: string;
  onSelect: (city: string) => void;
  placeholder?: string;
  label?: string;
  containerStyle?: ViewStyle;
}

export function CityAutocomplete({ value, onSelect, placeholder, label, containerStyle }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);

  const results = searchCities(query);
  const showSuggestions = focused && query.length === 0;
  const showResults = focused && query.length > 0 && results.length > 0;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSelect = (city: string) => {
    setQuery(city);
    onSelect(city);
    setFocused(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelect('');
  };

  return (
    <View style={containerStyle}>
      <Input
        label={label}
        value={query}
        onChangeText={setQuery}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder ?? 'Unesite grad'}
        leftIcon={<MapPin size={18} stroke={Colors.gray400} />}
        rightIcon={query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <X size={16} stroke={Colors.gray500} />
          </TouchableOpacity>
        ) : undefined}
      />

      {showSuggestions && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <TrendingUp size={13} stroke={Colors.gray500} />
            <Text style={styles.dropdownHeaderText}>Popularni gradovi</Text>
          </View>
          {POPULAR.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.item}
              onPress={() => handleSelect(city)}
              activeOpacity={0.7}
            >
              <MapPin size={14} stroke={Colors.accent} />
              <Text style={styles.itemText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showResults && (
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
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownHeaderText: {
    color: Colors.gray500,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
