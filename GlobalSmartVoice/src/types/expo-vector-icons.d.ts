/**
 * Ambient module declaration for @expo/vector-icons.
 *
 * The IDE language server sometimes fails to resolve this package's exports
 * map when `customConditions: ["react-native"]` isn't fully honoured.
 * This file provides a direct ambient fallback that satisfies all imports
 * in this project without relying on the exports condition resolution.
 */

import type { ComponentType } from 'react';
import type { TextProps, OpaqueColorValue } from 'react-native';

export interface IconProps extends TextProps {
  name: string;
  size?: number;
  color?: string | OpaqueColorValue;
}

declare module '@expo/vector-icons' {
  const Ionicons: ComponentType<IconProps>;
  const MaterialIcons: ComponentType<IconProps>;
  const MaterialCommunityIcons: ComponentType<IconProps>;
  const FontAwesome: ComponentType<IconProps>;
  const FontAwesome5: ComponentType<IconProps>;
  const FontAwesome6: ComponentType<IconProps>;
  const Feather: ComponentType<IconProps>;
  const AntDesign: ComponentType<IconProps>;
  const Entypo: ComponentType<IconProps>;
  const EvilIcons: ComponentType<IconProps>;
  const Octicons: ComponentType<IconProps>;
  const SimpleLineIcons: ComponentType<IconProps>;
  const Zocial: ComponentType<IconProps>;

  export {
    Ionicons, MaterialIcons, MaterialCommunityIcons,
    FontAwesome, FontAwesome5, FontAwesome6,
    Feather, AntDesign, Entypo, EvilIcons,
    Octicons, SimpleLineIcons, Zocial,
  };
}
