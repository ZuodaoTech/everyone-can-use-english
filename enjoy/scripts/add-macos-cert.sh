#!/usr/bin/env sh

KEY_CHAIN=build.keychain
CERTIFICATE_P12=certificate.p12

# Recreate the certificate from the secure environment variable
echo $MACOS_CERTIFICATE_APPLICATION_BASE64 | base64 --decode > $CERTIFICATE_P12

#create a keychain
security create-keychain -p actions $KEY_CHAIN

# Make the keychain the default so identities are found
security default-keychain -s $KEY_CHAIN

# Unlock the keychain
security unlock-keychain -p actions $KEY_CHAIN

security import $CERTIFICATE_P12 -k $KEY_CHAIN -P $MACOS_CERTIFICATE_PASSWORD -T /usr/bin/codesign -T /usr/bin/productbuild;

security set-key-partition-list -S apple-tool:,apple: -s -k actions $KEY_CHAIN

# remove certs
rm -fr *.p12
