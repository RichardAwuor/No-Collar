
import { StyleSheet } from 'react-native';

export const colors = {
  // Kenyan flag inspired colors with modern twist
  background: '#FFFFFF',
  backgroundDark: '#1A1A1A',
  
  text: '#2C2C2C',
  textDark: '#F5F5F5',
  
  textSecondary: '#6B6B6B',
  textSecondaryDark: '#A0A0A0',
  
  primary: '#006B3F', // Kenyan green
  primaryDark: '#00A859',
  
  secondary: '#BB0000', // Kenyan red
  secondaryDark: '#E63946',
  
  accent: '#FFD700', // Gold accent
  accentDark: '#FFC300',
  
  card: '#F8F9FA',
  cardDark: '#2A2A2A',
  
  highlight: '#E8F5E9',
  highlightDark: '#1B3A2F',
  
  border: '#E0E0E0',
  borderDark: '#404040',
  
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  info: '#17A2B8',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: colors.cardDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  inputDark: {
    backgroundColor: colors.cardDark,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDark: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
