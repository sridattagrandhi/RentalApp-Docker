import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // Center content vertically
  },
  container: { // Main content container within ScrollView
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: { // Placeholder for your app logo
    width: 100,
    height: 100,
    resizeMode: 'contain',
    // Add your logo styles if you have one
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold', // Or a specific font weight like '700'
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    // color will be themed (muted)
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    // color will be themed
  },
  button: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    // backgroundColor will be themed (primary)
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    // color will be themed (e.g., white)
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  linkText: {
    fontSize: 15,
    // color will be themed (muted)
  },
  linkActionText: {
    fontSize: 15,
    fontWeight: 'bold',
    // color will be themed (primary or accent)
    marginLeft: 5,
  },
  forgotPasswordText: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: -10, // Pull it up slightly below the password input
    marginBottom: 20,
    // color will be themed (primary or accent)
  },
  // Optional: Styles for social login buttons
  socialLoginContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    // borderColor will be themed
    marginBottom: 15,
    width: '100%', // Or a fixed width
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: 15,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    // color will be themed
  },
  orText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
    // color will be themed (muted)
  }
});