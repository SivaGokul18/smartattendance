import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeGoogleUser {
  idToken: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}

export interface NativeGoogleAuthPlugin {
  signIn(options?: { clientId?: string }): Promise<NativeGoogleUser>;
}

export const NativeGoogleAuth = registerPlugin<NativeGoogleAuthPlugin>('NativeGoogleAuth');

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform();
};
