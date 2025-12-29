import firebase from '@react-native-firebase/app';
import firebaseConfig from './firebaseConfig';

const initializeFirebase = () => {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
};

export default initializeFirebase;
