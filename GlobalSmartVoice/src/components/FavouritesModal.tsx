import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../hooks/useAppContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavourites, addFavourite, clearFavouritesError } from '../store/favouritesSlice';

interface FavouritesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FavouritesModal({ visible, onClose }: FavouritesModalProps) {
  const { theme } = useApp();
  const dispatch = useAppDispatch();
  const clientId = useAppSelector((s) => s.auth.user?.id);
  const { items, loading, addPending, error } = useAppSelector((s) => s.favourites);

  const [nickname, setNickname] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (visible && clientId) dispatch(fetchFavourites(clientId));
  }, [visible, clientId, dispatch]);

  const handleAdd = () => {
    if (!clientId || !nickname.trim() || !accountNumber.trim()) return;
    dispatch(clearFavouritesError());
    dispatch(addFavourite({ clientId, nickname: nickname.trim(), accountNumber: accountNumber.trim() })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setNickname('');
        setAccountNumber('');
      }
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.ink }]}>Favourite Accounts</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.ink} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={theme.cta} style={{ marginTop: 20 }} />
            ) : (
              <Text style={[styles.empty, { color: theme.muted }]}>
                No favourite accounts yet. Add one below to start sending money.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <View style={[styles.avatar, { backgroundColor: theme.tile }]}>
                <Text style={[styles.avatarText, { color: theme.ink }]}>{item.nickname.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nickname, { color: theme.ink }]}>{item.nickname}</Text>
                <Text style={[styles.accountNumber, { color: theme.muted }]}>{item.accountNumber}</Text>
              </View>
            </View>
          )}
        />

        <View style={[styles.form, { borderTopColor: theme.line, backgroundColor: theme.surface }]}>
          <Text style={[styles.formTitle, { color: theme.ink }]}>Add a favourite</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.line, color: theme.ink }]}
            placeholder="Nickname (e.g. Sanket dai)"
            placeholderTextColor={theme.muted}
            value={nickname}
            onChangeText={setNickname}
            editable={!addPending}
          />
          <TextInput
            style={[styles.input, { borderColor: theme.line, color: theme.ink }]}
            placeholder="Account number"
            placeholderTextColor={theme.muted}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            editable={!addPending}
          />
          {error ? <Text style={[styles.error, { color: theme.red }]}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.cta }, addPending && { opacity: 0.7 }]}
            onPress={handleAdd}
            disabled={addPending || !nickname.trim() || !accountNumber.trim()}
            activeOpacity={0.85}
          >
            {addPending ? (
              <ActivityIndicator color={theme.ctaInk} />
            ) : (
              <Text style={[styles.addBtnText, { color: theme.ctaInk }]}>Add favourite</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 19, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 12, flexGrow: 1 },
  empty: { textAlign: 'center', fontSize: 13.5, marginTop: 30, lineHeight: 19 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  nickname: { fontSize: 15, fontWeight: '600' },
  accountNumber: { fontSize: 12.5, marginTop: 2 },
  form: { padding: 20, borderTopWidth: 1, gap: 10 },
  formTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  input: { height: 48, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
  error: { fontSize: 12.5, fontWeight: '600' },
  addBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  addBtnText: { fontSize: 15, fontWeight: '700' },
});
