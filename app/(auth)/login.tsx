// app/(auth)/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter, Link, useLocalSearchParams, type Href } from "expo-router"; // <-- Added useLocalSearchParams
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FIREBASE_AUTH } from "../../constants/firebaseConfig";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { styles } from "./auth.styles";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || "light";
  const theme = Colors[colorScheme];
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>(); // <-- Hook to get the redirect path

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(FIREBASE_AUTH, email.trim(), password);

      // --- MODIFICATION: Navigate to the specified redirect path if it exists ---
      if (redirectTo) {
        const to = decodeURIComponent(redirectTo); // optional, but nice
        router.replace(to as unknown as Href);     // <-- fix
      } else {
        router.replace("/(tabs)/home");
      }
      // --- END OF MODIFICATION ---
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        message = "Invalid email or password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.message) {
        message = error.message;
      }
      Alert.alert("Login Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
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
              <Ionicons name="home-outline" size={80} color={theme.primary} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Welcome Back!</Text>
            <Text style={[styles.subtitle, { color: theme.text + "AA" }]}>
              Log in to continue.
            </Text>

            <View style={[styles.inputContainer, { borderColor: theme.text + "30" }]}>
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
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputContainer, { borderColor: theme.text + "30" }]}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={theme.text + "99"}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.text + "99"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
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

            <TouchableOpacity
              onPress={() => Alert.alert("Forgot Password", "Coming soon!")}
              disabled={isLoading}
              style={{ alignSelf: "flex-end", marginBottom: 20 }}
            >
              <Text style={{ color: theme.primary, opacity: isLoading ? 0.7 : 1 }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={[
                styles.button,
                { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.background }]}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: theme.text + "AA" }]}>
                Don't have an account?
              </Text>
              <Link href="/(auth)/signup" replace asChild>
                <TouchableOpacity disabled={isLoading}>
                  <Text style={[styles.linkActionText, { color: theme.primary, opacity: isLoading ? 0.7 : 1 }]}>
                    Sign Up
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