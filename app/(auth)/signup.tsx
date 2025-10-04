// app/(auth)/signup.tsx

import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { FIREBASE_AUTH } from "../../constants/firebaseConfig";
import { useColorScheme } from "../../hooks/useColorScheme";
import { styles } from "./auth.styles";

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        email.trim(),
        password
      );
      await updateProfile(userCred.user, { displayName: name.trim() });
      router.replace("/"); 
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "This email address is already registered. Please try logging in.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert("Signup Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Ionicons
                name="person-add-outline"
                size={80}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.text + "AA" }]}>
              Join us and start finding your perfect room.
            </Text>

            {/* Full Name */}
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: theme.text + "30",
                  backgroundColor:
                    theme.background + (colorScheme === "light" ? "" : "1A"),
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={theme.text + "99"}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Full Name"
                placeholderTextColor={theme.text + "99"}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
                editable={!isLoading}
              />
            </View>

            {/* Email */}
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: theme.text + "30",
                  backgroundColor:
                    theme.background + (colorScheme === "light" ? "" : "1A"),
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={22}
                color={theme.text + "99"}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email Address"
                placeholderTextColor={theme.text + "99"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                editable={!isLoading}
              />
            </View>

            {/* Password */}
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: theme.text + "30",
                  backgroundColor:
                    theme.background + (colorScheme === "light" ? "" : "1A"),
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.text + "99"}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password (min. 6 characters)"
                placeholderTextColor={theme.text + "99"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                textContentType="newPassword"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible((v) => !v)}
                style={{ padding: 5 }}
                disabled={isLoading}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.text + "99"}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: theme.text + "30",
                  backgroundColor:
                    theme.background + (colorScheme === "light" ? "" : "1A"),
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.text + "99"}
                style={styles.inputIcon}
              />
              {/* --- ✅ FIXED: Using the correct state for Confirm Password --- */}
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.text + "99"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmVisible}
                textContentType="newPassword"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setIsConfirmVisible((v) => !v)}
                style={{ padding: 5 }}
                disabled={isLoading}
              >
                <Ionicons
                  name={isConfirmVisible ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.text + "99"}
                />
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              disabled={isLoading}
              style={[
                styles.button,
                {
                  backgroundColor: theme.primary,
                  marginTop: 20,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleSignup}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.background }]}>
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: theme.text + "AA" }]}>
                Already have an account?
              </Text>
              <Link href="/(auth)/login" replace asChild>
                <TouchableOpacity disabled={isLoading}>
                  <Text
                    style={[
                      styles.linkActionText,
                      { color: theme.primary, opacity: isLoading ? 0.7 : 1 },
                    ]}
                  >
                    Login
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
