import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Icon, IconName } from './Icon';

interface TextFieldProps extends TextInputProps {
  icon?: IconName;
  secure?: boolean;
  containerStyle?: object;
}

export function TextField({ icon, secure, containerStyle, style, ...rest }: TextFieldProps) {
  const [hidden, setHidden] = useState(Boolean(secure));

  return (
    <View style={[styles.container, containerStyle]}>
      {icon && <Icon name={icon} size={20} color={colors.textMuted} />}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, typography.body, style]}
        secureTextEntry={hidden}
        {...rest}
      />
      {secure && (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Icon name={hidden ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.field,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    height: 56,
    gap: spacing.md,
  },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 0 },
});

export { Text };
