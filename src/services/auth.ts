import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const register = async (email: string, password: string, username: string) => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      createdAt: serverTimestamp(),
    });

    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);