import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useGlobalContext } from '../context/GlobalProvider';
;

export default function ResidentPass() {
  const { user } = useGlobalContext();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Fetch user data or use context data
    setUserData(user);
  }, [user]);

  if (!userData) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Image
          style={styles.logo}
          source={{ uri: 'https://linkspace.africa/wp-content/uploads/2023/05/logo.png' }}
        /> */}
        <Text style={styles.passTitle}>Resident Wallet Pass</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>NAME</Text>
        <Text style={styles.value}>{userData.username}</Text>
        <Text style={styles.label}>USERID</Text>
        <Text style={styles.value}>{userData.id}</Text>
        <Text style={styles.label}>ADDRESS</Text>
        <Text style={styles.value}>{userData.address}</Text>
      </View>
      <View style={styles.qrContainer}>
        <QRCode
          value={JSON.stringify({
            name: userData.username,
            userId: userData.id,
            address: userData.address,
          })}
          size={150}
        />
      </View>
      <Text style={styles.providerText}>Provider: LinkSpace Ltd</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  passTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  qrContainer: {
    backgroundColor: '#E0E0E0',
    padding: 20,
    borderRadius: 10,
  },
  providerText: {
    marginTop: 20,
    fontSize: 12,
    color: '#555',
  },
});
